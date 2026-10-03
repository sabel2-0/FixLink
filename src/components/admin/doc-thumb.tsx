"use client"

import { useState, useEffect } from "react"

export function DocThumb({ label, url }: { label: string; url?: string | null }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1 truncate">{label}</p>
        {url ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="block w-full aspect-square rounded-lg overflow-hidden border border-line bg-surface-2 hover:opacity-90 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="w-full h-full object-cover" loading="lazy" />
          </button>
        ) : (
          <div className="aspect-square rounded-lg border border-line bg-surface-2 flex items-center justify-center">
            <span className="text-[9px] text-muted">—</span>
          </div>
        )}
      </div>

      {open && url && (
        <div
          className="fixed inset-0 z-[90] bg-black/85 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <p className="absolute top-6 left-6 text-white/70 text-sm">{label}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={label}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 text-xs text-white/70 hover:text-white underline"
          >
            Open in new tab
          </a>
        </div>
      )}
    </>
  )
}