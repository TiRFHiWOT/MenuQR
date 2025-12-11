import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getShopWithPrisma(shopId: string, userId: string, role: string) {
  // Prisma doesn't have Shop model, so always throw to use Supabase fallback
  throw new Error("P1001"); // Connection error to trigger fallback
}

async function getShopWithSupabase(
  shopId: string,
  userId: string,
  role: string
) {
  const supabase = createServerSupabaseClient();

  // Fetch shop
  const { data: shop, error: shopError } = await supabase
    .from("Shop")
    .select("*")
    .eq("id", shopId)
    .single();

  if (shopError || !shop) {
    return null;
  }

  // Check permissions
  if (role === "OWNER" && shop.ownerId !== userId) {
    throw new Error("Forbidden");
  }

  // Fetch owner info
  const { data: owner } = await supabase
    .from("User")
    .select("id, name, email")
    .eq("id", shop.ownerId)
    .single();

  // Fetch menus with categories
  const { data: menus } = await supabase
    .from("MenuItem")
    .select("*")
    .eq("shopId", shopId)
    .order("name", { ascending: true });

  // Fetch categories
  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .eq("shopId", shopId)
    .order("name", { ascending: true });

  // Fetch tables
  const { data: tables } = await supabase
    .from("Table")
    .select("*")
    .eq("shopId", shopId)
    .order("tableNumber", { ascending: true });

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
    ...shop,
    owner: owner || null,
    menus: menusWithCategories,
    tables: tables || [],
    categories: categories || [],
  };
}

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let shop;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      shop = await getShopWithPrisma(
        params.shopId,
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
        shop = await getShopWithSupabase(
          params.shopId,
          session.user.id,
          session.user.role
        );
      } else if (prismaError?.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        throw prismaError;
      }
    }

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error: any) {
    console.error("Error fetching shop:", error);
    if (error?.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch shop",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prisma doesn't have Shop model, use Supabase directly
    const supabase = createServerSupabaseClient();
    const shopId =
      params instanceof Promise ? (await params).shopId : params.shopId;

    const { error: deleteError } = await supabase
      .from("Shop")
      .delete()
      .eq("id", shopId);

    if (deleteError) {
      throw new Error(`Supabase error: ${deleteError.message}`);
    }

    return NextResponse.json({ message: "Shop deleted" });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return NextResponse.json(
      { error: "Failed to delete shop" },
      { status: 500 }
    );
  }
}
