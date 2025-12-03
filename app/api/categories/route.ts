import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";

async function getCategoriesWithPrisma(
  businessId: string,
  userId: string,
  role: string
) {
  // Verify business ownership if OWNER
  if (role === "OWNER") {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { ownerId: true },
    });

    if (!business || business.ownerId !== userId) {
      throw new Error("Forbidden");
    }
  }

  return await prisma.category.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
}

async function getCategoriesWithSupabase(
  businessId: string,
  userId: string,
  role: string
) {
  const supabase = createServerSupabaseClient();

  // Verify business ownership if OWNER
  if (role === "OWNER") {
    const { data: business } = await supabase
      .from("Business")
      .select("ownerId")
      .eq("id", businessId)
      .single();

    if (!business || business.ownerId !== userId) {
      throw new Error("Forbidden");
    }
  }

  const { data: categories, error } = await supabase
    .from("Category")
    .select("*")
    .eq("businessId", businessId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  // Get item counts for each category
  const categoriesWithCounts = await Promise.all(
    (categories || []).map(async (category) => {
      const { count } = await supabase
        .from("MenuItem")
        .select("*", { count: "exact", head: true })
        .eq("categoryId", category.id);

      return {
        ...category,
        _count: { items: count || 0 },
      };
    })
  );

  return categoriesWithCounts;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    let categories;

    try {
      categories = await getCategoriesWithPrisma(
        businessId,
        session.user.id,
        session.user.role
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
          "Prisma connection failed, using Supabase REST API as fallback for categories..."
        );
        categories = await getCategoriesWithSupabase(
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

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    if (error?.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        error: "Failed to fetch categories",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

async function createCategoryWithPrisma(data: {
  name: string;
  businessId: string;
  ownerId: string;
}) {
  // Verify business ownership
  const business = await prisma.business.findUnique({
    where: { id: data.businessId },
  });

  if (!business || business.ownerId !== data.ownerId) {
    throw new Error("Forbidden");
  }

  return await prisma.category.create({
    data: {
      name: data.name,
      businessId: data.businessId,
    },
  });
}

async function createCategoryWithSupabase(data: {
  name: string;
  businessId: string;
  ownerId: string;
}) {
  const supabase = createServerSupabaseClient();

  // Verify business ownership
  const { data: business, error: businessError } = await supabase
    .from("Business")
    .select("ownerId")
    .eq("id", data.businessId)
    .single();

  if (businessError || !business) {
    throw new Error("Business not found");
  }

  if (business.ownerId !== data.ownerId) {
    throw new Error("Forbidden");
  }

  const categoryId = createId();
  const now = new Date().toISOString();

  const { data: newCategory, error: categoryError } = await supabase
    .from("Category")
    .insert({
      id: categoryId,
      name: data.name,
      businessId: data.businessId,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (categoryError) {
    throw new Error(`Supabase error: ${categoryError.message}`);
  }

  return newCategory;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, businessId } = await request.json();

    if (!name || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields: name and businessId" },
        { status: 400 }
      );
    }

    let category;

    try {
      category = await createCategoryWithPrisma({
        name,
        businessId,
        ownerId: session.user.id,
      });
    } catch (prismaError: any) {
      const isConnectionError =
        prismaError?.code === "P1001" ||
        prismaError?.code === "P1013" ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.message?.includes("database string is invalid") ||
        prismaError?.message?.includes("provided arguments are not supported");

      if (isConnectionError) {
        console.log(
          "Prisma connection failed, using Supabase REST API as fallback for category creation..."
        );
        category = await createCategoryWithSupabase({
          name,
          businessId,
          ownerId: session.user.id,
        });
      } else if (prismaError?.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category:", error);
    if (error?.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        error: "Failed to create category",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
