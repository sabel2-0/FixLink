"use client"

import { useState } from "react"
import { HistoryModal, type HistoryRow } from "./history-modal"

export function HistorySection({ rows }: { rows: HistoryRow[] }) {
  const [open, setOpen] = useState(false)
  if (rows.length === 0) return null
  const preview = rows.slice(0, 3)

  return (
    <>
      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium">
            Recently reviewed ({rows.length})
          </h2>
          <button type="button" onClick={() => setOpen(true)} className="btn-link text-xs">
            View all →
          </button>
        </div>

        <div className="card divide-y divide-line overflow-hidden">
          {preview.map(r => <PreviewRow key={r.kind + r.id} row={r} onClick={() => setOpen(true)} />)}
        </div>

        {rows.length > preview.length && (
          <button type="button" onClick={() => setOpen(true)}
            className="w-full mt-3 text-xs text-muted hover:text-ink transition py-2">
            + {rows.length - preview.length} more
          </button>
        )}
      </section>

      <HistoryModal rows={rows} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

function PreviewRow({ row, onClick }: { row: HistoryRow; onClick: () => void }) {
  const isVerified = row.status === "verified"
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left p-4 flex items-start gap-3 hover:bg-surface-2 transition">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: isVerified ? "color-mix(in srgb, var(--success) 15%, transparent)"
            : "color-mix(in srgb, var(--danger) 15%, transparent)",
          color: isVerified ? "var(--success)" : "var(--danger)",
        }}>
        {isVerified ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-ink truncate">{row.name}</p>
          <span className={`badge ${isVerified ? "badge-active" : "badge-suspended"}`}>{row.status}</span>
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{row.email}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-muted">
          {row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString() : "—"}
        </p>
      </div>
    </button>
  )
}