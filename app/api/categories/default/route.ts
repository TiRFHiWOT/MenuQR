import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";

const DEFAULT_CATEGORIES = [
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

async function createDefaultCategoriesWithPrisma(
  shopId: string,
  ownerId: string
) {
  // Prisma doesn't have Shop model, so always throw to use Supabase fallback
  throw new Error("P1001"); // Connection error to trigger fallback
}

async function createDefaultCategoriesWithSupabase(
  shopId: string,
  ownerId: string
) {
  const supabase = createServerSupabaseClient();

  // Verify shop ownership
  const { data: shop, error: shopError } = await supabase
    .from("Shop")
    .select("ownerId")
    .eq("id", shopId)
    .single();

  if (shopError || !shop) {
    throw new Error("Shop not found");
  }

  if (shop.ownerId !== ownerId) {
    throw new Error("Forbidden");
  }

  // Check if categories already exist
  const { data: existingCategories } = await supabase
    .from("Category")
    .select("*")
    .eq("shopId", shopId);

  if (existingCategories && existingCategories.length > 0) {
    return existingCategories; // Return existing if any exist
  }

  // Create default categories
  const now = new Date().toISOString();
  const categoriesToInsert = DEFAULT_CATEGORIES.map((name) => ({
    id: createId(),
    name,
    shopId,
    createdAt: now,
    updatedAt: now,
  }));

  const { data: newCategories, error: categoryError } = await supabase
    .from("Category")
    .insert(categoriesToInsert)
    .select();

  if (categoryError) {
    throw new Error(`Supabase error: ${categoryError.message}`);
  }

  return newCategories || [];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    let categories;

    try {
      categories = await createDefaultCategoriesWithPrisma(
        shopId,
        session.user.id
      );
    } catch (prismaError: any) {
      const isConnectionError =
        prismaError?.code === "P1001" ||
        prismaError?.code === "P1013" ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.message?.includes("database string is invalid") ||
        prismaError?.message?.includes("provided arguments are not supported");

      if (isConnectionError) {
        console.log(
          "Prisma connection failed, using Supabase REST API as fallback for default categories..."
        );
        categories = await createDefaultCategoriesWithSupabase(
          shopId,
          session.user.id
        );
      } else if (prismaError?.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(categories, { status: 201 });
  } catch (error: any) {
    console.error("Error creating default categories:", error);
    if (error?.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        error: "Failed to create default categories",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
