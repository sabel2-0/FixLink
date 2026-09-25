"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function VerifyButtons({
  technicianId,
  currentStatus,
}: {
  technicianId: string
  currentStatus: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setStatus(status: "verified" | "rejected") {
    setBusy(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    await supabase
      .from("technician_profiles")
      .update({
        cert_status: status,
        cert_reviewed_at: new Date().toISOString(),
        cert_reviewed_by: user?.id,
      })
      .eq("id", technicianId)

    setBusy(false)
    router.refresh()
  }

  if (currentStatus === "verified") {
    return (
      <button disabled={busy} onClick={() => setStatus("rejected")} className="btn-link text-xs" style={{ color: "var(--danger)" }}>
        Unverify
      </button>
    )
  }

  return (
    <div className="flex gap-3 justify-end">
      <button disabled={busy} onClick={() => setStatus("verified")} className="btn-link text-xs">
        Verify
      </button>
      <button disabled={busy} onClick={() => setStatus("rejected")} className="btn-link text-xs" style={{ color: "var(--danger)" }}>
        Reject
      </button>
    </div>
  )
}
