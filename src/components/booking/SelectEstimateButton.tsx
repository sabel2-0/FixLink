"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

type Props = { bookingId: string; technicianId: string; technicianName: string }

export function SelectEstimateButton({ bookingId, technicianId, technicianName }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error: e } = await supabase
        .from("bookings")
        .update({ status: "confirmed", technician_id: technicianId })
        .eq("id", bookingId)
        .eq("customer_id", user.id)
      if (e) throw e

      const { data: invited } = await supabase
        .from("booking_requested_techs")
        .select("technician_id")
        .eq("booking_id", bookingId)
      const others = (invited || []).filter((r: any) => r.technician_id !== technicianId)
      if (others.length) {
        await supabase.from("notifications").insert(
          others.map((r: any) => ({
            recipient_id: r.technician_id,
            title: "Not selected this time",
            body: "The customer chose another technician for this job.",
            link: "/tech/estimates",
          }))
        )
      }

      setConfirming(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          all: "unset",
          background: "var(--accent)",
          color: "#fff",
          borderRadius: 8,
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          fontFamily: "inherit",
          boxSizing: "border-box",
        }}
      >
        Select
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirming(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-line">
              <p className="font-semibold text-sm">Confirm this technician?</p>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                style={{ all: "unset", cursor: "pointer", color: "var(--muted)", padding: 4, display: "inline-flex" }}
                aria-label="Close"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-surface-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {technicianName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{technicianName}</p>
                  <p className="text-xs text-muted mt-0.5">Will be assigned to this job</p>
                </div>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                The other technicians you invited will be notified. You can still cancel before they arrive if plans change.
              </p>

              {error && (
                <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>
              )}
            </div>

            <div className="p-4 border-t border-line flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="btn-primary flex-1"
              >
                {busy ? "Confirming…" : "Yes, select"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}