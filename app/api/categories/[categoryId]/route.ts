import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getCategoryWithPrisma(categoryId: string, userId: string) {
  try {
    // Check if prisma.category exists (in case Prisma client wasn't regenerated)
    if (!prisma.category) {
      throw new Error("Prisma category model not available");
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        business: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!category) {
      return null;
    }

    if (category.business.ownerId !== userId) {
      return null;
    }

    return category;
  } catch (error: any) {
    // If any error occurs with Prisma, throw it so we can fall back to Supabase
    throw error;
  }
}

async function getCategoryWithSupabase(categoryId: string, userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: category, error: categoryError } = await supabase
    .from("Category")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (categoryError || !category) {
    return null;
  }

  const { data: business } = await supabase
    .from("Business")
    .select("id, ownerId")
    .eq("id", category.businessId)
    .single();

  if (!business || business.ownerId !== userId) {
    return null;
  }

  return {
    ...category,
    business: {
      id: business.id,
      ownerId: business.ownerId,
    },
  };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { categoryId } = await params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    let category;

    try {
      category = await getCategoryWithPrisma(categoryId, session.user.id);
    } catch (prismaError: any) {
      // Always fall back to Supabase if Prisma fails for any reason
      console.log(
        "Prisma failed, using Supabase REST API as fallback for category update...",
        prismaError?.message
      );
      category = await getCategoryWithSupabase(categoryId, session.user.id);
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    let updated;

    try {
      // Check if prisma.category exists
      if (!prisma.category) {
        throw new Error("Prisma category model not available");
      }

      updated = await prisma.category.update({
        where: { id: categoryId },
        data: { name },
      });
    } catch (prismaError: any) {
      // Always fall back to Supabase if Prisma fails
      console.log(
        "Prisma update failed, using Supabase REST API as fallback...",
        prismaError?.message
      );
      const supabase = createServerSupabaseClient();
      const now = new Date().toISOString();

      const { data: updatedCategory, error: updateError } = await supabase
        .from("Category")
        .update({
          name,
          updatedAt: now,
        })
        .eq("id", categoryId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Supabase error: ${updateError.message}`);
      }

      updated = updatedCategory;
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      {
        error: "Failed to update category",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { categoryId } = await params;

    let category;

    try {
      category = await getCategoryWithPrisma(categoryId, session.user.id);
    } catch (prismaError: any) {
      // Always fall back to Supabase if Prisma fails for any reason
      console.log(
        "Prisma failed, using Supabase REST API as fallback for category deletion...",
        prismaError?.message
      );
      category = await getCategoryWithSupabase(categoryId, session.user.id);
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check if category has items - if so, set their categoryId to null instead of deleting
    try {
      // Check if Prisma models exist
      if (!prisma.menuItem || !prisma.category) {
        throw new Error("Prisma models not available");
      }

      await prisma.menuItem.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      });

      await prisma.category.delete({
        where: { id: categoryId },
      });
    } catch (prismaError: any) {
      // Always fall back to Supabase if Prisma fails
      console.log(
        "Prisma delete failed, using Supabase REST API as fallback...",
        prismaError?.message
      );
      const supabase = createServerSupabaseClient();

      // Set categoryId to null for all menu items in this category
      const { error: updateError } = await supabase
        .from("MenuItem")
        .update({ categoryId: null })
        .eq("categoryId", categoryId);

      if (updateError) {
        console.error("Error updating menu items:", updateError);
        // Continue anyway - we'll try to delete the category
      }

      // Delete the category
      const { error: deleteError } = await supabase
        .from("Category")
        .delete()
        .eq("id", categoryId);

      if (deleteError) {
        throw new Error(`Supabase error: ${deleteError.message}`);
      }
    }

    return NextResponse.json({ message: "Category deleted" });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      {
        error: "Failed to delete category",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
