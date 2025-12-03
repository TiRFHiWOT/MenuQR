import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";

async function getShopsWithPrisma(userId: string, role: string) {
  if (role === "ADMIN") {
    // Admin sees all shops
    return await prisma.shop.findMany({
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
            tables: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } else if (role === "OWNER") {
    // Owner sees only their shops
    return await prisma.shop.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            menus: true,
            tables: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  return [];
}

async function getShopsWithSupabase(userId: string, role: string) {
  const supabase = createServerSupabaseClient();

  let query = supabase.from("Shop").select("*");

  if (role === "OWNER") {
    query = query.eq("ownerId", userId);
  }

  const { data: shops, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  if (!shops || shops.length === 0) {
    return [];
  }

  // Get owner info and counts for each shop
  const shopsWithDetails = await Promise.all(
    shops.map(async (shop) => {
      const [ownerResult, menusResult, tablesResult] = await Promise.all([
        supabase
          .from("User")
          .select("id, name, email")
          .eq("id", shop.ownerId)
          .single(),
        supabase
          .from("MenuItem")
          .select("id", { count: "exact", head: true })
          .eq("shopId", shop.id),
        supabase
          .from("Table")
          .select("id", { count: "exact", head: true })
          .eq("shopId", shop.id),
      ]);

      return {
        ...shop,
        owner: ownerResult.data || null,
        _count: {
          menus: menusResult.count || 0,
          tables: tablesResult.count || 0,
        },
      };
    })
  );

  return shopsWithDetails;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let shops;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      shops = await getShopsWithPrisma(session.user.id, session.user.role);
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
        shops = await getShopsWithSupabase(session.user.id, session.user.role);
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(shops);
  } catch (error: any) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch shops",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, location, ownerId } = await request.json();

    if (!name || !ownerId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let shop;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      shop = await prisma.shop.create({
        data: {
          name,
          location,
          ownerId,
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

      // Create default categories for the new shop
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
              shopId: shop.id,
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
        const shopId = createId();
        const now = new Date().toISOString();

        // Create shop via Supabase REST API
        const { data: newShop, error: shopError } = await supabase
          .from("Shop")
          .insert({
            id: shopId,
            name,
            location: location || null,
            ownerId,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single();

        if (shopError) {
          throw new Error(`Supabase error: ${shopError.message}`);
        }

        // Fetch owner info
        const { data: owner } = await supabase
          .from("User")
          .select("id, name, email")
          .eq("id", ownerId)
          .single();

        shop = {
          ...newShop,
          owner: owner || null,
        };

        // Create default categories for the new shop
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
          shopId: shop.id,
          createdAt: now,
          updatedAt: now,
        }));

        await supabase.from("Category").insert(categoriesToInsert);
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(shop, { status: 201 });
  } catch (error: any) {
    console.error("Error creating shop:", error);
    return NextResponse.json(
      {
        error: "Failed to create shop",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
