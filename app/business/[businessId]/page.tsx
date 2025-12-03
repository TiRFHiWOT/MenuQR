import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import BusinessMenuClient from "./BusinessMenuClient";

interface PageProps {
  params: Promise<{
    businessId: string;
  }>;
}

async function getBusinessWithPrisma(businessId: string) {
  return await prisma.business.findUnique({
    where: { id: businessId },
    include: {
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
      categories: {
        orderBy: { name: "asc" },
      },
      branches: {
        orderBy: { name: "asc" },
      },
    },
  });
}

async function getBusinessWithSupabase(businessId: string) {
  const supabase = createServerSupabaseClient();

  const { data: business, error: businessError } = await supabase
    .from("Business")
    .select("*")
    .eq("id", businessId)
    .single();

  if (businessError || !business) {
    return null;
  }

  // Fetch menu items
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
    menus: menusWithCategories,
    categories: categories || [],
    branches: branches || [],
  };
}

export default async function BusinessMenuPage({ params }: PageProps) {
  const { businessId } = await params;

  let business;

  // Try Prisma first, fallback to Supabase REST API if Prisma fails
  try {
    business = await getBusinessWithPrisma(businessId);
  } catch (prismaError: any) {
    const isConnectionError =
      prismaError?.code === "P1001" ||
      prismaError?.code === "P1013" ||
      prismaError?.message?.includes("Can't reach database server") ||
      prismaError?.message?.includes("database string is invalid") ||
      prismaError?.message?.includes("provided arguments are not supported");

    if (isConnectionError) {
      console.log(
        "Prisma connection failed, using Supabase REST API as fallback for business menu..."
      );
      business = await getBusinessWithSupabase(businessId);
    } else {
      throw prismaError;
    }
  }

  if (!business) {
    notFound();
  }

  return <BusinessMenuClient business={business} businessId={businessId} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { businessId } = await params;

  let business;

  try {
    business = await prisma.business.findUnique({
      where: { id: businessId },
    });
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
        .from("Business")
        .select("name")
        .eq("id", businessId)
        .single();
      business = data;
    }
  }

  if (!business) {
    return {
      title: "Menu Not Found",
    };
  }

  return {
    title: `${business.name} - Menu`,
    description: `Digital menu for ${business.name}`,
  };
}
