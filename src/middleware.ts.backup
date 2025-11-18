import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function middleware(req: NextRequest) {
  // Create Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get session from cookies
  const accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  // Protected routes
  const protectedRoutes = ["/dashboard", "/catalog", "/intent", "/feeds"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // If no tokens, redirect to login
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Verify session
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    } catch (error) {
      console.error("Middleware auth error:", error);
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/catalog/:path*",
    "/intent/:path*",
    "/feeds/:path*",
  ],
};
