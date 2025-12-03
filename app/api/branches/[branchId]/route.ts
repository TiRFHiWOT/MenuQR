import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> | { branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const branchId =
      params instanceof Promise ? (await params).branchId : params.branchId;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, address } = await request.json();

    // Get branch and verify ownership
    let branch;
    try {
      branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { business: true },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data: branchData } = await supabase
        .from("Branch")
        .select("*, business:Business(*)")
        .eq("id", branchId)
        .single();
      branch = branchData;
    }

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const business = branch.business || branch.businessId;
    const businessId = typeof business === "string" ? business : business.id;
    const ownerId =
      typeof business === "string" ? null : (business as any).ownerId || null;

    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let updatedBranch;
    try {
      updatedBranch = await prisma.branch.update({
        where: { id: branchId },
        data: {
          name: name || branch.name,
          address: address !== undefined ? address : branch.address,
        },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data, error: updateError } = await supabase
        .from("Branch")
        .update({
          name: name || branch.name,
          address: address !== undefined ? address : branch.address,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", branchId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Supabase error: ${updateError.message}`);
      }
      updatedBranch = data;
    }

    return NextResponse.json(updatedBranch);
  } catch (error: any) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      {
        error: "Failed to update branch",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ branchId: string }> | { branchId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const branchId =
      params instanceof Promise ? (await params).branchId : params.branchId;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get branch and verify ownership
    let branch;
    try {
      branch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { business: true },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data: branchData } = await supabase
        .from("Branch")
        .select("*, business:Business(*)")
        .eq("id", branchId)
        .single();
      branch = branchData;
    }

    if (!branch) {
      return NextResponse.json({ error: "Branch not found" }, { status: 404 });
    }

    const business = branch.business || branch.businessId;
    const ownerId =
      typeof business === "string" ? null : (business as any).ownerId || null;

    if (!ownerId || ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      await prisma.branch.delete({
        where: { id: branchId },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { error: deleteError } = await supabase
        .from("Branch")
        .delete()
        .eq("id", branchId);

      if (deleteError) {
        throw new Error(`Supabase error: ${deleteError.message}`);
      }
    }

    return NextResponse.json({ message: "Branch deleted" });
  } catch (error: any) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      {
        error: "Failed to delete branch",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
