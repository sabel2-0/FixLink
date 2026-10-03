"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { notifyRegistrationDecision } from "@/app/actions/notify-registration"

type Mode = "technician" | "customer"
type Action = "verify" | "reject" | "reset"

export function VerifyButtons({
  id,
  currentStatus,
  existingReason,
  mode = "technician",
  large,
}: {
  id: string
  currentStatus: string
  existingReason?: string | null
  mode?: Mode
  large?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<null | Action>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Action | null>(null)
  const [reason, setReason] = useState(existingReason ?? "")
  const disabled = pending || busy !== null

  async function apply(status: "verified" | "rejected" | "pending", rejectionReason?: string) {
    setError(null)
    try {
      const supabase = createClient()
      const table = mode === "technician" ? "technician_profiles" : "profiles"
      const payload: Record<string, unknown> = mode === "technician"
        ? {
            cert_status: status,
            cert_reviewed_at: new Date().toISOString(),
            cert_rejection_reason: status === "rejected" ? (rejectionReason ?? null) : null,
          }
        : { verification_status: status, verification_reviewed_at: new Date().toISOString() }

      const { error: err } = await supabase.from(table).update(payload).eq("id", id)
      if (err) throw err

      // Log the decision (event history)
      const { data: { user: reviewer } } = await supabase.auth.getUser()
      await supabase.from("registration_events").insert({
        user_id: id,
        kind: mode,
        decision: status,
        reason: status === "rejected" ? (rejectionReason ?? null) : null,
        reviewer_id: reviewer?.id ?? null,
      })

      // Fire email in background — don't block UI on email delivery
      if (status !== "pending") {
        notifyRegistrationDecision(id, status, rejectionReason).catch((e) =>
          console.error("[notify] failed:", e)
        )
      }

      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed")
    } finally {
      setBusy(null)
      setDialog(null)
    }
  }

  function confirmDialog() {
    if (dialog === "verify") { setBusy("verify"); apply("verified") }
    else if (dialog === "reject") { setBusy("reject"); apply("rejected", reason.trim() || "Documents unclear or invalid") }
    else if (dialog === "reset") { setBusy("reset"); apply("pending") }
  }

  const sizeCls = large ? "px-4 py-2.5 text-sm gap-2" : "px-2.5 py-1.5 text-xs gap-1.5"
  const iconCls = large ? "w-4 h-4" : "w-3.5 h-3.5"
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${large ? "" : "justify-end"}`}>
        {currentStatus !== "verified" && (
          <button type="button" disabled={disabled} onClick={() => setDialog("verify")}
            className={`${base} ${sizeCls} text-white`} style={{ background: "var(--success)" }}>
            {busy === "verify" ? <Spinner className={iconCls} /> : <IconCheck className={iconCls} />}
            {busy === "verify" ? "Verifying…" : "Verify"}
          </button>
        )}
        {currentStatus !== "rejected" && (
          <button type="button" disabled={disabled} onClick={() => setDialog("reject")}
            className={`${base} ${sizeCls}`}
            style={{
              background: "color-mix(in srgb, var(--danger) 12%, transparent)",
              color: "var(--danger)",
              border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)",
            }}>
            {busy === "reject" ? <Spinner className={iconCls} /> : <IconX className={iconCls} />}
            {busy === "reject" ? "Rejecting…" : "Reject"}
          </button>
        )}
        {currentStatus === "rejected" && (
          <button type="button" disabled={disabled} onClick={() => setDialog("reset")}
            className={`${base} ${sizeCls} text-ink`}
            style={{ background: "var(--surface-2)", border: "1px solid var(--line-2)" }}>
            {busy === "reset" ? <Spinner className={iconCls} /> : <IconReset className={iconCls} />}
            {busy === "reset" ? "Resetting…" : "Reset to pending"}
          </button>
        )}
        {currentStatus === "verified" && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }}>
            <IconCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      {dialog && (
        <ConfirmModal
          action={dialog} kind={mode} reason={reason} setReason={setReason} busy={busy !== null}
          onCancel={() => { if (busy === null) { setDialog(null); setReason(existingReason ?? "") } }}
          onConfirm={confirmDialog}
        />
      )}
    </>
  )
}

function ConfirmModal({
  action, kind, reason, setReason, busy, onCancel, onConfirm,
}: {
  action: Action
  kind: Mode
  reason: string
  setReason: (v: string) => void
  busy: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [busy, onCancel])

  const what = kind === "technician" ? "technician" : "customer"

  const config = {
    verify: {
      title: `Verify this ${what}?`,
      body: `They'll get the blue verified check, be able to log in, and receive a "you're verified" email.`,
      cta: "Verify",
      tone: "success" as const,
    },
    reject: {
      title: `Reject this ${what}?`,
      body: `They won't be able to log in. An email with the reason below will be sent to them.`,
      cta: "Reject",
      tone: "danger" as const,
    },
    reset: {
      title: `Reset to pending?`,
      body: `They'll be blocked from logging in until you review again.`,
      cta: "Reset",
      tone: "neutral" as const,
    },
  }[action]

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}>
      <div className="card w-full max-w-sm p-5 sm:p-6" role="dialog" aria-modal="true">
        <div className="mb-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: config.tone === "success" ? "color-mix(in srgb, var(--success) 15%, transparent)"
                  : config.tone === "danger" ? "color-mix(in srgb, var(--danger) 15%, transparent)"
                  : "var(--surface-2)",
                color: config.tone === "success" ? "var(--success)"
                  : config.tone === "danger" ? "var(--danger)"
                  : "var(--ink)",
              }}>
              {action === "verify" && <IconCheck className="w-4 h-4" />}
              {action === "reject" && <IconX className="w-4 h-4" />}
              {action === "reset" && <IconReset className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-ink tracking-tight">{config.title}</h3>
              <p className="text-xs text-muted leading-relaxed mt-1">{config.body}</p>
            </div>
          </div>
        </div>

        {action === "reject" && (
          <div className="mb-4">
            <label className="input-label">{kind === "technician" ? "Reason (sent to the technician)" : "Reason (sent to the customer)"}</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="e.g. Cert number doesn't match TESDA registry"
              className="input text-sm" autoFocus />
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={busy}
            className="flex-1 text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
            style={
              config.tone === "success" ? { background: "var(--success)", color: "#fff" }
                : config.tone === "danger" ? { background: "var(--danger)", color: "#fff" }
                : { background: "var(--ink)", color: "var(--paper)" }
            }>
            {busy && <Spinner className="w-4 h-4" />}
            {busy ? "Working…" : config.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>
}
function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
}
function IconReset({ className = "w-4 h-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><polyline points="3 3 3 8 8 8" /></svg>
}
function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
}