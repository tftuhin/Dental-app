import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/error",
  "/book", // Public booking pages
];

// Next.js 16 "proxy" (formerly middleware): send signed-out visitors to the login page.
export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isPublicRoute = publicRoutes.some(
    (route) =>
      nextUrl.pathname.startsWith(route) || nextUrl.pathname === "/"
  );

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  if (isLoggedIn && nextUrl.pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
