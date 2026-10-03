"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

const SERVICE_OPTIONS = [
  "Aircon", "Refrigerator", "Washing Machine", "TV", "Water Heater",
  "Microwave", "Electric Fan", "Rice Cooker", "Electric Kettle", "Induction Stove",
]

export function TechProfileForm({
  profile,
  tech,
  services: initialServices,
}: {
  profile: any
  tech: any
  services: string[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [pending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  const [phone, setPhone] = useState(profile?.phone || "")
  const [address, setAddress] = useState(tech?.service_address || "")
  const [services, setServices] = useState<string[]>(initialServices)

  const certStatus = tech?.cert_status || "pending"
  const isVerified = certStatus === "verified"

  function toggleService(s: string) {
    setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function save() {
    setSaving(true)
    setSaveMsg(null)
    try {
      // 1. Profile (phone)
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ phone: phone.trim() || null })
        .eq("id", profile.id)
      if (profErr) throw new Error("Profile: " + profErr.message)

      // 2. Technician profile (address)
      const { error: techErr } = await supabase
        .from("technician_profiles")
        .update({ service_address: address.trim() || null })
        .eq("id", profile.id)
      if (techErr) throw new Error("Tech profile: " + techErr.message)

      // 3. Services â€” delete then insert
      const { error: delErr } = await supabase
        .from("technician_services")
        .delete()
        .eq("technician_id", profile.id)
      if (delErr) throw new Error("Clear services: " + delErr.message)

      if (services.length > 0) {
        const { error: insErr } = await supabase
          .from("technician_services")
          .insert(services.map((s) => ({ technician_id: profile.id, service: s })))
        if (insErr) throw new Error("Save services: " + insErr.message)
      }

      setSaveMsg("Saved")
      startTransition(() => router.refresh())
      setTimeout(() => setSaveMsg(null), 2500)
    } catch (e) {
      console.error("[profile save]", e)
      setSaveMsg(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight mb-2">Profile</h1>
      <p className="text-muted text-sm mb-8">Your public profile and service settings.</p>

      {/* Verification status */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
               style={{
                 background: isVerified
                   ? "color-mix(in srgb, var(--success) 15%, transparent)"
                   : certStatus === "rejected"
                   ? "color-mix(in srgb, var(--danger) 15%, transparent)"
                   : "color-mix(in srgb, var(--warn) 15%, transparent)",
                 color: isVerified ? "var(--success)" : certStatus === "rejected" ? "var(--danger)" : "var(--warn)",
               }}>
            {isVerified ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="text-sm font-semibold text-ink capitalize">{certStatus}</p>
              {isVerified && <span className="badge badge-active">Verified</span>}
            </div>
            {certStatus === "pending" && (
              <p className="text-xs text-muted">Under review. Usually 1â€“2 business days.</p>
            )}
            {certStatus === "rejected" && (
              <>
                <p className="text-xs text-muted mb-2">
                  {tech?.cert_rejection_reason || "Documents need attention."}
                </p>
                <Link href="/registration-status" className="btn-secondary text-xs py-2 px-3 inline-block">
                  Resubmit documents
                </Link>
              </>
            )}
            {isVerified && (
              <p className="text-xs text-muted">
                Customers can now find and book you.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Editable info */}
      <div className="card p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-muted font-medium mb-4">Contact</p>
        <div className="space-y-4">
          <Field label="Full name">
            <input value={profile?.full_name || ""} disabled className="input opacity-60" />
          </Field>
          <Field label="Email">
            <input value={profile?.email || ""} disabled className="input opacity-60" />
          </Field>
          <Field label="Mobile">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
          </Field>
          <Field label="Service address / landmark">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="input" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Region">
              <input value={tech?.home_region || "â€”"} disabled className="input opacity-60" />
            </Field>
            <Field label="Province">
              <input value={tech?.home_province || "â€”"} disabled className="input opacity-60" />
            </Field>
            <Field label="City">
              <input value={tech?.home_city || "â€”"} disabled className="input opacity-60" />
            </Field>
          </div>
          <Field label="Barangay">
            <input value={tech?.home_barangay || "â€”"} disabled className="input opacity-60" />
          </Field>
          <p className="text-xs text-muted">
            To change your location, use the resubmit flow from your verification status page.
          </p>
        </div>
      </div>

      {/* Services */}
      <div className="card p-6 mb-4">
        <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Services you offer</p>
        <p className="text-xs text-muted mb-4">
          Customers only see you when booking one of these. Pick at least one.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SERVICE_OPTIONS.map((s) => {
            const selected = services.includes(s)
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className="relative text-sm pl-3 pr-9 py-2.5 rounded-lg border transition text-left flex items-center"
                style={{
                  background: selected ? "color-mix(in srgb, var(--accent) 15%, transparent)" : "var(--surface-2)",
                  borderColor: selected ? "var(--accent)" : "var(--line-2)",
                  color: selected ? "var(--accent)" : "var(--ink)",
                  fontWeight: selected ? 500 : 400,
                }}
              >
                <span className="truncate">{s}</span>
                {selected && (
                  <span
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={save}
          disabled={saving || pending}
          className="btn-primary"
        >
          {saving ? "Savingâ€¦" : "Save changes"}
        </button>
        {saveMsg && (
          <span className={`text-sm ${saveMsg === "Saved" ? "text-[var(--success)]" : "text-red-500"}`}>
            {saveMsg}
          </span>
        )}
      </div>

    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="input-label">{label}</label>
      {children}
    </div>
  )
}
