import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes - only ADMIN role
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    // Owner routes - only OWNER role
    if (path.startsWith("/owner")) {
      if (token?.role !== "OWNER") {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes don't need auth
        if (
          path.startsWith("/business/") ||
          path.startsWith("/shop/") ||
          path.startsWith("/auth/") ||
          path === "/"
        ) {
          return true;
        }

        // Protected routes need token
        if (path.startsWith("/admin") || path.startsWith("/owner")) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/business/:path*"],
};
