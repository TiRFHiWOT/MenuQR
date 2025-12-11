import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getBusinessWithPrisma(
  businessId: string,
  userId: string,
  role: string
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      menus: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { name: "asc" },
      },
      branches: {
        orderBy: { name: "asc" },
      },
      categories: {
        orderBy: { name: "asc" },
      },
      _count: {
        select: {
          qrScans: true,
        },
      },
    },
  });

  if (!business) {
    return null;
  }

  // Check permissions
  if (role === "OWNER" && business.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  return business;
}

async function getBusinessWithSupabase(
  businessId: string,
  userId: string,
  role: string
) {
  const supabase = createServerSupabaseClient();

  // Fetch business
  const { data: business, error: businessError } = await supabase
    .from("Business")
    .select("*")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    return null;
  }

  // Check permissions
  if (role === "OWNER" && business.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  // Fetch owner info
  const { data: owner } = await supabase
    .from("User")
    .select("id, name, email")
    .eq("id", business.ownerId)
    .single();

  // Fetch menus with categories
  const { data: menus } = await supabase
    .from("MenuItem")
    .select("*")
    .eq("businessId", businessId)
    .order("name", { ascending: true });

  // Fetch categories
  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .eq("businessId", businessId)
    .order("name", { ascending: true });

  // Fetch branches
  const { data: branches } = await supabase
    .from("Branch")
    .select("*")
    .eq("businessId", businessId)
    .order("name", { ascending: true });

  // Fetch QR scan count
  const { count: scanCount } = await supabase
    .from("QRScan")
    .select("id", { count: "exact", head: true })
    .eq("businessId", businessId);

  // Map menus to include category info
  const menusWithCategories = (menus || []).map((menu) => {
    const category = categories?.find((cat) => cat.id === menu.categoryId);
    return {
      ...menu,
      category: category
        ? {
            id: category.id,
            name: category.name,
          }
        : null,
    };
  });

  return {
    ...business,
    owner: owner || null,
    menus: menusWithCategories,
    branches: branches || [],
    categories: categories || [],
    _count: {
      qrScans: scanCount || 0,
    },
  };
}

export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ businessId: string }> | { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const businessId =
      params instanceof Promise ? (await params).businessId : params.businessId;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let business;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      business = await getBusinessWithPrisma(
        businessId,
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
        business = await getBusinessWithSupabase(
          businessId,
          session.user.id,
          session.user.role
        );
      } else if (prismaError?.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        throw prismaError;
      }
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error("Error fetching business:", error);
    if (error?.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch business",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  {
    params,
  }: { params: Promise<{ businessId: string }> | { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const businessId =
      params instanceof Promise ? (await params).businessId : params.businessId;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, logoUrl } = await request.json();

    if (name && name.length > 50) {
      return NextResponse.json(
        { error: "Business name must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Check if business exists and user has permission
    let business;
    try {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Business")
        .select("*")
        .eq("id", businessId)
        .single();
      business = data;
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Only owner can update their business
    if (session.user.role !== "OWNER" || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let updatedBusiness;
    try {
      const updateData: any = {
        name: name || business.name,
        description:
          description !== undefined ? description : business.description,
      };
      if (logoUrl !== undefined) {
        updateData.logoUrl = logoUrl;
      }
      updatedBusiness = await prisma.business.update({
        where: { id: businessId },
        data: updateData,
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data, error: updateError } = await supabase
        .from("Business")
        .update({
          name: name || business.name,
          description:
            description !== undefined ? description : business.description,
          logoUrl: logoUrl !== undefined ? logoUrl : business.logoUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", businessId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Supabase error: ${updateError.message}`);
      }
      updatedBusiness = data;
    }

    return NextResponse.json(updatedBusiness);
  } catch (error: any) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      {
        error: "Failed to update business",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ businessId: string }> | { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const businessId =
      params instanceof Promise ? (await params).businessId : params.businessId;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if business exists and user has permission
    let business;
    try {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Business")
        .select("*")
        .eq("id", businessId)
        .single();
      business = data;
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Only owner can delete their business
    if (session.user.role !== "OWNER" || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      await prisma.business.delete({
        where: { id: businessId },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { error: deleteError } = await supabase
        .from("Business")
        .delete()
        .eq("id", businessId);

      if (deleteError) {
        throw new Error(`Supabase error: ${deleteError.message}`);
      }
    }

    return NextResponse.json({ message: "Business deleted" });
  } catch (error: any) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      {
        error: "Failed to delete business",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
