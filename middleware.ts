import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  const publicPaths = ["/", "/login", "/register", "/api/auth"];
  const isPublicPath = publicPaths.some((path) => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path)
  );

  // Check if requesting a public document
  if (request.nextUrl.pathname.startsWith("/documents/")) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && 
    (request.nextUrl.pathname === "/login" || 
     request.nextUrl.pathname === "/register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};