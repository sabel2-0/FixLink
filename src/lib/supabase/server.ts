import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/types/database.types"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a read-only context: RSC render, generateMetadata,
            // or a page/layout. Next.js 15 forbids cookie writes here. Safe to
            // ignore — middleware (or the next Server Action) will refresh the
            // session on the next mutation. Without this guard, Supabase's
            // token rotation throws an unhandled rejection and the request
            // hangs until Vercel's runtime timeout.
          }
        },
      },
    }
  )
}