import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createId } from "@paralleldrive/cuid2";

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

    // Verify user has access to this business
    let business;
    try {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Business")
        .select("*")
        .eq("id", businessId)
        .single();
      business = data;
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (session.user.role === "OWNER" && business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let branches;
    try {
      branches = await prisma.branch.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data, error: branchError } = await supabase
        .from("Branch")
        .select("*")
        .eq("businessId", businessId)
        .order("name", { ascending: true });

      if (branchError) {
        throw new Error(`Supabase error: ${branchError.message}`);
      }
      branches = data || [];
    }

    return NextResponse.json(branches);
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch branches",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, address, businessId } = await request.json();

    if (!name || !businessId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user owns this business
    let business;
    try {
      business = await prisma.business.findUnique({
        where: { id: businessId },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const { data } = await supabase
        .from("Business")
        .select("*")
        .eq("id", businessId)
        .single();
      business = data;
    }

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    if (business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let branch;
    try {
      branch = await prisma.branch.create({
        data: {
          name,
          address: address || null,
          businessId,
        },
      });
    } catch (error) {
      const supabase = createServerSupabaseClient();
      const branchId = createId();
      const now = new Date().toISOString();

      const { data, error: branchError } = await supabase
        .from("Branch")
        .insert({
          id: branchId,
          name,
          address: address || null,
          businessId,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (branchError) {
        throw new Error(`Supabase error: ${branchError.message}`);
      }
      branch = data;
    }

    return NextResponse.json(branch, { status: 201 });
  } catch (error: any) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      {
        error: "Failed to create branch",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
