"use client"

import { useState } from "react"

export function CopyLink({ url, label = "Copy" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt("Copy this link:", url)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-xs px-2 py-1 rounded-md bg-surface-2 hover:bg-surface-3 text-ink inline-flex items-center gap-1"
    >
      {copied ? "✓ Copied" : label}
    </button>
  )
}