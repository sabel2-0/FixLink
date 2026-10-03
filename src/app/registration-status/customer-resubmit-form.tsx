"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { uploadToCloudinary } from "@/lib/cloudinary"

export function CustomerResubmitForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [idFront, setIdFront] = useState<File | null>(null)
  const [idBack, setIdBack]   = useState<File | null>(null)
  const [selfie, setSelfie]   = useState<File | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!idFront || !idBack || !selfie) {
      setError("Please upload all three: ID front, ID back, and selfie.")
      return
    }

    setBusy(true)
    try {
      const [frontUrl, backUrl, selfieUrl] = await Promise.all([
        uploadToCloudinary(idFront, "id-front"),
        uploadToCloudinary(idBack, "id-back"),
        uploadToCloudinary(selfie, "selfie"),
      ])

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not signed in")

      const { error: err } = await supabase
        .from("profiles")
        .update({
          id_front_url: frontUrl,
          id_back_url: backUrl,
          selfie_url: selfieUrl,
          verification_status: "pending",
          verification_reviewed_at: null,
        })
        .eq("id", user.id)

      if (err) throw err

      setSuccess(true)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resubmission failed")
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return (
      <div className="card p-6 sm:p-8 text-center">
        <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
             style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-ink tracking-tight mb-2">Resubmitted</h2>
        <p className="text-sm text-muted">We&apos;ll review your new documents and email you with the result.</p>
      </div>
    )
  }

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-ink tracking-tight mb-1">Resubmit documents</h2>
      <p className="text-xs text-muted mb-6">
        Upload clearer photos. Make sure all corners are visible and there&apos;s no glare.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <FileField label="Government ID — front *" file={idFront} onChange={setIdFront} />
        <FileField label="Government ID — back *"  file={idBack}  onChange={setIdBack} />
        <FileField label="Selfie holding your ID *" file={selfie} onChange={setSelfie} />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={busy || pending} className="btn-primary w-full mt-2">
          {busy ? "Uploading…" : "Resubmit for review"}
        </button>
      </form>
    </div>
  )
}

function FileField({ label, file, onChange }: {
  label: string; file: File | null; onChange: (f: File | null) => void
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input type="file" accept="image/*"
             onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="input" />
      {file && <p className="text-xs text-muted mt-1">Selected: {file.name}</p>}
    </div>
  )
}