import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { tableId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get table and verify ownership
    const table = await prisma.table.findUnique({
      where: { id: params.tableId },
      include: { shop: true },
    });

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    if (table.shop.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.table.delete({
      where: { id: params.tableId },
    });

    return NextResponse.json({ message: "Table deleted" });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { error: "Failed to delete table" },
      { status: 500 }
    );
  }
}
