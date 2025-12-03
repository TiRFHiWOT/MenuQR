import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getTableWithPrisma(tableId: string, userId: string) {
  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { shop: true },
  });

  if (!table) {
    return null;
  }

  if (table.shop.ownerId !== userId) {
    return null;
  }

  return table;
}

async function getTableWithSupabase(tableId: string, userId: string) {
  const supabase = createServerSupabaseClient();

  const { data: table, error: tableError } = await supabase
    .from("Table")
    .select("*")
    .eq("id", tableId)
    .single();

  if (tableError || !table) {
    return null;
  }

  // Verify ownership
  const { data: shop } = await supabase
    .from("Shop")
    .select("ownerId")
    .eq("id", table.shopId)
    .single();

  if (!shop || shop.ownerId !== userId) {
    return null;
  }

  return table;
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tableId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tableId } = await params;

    let table;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      table = await getTableWithPrisma(tableId, session.user.id);
    } catch (prismaError: any) {
      const isConnectionError =
        prismaError?.code === "P1001" ||
        prismaError?.code === "P1013" ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.message?.includes("database string is invalid") ||
        prismaError?.message?.includes("provided arguments are not supported");

      if (isConnectionError) {
        console.log(
          "Prisma connection failed, using Supabase REST API as fallback for table deletion..."
        );
        table = await getTableWithSupabase(tableId, session.user.id);
      } else {
        throw prismaError;
      }
    }

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Delete table
    try {
      await prisma.table.delete({
        where: { id: tableId },
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
        const { error: deleteError } = await supabase
          .from("Table")
          .delete()
          .eq("id", tableId);

        if (deleteError) {
          throw new Error(`Supabase error: ${deleteError.message}`);
        }
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json({ message: "Table deleted" });
  } catch (error: any) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      {
        error: "Failed to delete table",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
