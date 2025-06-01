import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;

  const publicPaths = ["/", "/login", "/register", "/api/auth"];
  const isPublicPath = publicPaths.some((path) => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(path)
  );

  // Check if requesting a public document
  if (request.nextUrl.pathname.startsWith("/documents/")) {
    const documentId = request.nextUrl.pathname.split("/")[2];
    if (!documentId) return NextResponse.next();

    try {
      const res = await fetch(`${request.nextUrl.origin}/api/documents/${documentId}`);
      const document = await res.json();
      
      if (document.isPublic) {
        return NextResponse.next();
      }
    } catch (error) {
      console.error("Error checking document visibility:", error);
    }
  }
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
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