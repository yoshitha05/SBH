import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabaseServer";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const section =
    pathname.startsWith("/admin")  ? "admin"  :
    pathname.startsWith("/owner")  ? "owner"  :
    pathname.startsWith("/tenant") ? "tenant" :
    null;

  // Not a protected section — let it through without touching Supabase at all
  if (!section) return NextResponse.next();

  const { supabase, response } = createMiddlewareClient(request);

  // Real session check — this replaces the old "is there a leaseiq_role
  // cookie" check with "is there an actual logged-in Supabase user?"
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Look up this user's role from the profiles table
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role) {
    // Logged in, but no profile/role set up — send back to login rather
    // than letting them into a section with no defined permissions.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (profile.role !== section) {
    return NextResponse.redirect(new URL(`/${profile.role}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/owner/:path*", "/tenant/:path*"],
};
