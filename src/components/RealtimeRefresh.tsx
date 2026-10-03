"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Subscribes to the given table and calls router.refresh() on any change.
 * The server component refetches → UI updates without a manual reload.
 *
 * For a filter on a specific row, pass `filter` (e.g. `booking_id=eq.<uuid>`).
 */
export function RealtimeRefresh({
  tables,
  filter,
}: {
  tables: string[]
  filter?: string
}) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channelName = "rt:" + tables.join(",") + (filter ? ":" + filter : "")
    let channel = supabase.channel(channelName)

    for (const table of tables) {
      channel = channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) } as any,
        () => router.refresh()
      )
    }
    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tables.join(","), filter, supabase, router])

  return null
}