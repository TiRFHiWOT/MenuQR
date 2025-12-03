import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getMenuItemWithPrisma(itemId: string, userId: string) {
  const menuItem = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!menuItem) {
    return null;
  }

  // Verify ownership
  if (menuItem.business.ownerId !== userId) {
    return null;
  }

  return menuItem;
}

async function getMenuItemWithSupabase(itemId: string, userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: menuItem, error: itemError } = await supabase
    .from("MenuItem")
    .select("*")
    .eq("id", itemId)
    .single();

  if (itemError || !menuItem) {
    return null;
  }

  // Verify ownership
  const { data: business } = await supabase
    .from("Business")
    .select("id, name, ownerId")
    .eq("id", menuItem.businessId)
    .single();

  if (!business || business.ownerId !== userId) {
    return null;
  }

  return {
    ...menuItem,
    business: {
      id: business.id,
      name: business.name,
      ownerId: business.ownerId,
    },
  };
}

export async function GET(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let menuItem;

    try {
      menuItem = await getMenuItemWithPrisma(params.itemId, session.user.id);
    } catch (prismaError: any) {
      const isConnectionError =
        prismaError?.code === "P1001" ||
        prismaError?.code === "P1013" ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.message?.includes("database string is invalid") ||
        prismaError?.message?.includes("provided arguments are not supported");

      if (isConnectionError) {
        console.log(
          "Prisma connection failed, using Supabase REST API as fallback for GET /api/menu-items/[itemId]..."
        );
        menuItem = await getMenuItemWithSupabase(
          params.itemId,
          session.user.id
        );
      } else {
        throw prismaError;
      }
    }

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(menuItem);
  } catch (error: any) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch menu item",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, price, imageUrl, categoryId } = await request.json();

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category is required. Please select a category." },
        { status: 400 }
      );
    }

    // Get menu item and verify ownership
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: params.itemId },
      include: { business: true },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    if (menuItem.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let updated;

    try {
      updated = await prisma.menuItem.update({
        where: { id: params.itemId },
        data: {
          name,
          price: parseFloat(price),
          imageUrl,
          categoryId,
        },
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
          "Prisma connection failed, using Supabase REST API as fallback for menu item update..."
        );
        const supabase = createServerSupabaseClient();
        const now = new Date().toISOString();

        const { data: updatedItem, error: updateError } = await supabase
          .from("MenuItem")
          .update({
            name,
            price: parseFloat(price),
            imageUrl: imageUrl || null,
            categoryId,
            updatedAt: now,
          })
          .eq("id", params.itemId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Supabase error: ${updateError.message}`);
        }

        updated = updatedItem;
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      {
        error: "Failed to update menu item",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get menu item and verify ownership
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: params.itemId },
      include: { business: true },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    if (menuItem.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.menuItem.delete({
      where: { id: params.itemId },
    });

    return NextResponse.json({ message: "Menu item deleted" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
