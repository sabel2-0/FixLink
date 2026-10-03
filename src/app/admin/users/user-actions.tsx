"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  deleteUserPermanently,
  deactivateUser,
  reactivateUser,
} from "@/app/actions/admin-user-actions"

type ConfirmKind = "delete" | "deactivate" | "reactivate" | null

export function UserActions({
  userId,
  userName,
  status,
}: {
  userId: string
  userName: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<null | ConfirmKind>(null)
  const [confirm, setConfirm] = useState<ConfirmKind>(null)
  const [error, setError] = useState<string | null>(null)

  const isSuspended = status === "suspended"

  async function run(kind: Exclude<ConfirmKind, null>) {
    setError(null)
    setBusy(kind)
    try {
      if (kind === "delete") await deleteUserPermanently(userId)
      else if (kind === "deactivate") await deactivateUser(userId)
      else if (kind === "reactivate") await reactivateUser(userId)
      setConfirm(null)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed")
    } finally {
      setBusy(null)
    }
  }

  const disabled = pending || busy !== null

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setConfirm(isSuspended ? "reactivate" : "deactivate")}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md transition disabled:opacity-50"
          style={{
            background: isSuspended
              ? "color-mix(in srgb, var(--success) 12%, transparent)"
              : "var(--surface-2)",
            color: isSuspended ? "var(--success)" : "var(--ink)",
            border: "1px solid var(--line-2)",
          }}
        >
          {isSuspended ? "Activate" : "Deactivate"}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setConfirm("delete")}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md transition disabled:opacity-50"
          style={{
            background: "color-mix(in srgb, var(--danger) 10%, transparent)",
            color: "var(--danger)",
            border: "1px solid color-mix(in srgb, var(--danger) 30%, transparent)",
          }}
        >
          Delete
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}

      {confirm && (
        <ConfirmModal
          kind={confirm}
          userName={userName}
          busy={busy !== null}
          error={error}
          onCancel={() => { if (busy === null) { setConfirm(null); setError(null) } }}
          onConfirm={() => run(confirm)}
        />
      )}
    </>
  )
}

function ConfirmModal({
  kind,
  userName,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  kind: Exclude<ConfirmKind, null>
  userName: string
  busy: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  const config = {
    delete: {
      title: `Delete ${userName}?`,
      body: (
        <>
          This permanently removes their account, documents, bookings, and history.
          <strong className="text-ink"> This cannot be undone.</strong>
        </>
      ),
      cta: "Delete permanently",
      tone: "danger" as const,
      icon: "warn" as const,
    },
    deactivate: {
      title: `Deactivate ${userName}?`,
      body: "They won't be able to log in until you reactivate them. Their data stays intact.",
      cta: "Deactivate",
      tone: "warn" as const,
      icon: "pause" as const,
    },
    reactivate: {
      title: `Reactivate ${userName}?`,
      body: "They'll be able to log in again immediately.",
      cta: "Reactivate",
      tone: "success" as const,
      icon: "check" as const,
    },
  }[kind]

  const toneColor =
    config.tone === "danger" ? "var(--danger)" :
    config.tone === "success" ? "var(--success)" :
    "var(--warn)"

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div className="card w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `color-mix(in srgb, ${toneColor} 15%, transparent)`,
              color: toneColor,
            }}
          >
            <Icon kind={config.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-ink tracking-tight mb-1">
              {config.title}
            </h3>
            <p className="text-xs text-muted leading-relaxed">{config.body}</p>
          </div>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="btn-secondary flex-1 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2 py-2.5 disabled:opacity-50"
            style={{
              background: toneColor,
              color: "#fff",
            }}
          >
            {busy ? "Working…" : config.cta}
          </button>
        </div>
      </div>
    </div>
  )
}

function Icon({ kind }: { kind: "warn" | "pause" | "check" }) {
  if (kind === "warn") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    )
  }
  if (kind === "pause") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}