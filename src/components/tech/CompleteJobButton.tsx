"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function CompleteJobButton({ bookingId }: { bookingId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function markDone() {
    setBusy(true)
    try {
      await supabase.from("bookings").update({ status: "awaiting_confirmation" }).eq("id", bookingId)
      router.refresh()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn-primary text-xs py-2 px-3">
        Mark done
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => setConfirming(false)} disabled={busy} className="btn-secondary text-xs py-2 px-3">Cancel</button>
      <button type="button" onClick={markDone} disabled={busy} className="btn-primary text-xs py-2 px-3">{busy ? "…" : "Confirm done"}</button>
    </div>
  )
}