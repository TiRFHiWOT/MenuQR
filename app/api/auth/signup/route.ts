import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerSupabaseClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

async function createUserWithPrisma(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "OWNER";
}) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  return user;
}

async function createUserWithSupabase(data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "OWNER";
}) {
  const supabase = createServerSupabaseClient();

  // Check if user already exists
  const { data: existingUsers } = await supabase
    .from("User")
    .select("id, email")
    .eq("email", data.email)
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Generate CUID for user ID (same format Prisma uses)
  const userId = createId();

  // Get current timestamp for createdAt and updatedAt
  const now = new Date().toISOString();

  // Create user via Supabase REST API
  const { data: user, error } = await supabase
    .from("User")
    .insert({
      id: userId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Supabase error: ${error.message}`);
  }

  return user;
}

export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let user;

    // Try Prisma first, fallback to Supabase REST API if Prisma fails
    try {
      user = await createUserWithPrisma({ name, email, password, role });
    } catch (prismaError: any) {
      // If Prisma fails due to connection issue or invalid connection string, use Supabase REST API
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
        user = await createUserWithSupabase({ name, email, password, role });
      } else {
        // Re-throw if it's a different error (like "User already exists")
        throw prismaError;
      }
    }

    return NextResponse.json({
      message: "User created successfully",
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);

    // Handle "User already exists" error
    if (error?.message === "User already exists") {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create user",
        details:
          process.env.NODE_ENV === "development" ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}
