import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import UniversalMenuClient from "./UniversalMenuClient";

interface PageProps {
  params: Promise<{
    shopId: string;
  }>;
}

async function getShopWithPrisma(shopId: string) {
  // Prisma doesn't have Shop model, so always throw to use Supabase fallback
  throw new Error("P1001"); // Connection error to trigger fallback
}

async function getShopWithSupabase(shopId: string) {
  const supabase = createServerSupabaseClient();

  const { data: shop, error: shopError } = await supabase
    .from("Shop")
    .select("*")
    .eq("id", shopId)
    .single();

  if (shopError || !shop) {
    return null;
  }

  // Fetch menu items with categories
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
    menus: menusWithCategories,
    tables: tables || [],
    categories: categories || [],
  };
}

export default async function UniversalMenuPage({ params }: PageProps) {
  const { shopId } = await params;

  let shop;

  // Try Prisma first, fallback to Supabase REST API if Prisma fails
  try {
    shop = await getShopWithPrisma(shopId);
  } catch (prismaError: any) {
    const isConnectionError =
      prismaError?.code === "P1001" ||
      prismaError?.code === "P1013" ||
      prismaError?.message?.includes("Can't reach database server") ||
      prismaError?.message?.includes("database string is invalid") ||
      prismaError?.message?.includes("provided arguments are not supported");

    if (isConnectionError) {
      console.log(
        "Prisma connection failed, using Supabase REST API as fallback for universal menu..."
      );
      shop = await getShopWithSupabase(shopId);
    } else {
      throw prismaError;
    }
  }

  if (!shop) {
    notFound();
  }

  return <UniversalMenuClient shop={shop} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { shopId } = await params;

  let shop;

  try {
    // Prisma doesn't have Shop model, so always throw to use Supabase fallback
    throw new Error("P1001"); // Connection error to trigger fallback
  } catch (prismaError: any) {
    const isConnectionError =
      prismaError?.code === "P1001" ||
      prismaError?.code === "P1013" ||
      prismaError?.message?.includes("Can't reach database server") ||
      prismaError?.message?.includes("database string is invalid") ||
      prismaError?.message?.includes("provided arguments are not supported");

    if (isConnectionError) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Shop")
        .select("name")
        .eq("id", shopId)
        .single();
      shop = data;
    }
  }

  if (!shop) {
    return {
      title: "Menu Not Found",
    };
  }

  return {
    title: `${shop.name} - Menu`,
    description: `Digital menu for ${shop.name}`,
  };
}
