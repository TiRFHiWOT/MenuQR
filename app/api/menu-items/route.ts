import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, price, imageUrl, shopId } = await request.json();

    // Validate required fields with detailed error messages
    const priceValue = typeof price === "string" ? parseFloat(price) : price;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    if (priceValue === null || priceValue === undefined || isNaN(priceValue)) {
      return NextResponse.json(
        { error: "Missing or invalid field: price" },
        { status: 400 }
      );
    }

    if (priceValue <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than 0" },
        { status: 400 }
      );
    }

    if (!shopId) {
      return NextResponse.json(
        { error: "Missing required field: shopId" },
        { status: 400 }
      );
    }

    let menuItem;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      // Verify shop ownership with Prisma
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
      });

      if (!shop || shop.ownerId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      menuItem = await prisma.menuItem.create({
        data: {
          name,
          price: priceValue,
          imageUrl,
          shopId,
        },
      });
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

        // Verify shop ownership with Supabase
        const { data: shop, error: shopError } = await supabase
          .from("Shop")
          .select("ownerId")
          .eq("id", shopId)
          .single();

        if (shopError || !shop) {
          return NextResponse.json(
            { error: "Shop not found" },
            { status: 404 }
          );
        }

        if (shop.ownerId !== session.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Create menu item via Supabase REST API
        const menuItemId = createId();
        const now = new Date().toISOString();

        const { data: newMenuItem, error: menuError } = await supabase
          .from("MenuItem")
          .insert({
            id: menuItemId,
            name,
            price: priceValue,
            imageUrl: imageUrl || null,
            shopId,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single();

        if (menuError) {
          throw new Error(`Supabase error: ${menuError.message}`);
        }

        menuItem = newMenuItem;
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error: any) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      {
        error: "Failed to create menu item",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
