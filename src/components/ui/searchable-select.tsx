"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export type Option = { value: string; label: string }

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results found",
  disabled,
  loading,
  onOpen,
  maxHeight = 300,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
  onOpen?: () => void
  maxHeight?: number
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const wrapRef  = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef  = useRef<HTMLDivElement | null>(null)

  const selected = options.find((o) => o.value === value) || null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    setQuery("")
    const idx = selected ? options.findIndex((o) => o.value === selected.value) : 0
    setHighlight(idx >= 0 ? idx : 0)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [open, options, selected])

  useEffect(() => {
    if (highlight >= filtered.length) setHighlight(0)
  }, [filtered.length, highlight])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)
    if (el) el.scrollIntoView({ block: "nearest" })
  }, [highlight, open])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  function commit(opt: Option) {
    onChange(opt.value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlight((h) => Math.min(filtered.length - 1, h + 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const opt = filtered[highlight]
      if (opt) commit(opt)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === "Home") {
      setHighlight(0)
    } else if (e.key === "End") {
      setHighlight(Math.max(0, filtered.length - 1))
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) onOpen?.()
        }}
        className="input w-full text-left flex items-center justify-between gap-2 disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? "text-ink" : "text-muted"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
             className={`w-4 h-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 rounded-xl overflow-hidden shadow-lg"
          style={{ background: "var(--surface)", border: "1px solid var(--line-2)", maxHeight }}
        >
          <div className="p-2 border-b border-line sticky top-0" style={{ background: "var(--surface)" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0) }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="input text-sm w-full"
            />
          </div>

          <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: maxHeight - 60 }}>
            {loading ? (
              <p className="p-4 text-sm text-muted text-center">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted text-center">{emptyMessage}</p>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt.value === value
                const isHighlight = idx === highlight
                return (
                  <button
                    key={opt.value}
                    type="button"
                    data-idx={idx}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => commit(opt)}
                    className="w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition"
                    style={{
                      background: isHighlight ? "var(--surface-2)" : "transparent",
                      color: "var(--ink)",
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                           className="w-4 h-4 shrink-0" style={{ color: "var(--accent)" }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}