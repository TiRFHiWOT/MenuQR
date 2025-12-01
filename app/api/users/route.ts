import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";

async function getUsersWithPrisma(role?: string | null) {
  const where = role ? { role: role as "ADMIN" | "OWNER" } : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

async function getUsersWithSupabase(role?: string | null) {
  const supabase = createServerSupabaseClient();

  let query = supabase.from("User").select("id, name, email, role");

  if (role) {
    query = query.eq("role", role);
  }

  const { data: users, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return users || [];
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let users;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      users = await getUsersWithPrisma(role);
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
        users = await getUsersWithSupabase(role);
      } else {
        throw prismaError;
      }
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
