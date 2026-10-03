"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function MarkMessagesRead() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const now = new Date().toISOString()
      const { error, count } = await supabase
        .from("messages")
        .update({ read_at: now })
        .eq("recipient_id", user.id)
        .is("read_at", null)
        .select("id", { count: "exact" })
      if (error) {
        console.error("[MarkMessagesRead]", error)
        return
      }
      if (!cancelled && count && count > 0) {
        window.dispatchEvent(new Event("fixlink:messages-read"))
        router.refresh()
      }
    })()
    return () => { cancelled = true }
  }, [supabase, router])

  return null
}
