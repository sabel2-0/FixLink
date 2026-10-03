"use client"

import { useState } from "react"

export function CopyTechDetails({
  firstName,
  lastName,
  certNumber,
}: {
  firstName: string
  lastName: string
  certNumber: string | null
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const clean = (certNumber || "").trim()
    const first4 = clean ? clean.slice(0, 4) : "—"
    const last4 = clean ? clean.slice(-4) : "—"
    const text = [
      `Last name: ${lastName || "—"}`,
      `First name: ${firstName || "—"}`,
      `Cert first 4: ${first4}`,
      `Cert last 4: ${last4}`,
    ].join("\n")

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      window.prompt("Copy these details for TESDA:", text)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs px-2.5 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink inline-flex items-center gap-1.5"
    >
      {copied ? "✓ Copied" : "Copy for TESDA"}
    </button>
  )
}