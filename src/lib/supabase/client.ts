import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

/**
 * Singleton Supabase browser client.
 *
 * Why singleton: createBrowserClient uses navigator.locks for auth coordination.
 * Multiple instances (one per component render) race for the same lock and
 * deadlock — queries hang before ever hitting the network.
 */
export function createClient() {
  if (client) return client
  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return client
}
