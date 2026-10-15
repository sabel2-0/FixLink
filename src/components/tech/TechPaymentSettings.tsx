"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"

type Props = {
  techId: string
  initial: {
    gcash_number: string | null
    maya_number: string | null
    preferred_payment: string | null
  }
}

export function TechPaymentSettings({ techId, initial }: Props) {
  const supabase = createClient()
  const [gcash, setGcash] = useState(initial.gcash_number || "")
  const [maya, setMaya] = useState(initial.maya_number || "")
  const [pref, setPref] = useState(initial.preferred_payment || "cash")
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setSaved(false) }, [gcash, maya, pref])

  async function save() {
    setBusy(true); setError(null); setSaved(false)
    try {
      const { error: e } = await supabase
        .from("technician_profiles")
        .update({
          gcash_number: gcash.trim() || null,
          maya_number: maya.trim() || null,
          preferred_payment: pref,
        })
        .eq("id", techId)
      if (e) throw e
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
        >
          <Icon name="card" className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Payment details</p>
          <p className="text-xs text-muted mt-0.5 leading-relaxed">
            Customers will see these to pay you directly. Fill in your e-wallet numbers if you accept online payments.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="input-label">Preferred payment method</label>
          <div className="grid grid-cols-3 gap-2">
            {(["cash", "gcash", "maya"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPref(m)}
                className="rounded-xl p-3 text-sm font-medium transition text-center"
                style={{
                  background: pref === m ? "var(--accent-soft)" : "var(--surface-2)",
                  color: pref === m ? "var(--accent)" : "var(--ink)",
                  border: pref === m ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                {m === "cash" ? "Cash" : m === "gcash" ? "GCash" : "Maya"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="input-label">GCash number (optional)</label>
          <input
            type="tel"
            inputMode="numeric"
            value={gcash}
            onChange={(e) => setGcash(e.target.value)}
            placeholder="0917 123 4567"
            className="input"
          />
        </div>

        <div>
          <label className="input-label">Maya number (optional)</label>
          <input
            type="tel"
            inputMode="numeric"
            value={maya}
            onChange={(e) => setMaya(e.target.value)}
            placeholder="0917 123 4567"
            className="input"
          />
        </div>

        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
        {saved && <p className="text-xs" style={{ color: "var(--success)" }}>✓ Saved</p>}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="btn-primary w-full mt-5 !py-2.5 !text-sm"
      >
        {busy ? "Saving..." : "Save payment details"}
      </button>
    </div>
  )
}
