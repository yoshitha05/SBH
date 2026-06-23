// lib/supabaseServer.ts
//
// Server-side Supabase client, used in middleware and server components
// where we need to read/write the user's session via cookies. This is
// DIFFERENT from lib/supabaseClient.ts (the browser client) — middleware
// runs on the server, before any page JavaScript loads, so it needs this
// cookie-aware version to check "is this person actually logged in?"

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  return { supabase, response };
}
