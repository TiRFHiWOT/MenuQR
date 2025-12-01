import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tableNumber, shopId } = await request.json();

    if (!tableNumber || !shopId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify shop ownership
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop || shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if table number already exists for this shop
    const existing = await prisma.table.findUnique({
      where: {
        shopId_tableNumber: {
          shopId,
          tableNumber: parseInt(tableNumber),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Table number already exists" },
        { status: 400 }
      );
    }

    const table = await prisma.table.create({
      data: {
        tableNumber: parseInt(tableNumber),
        shopId,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
