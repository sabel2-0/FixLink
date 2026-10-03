"use client"

import { useState } from "react"
import { DocThumb } from "@/components/admin/doc-thumb"

export function UserDocsButton({
  name,
  isTech,
  certFileUrl,
  idFrontUrl,
  idBackUrl,
  selfieUrl,
}: {
  name: string
  isTech: boolean
  certFileUrl?: string | null
  idFrontUrl?: string | null
  idBackUrl?: string | null
  selfieUrl?: string | null
}) {
  const [open, setOpen] = useState(false)
  const hasAny = isTech ? (certFileUrl || idFrontUrl || idBackUrl || selfieUrl) : (idFrontUrl || idBackUrl || selfieUrl)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!hasAny}
        className="text-xs font-medium px-3 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        style={{
          background: "var(--surface-2)",
          color: "var(--ink)",
          border: "1px solid var(--line-2)",
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        {hasAny ? "View documents" : "No documents"}
      </button>

      {open && hasAny && (
        <div
          className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-3 sm:p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-surface w-full max-w-3xl rounded-2xl flex flex-col overflow-hidden"
               style={{ maxHeight: "92vh" }}>
            <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-ink tracking-tight truncate">
                  {name}&apos;s documents
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  {isTech ? "Certificate + ID verification" : "ID verification"} · tap any to enlarge
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="icon-btn shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-4 sm:p-6">
              <div className={`grid gap-3 sm:gap-4 ${isTech ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`}>
                {isTech && <DocThumb label="NC2 certificate" url={certFileUrl} />}
                <DocThumb label="ID — front" url={idFrontUrl} />
                <DocThumb label="ID — back" url={idBackUrl} />
                <DocThumb label="Selfie with ID" url={selfieUrl} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}