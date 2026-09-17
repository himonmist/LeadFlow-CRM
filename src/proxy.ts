import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.roleName;

  const isAppRoute = pathname.startsWith("/app");
  const isSuperAdminRoute = pathname.startsWith("/super-admin");

  if ((isAppRoute || isSuperAdminRoute) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isSuperAdminRoute && role && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/app/dashboard", req.url));
  }

  if (isAppRoute && role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/super-admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/super-admin/:path*"],
};
