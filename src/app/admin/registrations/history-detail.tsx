"use client"

import { useEffect } from "react"
import { DocThumb } from "@/components/admin/doc-thumb"
import { BlueCheck } from "@/components/admin/blue-check"
import { NearbyMap } from "@/components/booking/NearbyMap"
import type { HistoryRow } from "./history-modal"

export function HistoryDetail({ row, onClose }: { row: HistoryRow | null; onClose: () => void }) {
  useEffect(() => {
    if (!row) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [row, onClose])

  if (!row) return null

  const isVerified = row.status === "verified"
  const isTech = row.kind === "technician"
  const hasIdDocs = row.idFrontUrl || row.idBackUrl || row.selfieUrl
  const hasLocation = row.homeLat != null && row.homeLng != null

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-3 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface w-full max-w-3xl rounded-2xl flex flex-col overflow-hidden"
           style={{ maxHeight: "92vh" }}>
        <div className="p-4 sm:p-5 border-b border-line flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-base sm:text-lg font-semibold text-ink tracking-tight truncate">{row.name}</h3>
              {isVerified && <BlueCheck className="w-4 h-4" />}
              <span className={`badge ${isTech ? "badge-info" : "badge-completed"}`}>{row.kind}</span>
              <span className={`badge ${isVerified ? "badge-active" : "badge-suspended"}`}>{row.status}</span>
            </div>
            <p className="text-xs text-muted truncate">{row.email}{row.phone ? ` · ${row.phone}` : ""}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="icon-btn shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 sm:p-5">
          {row.reason && (
            <div className="rounded-lg p-3 sm:p-4 mb-5"
                 style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", borderLeft: "3px solid var(--danger)" }}>
              <p className="text-[10px] uppercase tracking-wider font-medium mb-1" style={{ color: "var(--danger)" }}>Reason</p>
              <p className="text-sm text-ink leading-relaxed">{row.reason}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
            {isTech && row.certTrade && <Detail label="Trade" value={row.certTrade} />}
            {isTech && row.certNumber && <Detail label="Cert #" value={row.certNumber} mono />}
            {isTech && row.homeCity && <Detail label="City" value={row.homeCity} />}
            {isTech && row.homeBarangay && <Detail label="Barangay" value={row.homeBarangay} />}
            {isTech && row.serviceAddress && (
              <div className="col-span-2">
                <Detail label="Service address" value={row.serviceAddress} />
              </div>
            )}
            <Detail label="Reviewed" value={row.reviewedAt ? new Date(row.reviewedAt).toLocaleString() : "—"} />
          </div>

          {isTech && hasLocation && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
                Registered location
              </p>
              <NearbyMap
                meLat={null}
                meLng={null}
                focusId={row.id}
                height={280}
                techs={[
                  {
                    id: row.id,
                    lat: row.homeLat as number,
                    lng: row.homeLng as number,
                    name: row.name,
                    isSelected: true,
                    certified: row.status === "verified",
                  },
                ]}
              />
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-3">
              {isTech ? "Documents (4)" : "Documents (3)"} · tap to enlarge
            </p>
            <div className={`grid gap-2 sm:gap-3 ${isTech ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
              {isTech && <DocThumb label="NC2 cert" url={row.certFileUrl} />}
              {hasIdDocs && <DocThumb label="ID front" url={row.idFrontUrl} />}
              {hasIdDocs && <DocThumb label="ID back" url={row.idBackUrl} />}
              {hasIdDocs && <DocThumb label="Selfie" url={row.selfieUrl} />}
            </div>
            {!hasIdDocs && !row.certFileUrl && (
              <p className="text-xs text-muted italic">No documents on file.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted font-medium">{label}</span>
      <span className={`text-ink text-sm truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  )
}