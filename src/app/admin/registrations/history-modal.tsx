"use client"

import { useEffect, useMemo, useState } from "react"
import { BlueCheck } from "@/components/admin/blue-check"
import { HistoryDetail } from "./history-detail"

export type HistoryRow = {
  id: string
  userId: string
  kind: "technician" | "customer"
  name: string
  email: string
  phone: string | null
  status: "verified" | "rejected" | "pending" | string
  reviewedAt: string | null
  reason: string | null
  certNumber: string | null
  certTrade: string | null
  certFileUrl: string | null
  idFrontUrl: string | null
  idBackUrl: string | null
  selfieUrl: string | null
  homeCity: string | null
  homeBarangay: string | null
  serviceAddress: string | null
  homeLat: number | null
  homeLng: number | null
}

type StatusFilter = "all" | "verified" | "rejected"
type KindFilter = "all" | "technician" | "customer"

export function HistoryModal({
  rows, open, onClose,
}: {
  rows: HistoryRow[]
  open: boolean
  onClose: () => void
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [kind, setKind] = useState<KindFilter>("all")
  const [selected, setSelected] = useState<HistoryRow | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !selected) onClose() }
    window.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose, selected])

  useEffect(() => {
    if (open) { setSearch(""); setStatus("all"); setKind("all"); setSelected(null) }
  }, [open])

  const counts = useMemo(() => ({
    all: rows.length,
    verified: rows.filter(r => r.status === "verified").length,
    rejected: rows.filter(r => r.status === "rejected").length,
    technician: rows.filter(r => r.kind === "technician").length,
    customer: rows.filter(r => r.kind === "customer").length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter(r => {
      if (status !== "all" && r.status !== status) return false
      if (kind !== "all" && r.kind !== kind) return false
      if (q) {
        const hay = `${r.name} ${r.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, status, kind, search])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !selected) onClose() }}>
      <div className="bg-surface w-full max-w-4xl rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
           style={{ maxHeight: "92vh", width: "min(100%, 56rem)" }}>
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-ink tracking-tight">Registration history</h2>
            <p className="text-xs text-muted mt-0.5">{rows.length} reviewed applications · tap any to view documents</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="icon-btn shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 border-b border-line shrink-0 space-y-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email…" className="input w-full" />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 flex-1">
              <Chip active={status === "all"} onClick={() => setStatus("all")}>
                All <span className="opacity-60">{counts.all}</span>
              </Chip>
              <Chip active={status === "verified"} onClick={() => setStatus("verified")} tone="success">
                Verified <span className="opacity-60">{counts.verified}</span>
              </Chip>
              <Chip active={status === "rejected"} onClick={() => setStatus("rejected")} tone="danger">
                Rejected <span className="opacity-60">{counts.rejected}</span>
              </Chip>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              <Chip active={kind === "all"} onClick={() => setKind("all")}>All roles</Chip>
              <Chip active={kind === "technician"} onClick={() => setKind("technician")}>
                Techs <span className="opacity-60">{counts.technician}</span>
              </Chip>
              <Chip active={kind === "customer"} onClick={() => setKind("customer")}>
                Customers <span className="opacity-60">{counts.customer}</span>
              </Chip>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-10 text-center"><p className="text-sm text-muted">No results match your filters.</p></div>
          ) : (
            <div className="divide-y divide-line">
              {filtered.map(r => <Row key={r.kind + r.id} row={r} onClick={() => setSelected(r)} />)}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-line shrink-0 text-xs text-muted text-center">
          Showing {filtered.length} of {rows.length}
        </div>
      </div>

      <HistoryDetail row={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function Row({ row, onClick }: { row: HistoryRow; onClick: () => void }) {
  const isVerified = row.status === "verified"
  return (
    <button type="button" onClick={onClick}
      className="w-full text-left p-4 flex items-start gap-3 hover:bg-surface-2 transition">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: isVerified ? "color-mix(in srgb, var(--success) 15%, transparent)"
            : "color-mix(in srgb, var(--danger) 15%, transparent)",
          color: isVerified ? "var(--success)" : "var(--danger)",
        }}>
        {isVerified ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-ink truncate">{row.name}</p>
          {isVerified && <BlueCheck className="w-3.5 h-3.5" />}
          <span className={`badge ${row.kind === "technician" ? "badge-info" : "badge-completed"}`}>{row.kind}</span>
          <span className={`badge ${isVerified ? "badge-active" : "badge-suspended"}`}>{row.status}</span>
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{row.email}</p>
        {row.reason && <p className="text-xs mt-1.5" style={{ color: "var(--danger)" }}>Reason: {row.reason}</p>}
      </div>
      <div className="text-right shrink-0 flex items-center gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Reviewed</p>
          <p className="text-xs text-ink mt-0.5">
            {row.reviewedAt ? new Date(row.reviewedAt).toLocaleDateString() : "—"}
          </p>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-muted">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}

function Chip({ children, active, onClick, tone }: {
  children: React.ReactNode; active: boolean; onClick: () => void; tone?: "success" | "danger"
}) {
  const style = active
    ? tone === "success"
      ? { background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 35%, transparent)" }
      : tone === "danger"
      ? { background: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 35%, transparent)" }
      : { background: "var(--accent)", color: "#fff", border: "1px solid var(--accent)" }
    : { background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--line-2)" }

  return (
    <button type="button" onClick={onClick}
      className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition active:scale-[0.98]"
      style={style}>
      {children}
    </button>
  )
}