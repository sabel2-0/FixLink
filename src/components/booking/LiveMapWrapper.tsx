"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { LiveMap } from "@/components/booking/LiveMap"

export function LiveMapWrapper({ technicianId }: { technicianId: string | null }) {
  const supabase = createClient()
  const [meId, setMeId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setMeId(user?.id || null)
    })()
  }, [supabase])

  if (!meId || !technicianId) {
    return <p className="text-sm text-muted py-4">Waiting for a technician to be assigned.</p>
  }

  return <LiveMap bookingId="" meId={meId} otherId={technicianId} height={320} />
}