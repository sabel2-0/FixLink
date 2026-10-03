"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { LiveMap } from "./LiveMap"

export function LiveMapWrapper({
  bookingId,
  otherId,
  height = 320,
}: {
  bookingId: string
  otherId: string
  height?: number
}) {
  const supabase = createClient()
  const [meId, setMeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) setError("Not signed in")
      else setMeId(user.id)
    })()
    return () => { cancelled = true }
  }, [supabase])

  if (error) {
    return <p className="text-sm text-muted py-6 text-center">{error}</p>
  }

  if (!meId) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted bg-surface-2 rounded-xl"
        style={{ height }}
      >
        Loading map…
      </div>
    )
  }

  return <LiveMap bookingId={bookingId} meId={meId} otherId={otherId} height={height} />
}