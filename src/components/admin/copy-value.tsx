"use client"

import { useState } from "react"

export function CopyValue({
  value,
  label,
  mono,
  className = "",
}: {
  value: string
  label?: string
  mono?: boolean
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1300)
    } catch {
      window.prompt("Copy:", value)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label ? `Copy ${label}` : "Copy"}
      className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-surface-2 transition group ${className}`}
    >
      <span className={`text-ink text-right truncate ${mono ? "font-mono text-xs" : "text-sm"}`}>
        {value || "—"}
      </span>
      {value && (
        <span className={`shrink-0 text-muted group-hover:text-accent transition ${copied ? "text-[var(--success)]" : ""}`}>
          {copied ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </span>
      )}
    </button>
  )
}