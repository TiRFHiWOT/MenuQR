import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";

async function createTableWithPrisma(data: {
  tableNumber: number;
  shopId: string;
  ownerId: string;
}) {
  // Verify shop ownership
  const shop = await prisma.shop.findUnique({
    where: { id: data.shopId },
  });

  if (!shop || shop.ownerId !== data.ownerId) {
    throw new Error("Forbidden");
  }

  // Check if table number already exists for this shop
  const existing = await prisma.table.findUnique({
    where: {
      shopId_tableNumber: {
        shopId: data.shopId,
        tableNumber: data.tableNumber,
      },
    },
  });

  if (existing) {
    throw new Error("Table number already exists");
  }

  return await prisma.table.create({
    data: {
      tableNumber: data.tableNumber,
      shopId: data.shopId,
    },
  });
}

async function createTableWithSupabase(data: {
  tableNumber: number;
  shopId: string;
  ownerId: string;
}) {
  const supabase = createServerSupabaseClient();

  // Verify shop ownership with Supabase
  const { data: shop, error: shopError } = await supabase
    .from("Shop")
    .select("ownerId")
    .eq("id", data.shopId)
    .single();

  if (shopError || !shop) {
    throw new Error("Shop not found");
  }

  if (shop.ownerId !== data.ownerId) {
    throw new Error("Forbidden");
  }

  // Check if table number already exists for this shop
  const { data: existingTables } = await supabase
    .from("Table")
    .select("id")
    .eq("shopId", data.shopId)
    .eq("tableNumber", data.tableNumber)
    .limit(1);

  if (existingTables && existingTables.length > 0) {
    throw new Error("Table number already exists");
  }

  // Create table via Supabase REST API
  const tableId = createId();
  const now = new Date().toISOString();

  const { data: newTable, error: tableError } = await supabase
    .from("Table")
    .insert({
      id: tableId,
      tableNumber: data.tableNumber,
      shopId: data.shopId,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (tableError) {
    throw new Error(`Supabase error: ${tableError.message}`);
  }

  return newTable;
}

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

    const tableNumberInt = parseInt(tableNumber);

    if (isNaN(tableNumberInt) || tableNumberInt < 1) {
      return NextResponse.json(
        { error: "Invalid table number" },
        { status: 400 }
      );
    }

    let table;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      table = await createTableWithPrisma({
        tableNumber: tableNumberInt,
        shopId,
        ownerId: session.user.id,
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
          "Prisma connection failed, using Supabase REST API as fallback for POST /api/tables..."
        );
        try {
          table = await createTableWithSupabase({
            tableNumber: tableNumberInt,
            shopId,
            ownerId: session.user.id,
          });
        } catch (supabaseError: any) {
          // Handle specific Supabase errors
          if (supabaseError.message === "Table number already exists") {
            return NextResponse.json(
              { error: "Table number already exists" },
              { status: 400 }
            );
          }
          if (supabaseError.message === "Forbidden") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
          throw supabaseError;
        }
      } else {
        // Handle Prisma-specific errors
        if (prismaError.message === "Table number already exists") {
          return NextResponse.json(
            { error: "Table number already exists" },
            { status: 400 }
          );
        }
        if (prismaError.message === "Forbidden") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        throw prismaError;
      }
    }

    return NextResponse.json(table, { status: 201 });
  } catch (error: any) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      {
        error: "Failed to create table",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
