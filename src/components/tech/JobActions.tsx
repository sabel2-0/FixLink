"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const FLOW: Record<string, { label: string; next: string }> = {
  confirmed:     { label: "Drive",     next: "en_route" },
  en_route:      { label: "Arrived",   next: "arrived" },
  arrived:       { label: "Start",     next: "in_progress" },
}

export function JobActions({ bookingId, status }: { bookingId: string; status: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const step = FLOW[status]

  async function advance(next: string) {
    setBusy(true)
    try {
      await supabase.from("bookings").update({ status: next }).eq("id", bookingId)
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (!step) return null

  return (
    <button
      type="button"
      onClick={() => advance(step.next)}
      disabled={busy}
      className="btn-primary text-xs py-2 px-3"
    >
      {busy ? "..." : step.label}
    </button>
  )
}