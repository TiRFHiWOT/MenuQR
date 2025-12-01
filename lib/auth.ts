import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { createServerSupabaseClient } from "./supabase";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        let user;

        // Try Prisma first, fallback to Supabase REST API if Prisma fails
        try {
          user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
        } catch (prismaError: any) {
          // If Prisma fails due to connection issue, use Supabase REST API
          const isConnectionError =
            prismaError?.code === "P1001" ||
            prismaError?.code === "P1013" ||
            prismaError?.message?.includes("Can't reach database server") ||
            prismaError?.message?.includes("database string is invalid") ||
            prismaError?.message?.includes(
              "provided arguments are not supported"
            );

          if (isConnectionError) {
            console.log(
              "Prisma connection failed during login, using Supabase REST API as fallback..."
            );
            const supabase = createServerSupabaseClient();
            const { data: users, error } = await supabase
              .from("User")
              .select("*")
              .eq("email", credentials.email)
              .limit(1);

            if (error || !users || users.length === 0) {
              return null;
            }

            user = users[0];
          } else {
            // Re-throw if it's a different error
            throw prismaError;
          }
        }

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

declare module "next-auth" {
  interface User {
    role: string;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
  }
}
