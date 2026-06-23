// lib/supabaseClient.ts
//
// Single shared Supabase client for the app. Import this anywhere
// you need to read/write data from Supabase, e.g.:
//
//   import { supabase } from "@/lib/supabaseClient";
//   const { data, error } = await supabase.from("tenants").select("*");
//
// IMPORTANT: this uses createBrowserClient from @supabase/ssr, NOT plain
// createClient from @supabase/supabase-js. The plain client stores the
// session in localStorage, which middleware (running server-side, before
// any page JS loads) can never see — that mismatch is what caused
// "login succeeds but middleware always redirects back to /login."
// createBrowserClient stores the session as real cookies instead, so the
// browser and the middleware/server are reading the exact same session.

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Check that .env.local has " +
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY set, then restart `npm run dev`."
  );
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
