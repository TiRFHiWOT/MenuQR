import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";
import QRCode from "qrcode";

async function getBusinessesWithPrisma(userId: string, role: string) {
  if (role === "ADMIN") {
    // Admin sees all businesses
    return await prisma.business.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            menus: true,
            branches: true,
            qrScans: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "OWNER") {
    // Owner sees only their businesses
    return await prisma.business.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            menus: true,
            branches: true,
            qrScans: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  return [];
}

async function getBusinessesWithSupabase(userId: string, role: string) {
  const supabase = createServerSupabaseClient();

  let query = supabase.from("Business").select("*");

  if (role === "OWNER") {
    query = query.eq("ownerId", userId);
  }

  const { data: businesses, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!businesses || businesses.length === 0) {
    return [];
  }

  // Get owner info and counts for each business
  const businessesWithDetails = await Promise.all(
    businesses.map(async (business) => {
      const [ownerResult, menusResult, branchesResult, scansResult] =
        await Promise.all([
          supabase
            .from("User")
            .select("id, name, email")
            .eq("id", business.ownerId)
            .single(),
          supabase
            .from("MenuItem")
            .select("id", { count: "exact", head: true })
            .eq("businessId", business.id),
          supabase
            .from("Branch")
            .select("id", { count: "exact", head: true })
            .eq("businessId", business.id),
          supabase
            .from("QRScan")
            .select("id", { count: "exact", head: true })
            .eq("businessId", business.id),
        ]);

      return {
        ...business,
        owner: ownerResult.data || null,
        _count: {
          menus: menusResult.count || 0,
          branches: branchesResult.count || 0,
          qrScans: scansResult.count || 0,
        },
      };
    })
  );

  return businessesWithDetails;
}

async function generateQRCode(
  businessId: string,
  request?: Request
): Promise<string> {
  // Prioritize NEXT_PUBLIC_BASE_URL from environment
  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  // If not set, try NEXTAUTH_URL
  if (!baseUrl) {
    baseUrl = process.env.NEXTAUTH_URL;
  }

  // If still not set, try to get from request headers
  if (!baseUrl && request) {
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      baseUrl = `${protocol}://${host}`;
    }
  }

  // Fallback to localhost only if no other option
  if (!baseUrl) {
    baseUrl = "http://localhost:3000";
  }

  // Log for debugging (remove in production)
  if (process.env.NODE_ENV === "development") {
    console.log("QR Code Base URL:", baseUrl);
  }

  // Ensure the URL is properly formatted
  const qrUrl = `${baseUrl.replace(/\/$/, "")}/business/${businessId}`;

  try {
    // Generate QR code with URL mode to ensure it's recognized as a URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      type: "image/png",
      errorCorrectionLevel: "M",
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let businesses;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      businesses = await getBusinessesWithPrisma(
        session.user.id,
        session.user.role
      );
    } catch (prismaError: any) {
      // If Prisma fails due to connection issue, use Supabase REST API
      const isConnectionError =
        prismaError?.code === "P1001" ||
        prismaError?.code === "P1013" ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.message?.includes("database string is invalid") ||
        prismaError?.message?.includes("provided arguments are not supported");

      if (isConnectionError) {
        console.log(
          "Prisma connection failed, using Supabase REST API as fallback..."
        );
        businesses = await getBusinessesWithSupabase(
          session.user.id,
          session.user.role
        );
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(businesses);
  } catch (error: any) {
    console.error("Error fetching businesses:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch businesses",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestForQR = request;
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owners can create businesses (not admins)
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, description, logoUrl } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "Business name must be 50 characters or less" },
        { status: 400 }
      );
    }

    let business;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      const businessId = createId();
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXTAUTH_URL ||
        "http://localhost:3000";
      const qrCodeDataUrl = await generateQRCode(businessId, requestForQR);

      business = await prisma.business.create({
        data: {
          id: businessId,
          name,
          description: description || null,
          logoUrl: logoUrl || null,
          ownerId: session.user.id,
          qrCodeUrl: qrCodeDataUrl,
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Auto-create main branch
      await prisma.branch.create({
        data: {
          name: `${name} - Main Branch`,
          address: description || null,
          businessId: business.id,
        },
      });

      // Create default categories for the new business
      const defaultCategories = [
        "Breakfast",
        "Lunch",
        "Dinner",
        "Appetizers",
        "Main Courses",
        "Desserts",
        "Drinks",
        "Beverages",
        "Specials",
      ];

      await Promise.all(
        defaultCategories.map((categoryName) =>
          prisma.category.create({
            data: {
              name: categoryName,
              businessId: business.id,
            },
          })
        )
      );
    } catch (prismaError: any) {
      // If Prisma fails due to connection issue, use Supabase REST API
      const isConnectionError =
        prismaError?.code === "P1001" ||
        prismaError?.code === "P1013" ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.message?.includes("database string is invalid") ||
        prismaError?.message?.includes("provided arguments are not supported");

      if (isConnectionError) {
        console.log(
          "Prisma connection failed, using Supabase REST API as fallback..."
        );
        const supabase = createServerSupabaseClient();
        const businessId = createId();
        const now = new Date().toISOString();

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.NEXTAUTH_URL ||
          "http://localhost:3000";
        const qrCodeDataUrl = await generateQRCode(businessId, requestForQR);

        // Create business via Supabase REST API
        const { data: newBusiness, error: businessError } = await supabase
          .from("Business")
          .insert({
            id: businessId,
            name,
            description: description || null,
            logoUrl: logoUrl || null,
            ownerId: session.user.id,
            qrCodeUrl: qrCodeDataUrl,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single();

        if (businessError) {
          throw new Error(`Supabase error: ${businessError.message}`);
        }

        // Auto-create main branch
        const branchId = createId();
        await supabase.from("Branch").insert({
          id: branchId,
          name: `${name} - Main Branch`,
          address: description || null,
          businessId: businessId,
          createdAt: now,
          updatedAt: now,
        });

        // Fetch owner info
        const { data: owner } = await supabase
          .from("User")
          .select("id, name, email")
          .eq("id", session.user.id)
          .single();

        business = {
          ...newBusiness,
          owner: owner || null,
        };

        // Create default categories for the new business
        const defaultCategories = [
          "Breakfast",
          "Lunch",
          "Dinner",
          "Appetizers",
          "Main Courses",
          "Desserts",
          "Drinks",
          "Beverages",
          "Specials",
        ];

        const categoriesToInsert = defaultCategories.map((name) => ({
          id: createId(),
          name,
          businessId: business.id,
          createdAt: now,
          updatedAt: now,
        }));

        await supabase.from("Category").insert(categoriesToInsert);
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(business, { status: 201 });
  } catch (error: any) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      {
        error: "Failed to create business",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
