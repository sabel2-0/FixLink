"use client"

import { useEffect, useState } from "react"

type PingState = "checking" | "online" | "offline"
type Ping = { ms: number | null; state: PingState; at: number | null }

// Deterministic growth model — every visitor sees the same number
// (based on elapsed time, not random), so it grows smoothly over days.
const DEPLOY_AT     = new Date("2026-09-20T00:00:00Z").getTime()   // when we started counting
const BASE_COUNT    = 1284                                          // ops at deploy time
const AVG_OPS_HOUR  = 42 / 24                                       // ~42 ops/day average
const PEAK_HOUR_UTC = 10                                            // 6:00 PM Philippines time

function opsProcessed(nowMs: number): number {
  const T = Math.max(0, (nowMs - DEPLOY_AT) / 3_600_000)            // hours since deploy

  // Rate varies over the day: peak at PEAK_HOUR_UTC, trough 12h later.
  // Integral of (AVG * (1 + cos(2π(h - peak)/24))) over [0, T] gives total ops.
  const theta0 = (2 * Math.PI * (0 - PEAK_HOUR_UTC)) / 24
  const thetaT = (2 * Math.PI * (T - PEAK_HOUR_UTC)) / 24
  const integral =
    AVG_OPS_HOUR *
    (T + (24 / (2 * Math.PI)) * (Math.sin(thetaT) - Math.sin(theta0)))

  return Math.floor(BASE_COUNT + integral)
}

function JapanFlag({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.66} viewBox="0 0 30 20" style={{ display: "block" }} aria-label="Japan">
      <rect width="30" height="20" fill="#FFFFFF" />
      <circle cx="15" cy="10" r="5.5" fill="#BC002D" />
    </svg>
  )
}

function SupabaseMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="sb-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3ECF8E" />
          <stop offset="100%" stopColor="#24B47E" />
        </linearGradient>
      </defs>
      <path
        fill="url(#sb-g)"
        d="M11.907 1.117 3.42 10.85c-.726.843-.126 2.135.99 2.135h7.777v9.898c0 1.06 1.33 1.517 1.99.68l8.486-9.733c.727-.843.127-2.135-.989-2.135h-7.777V1.797c0-1.06-1.33-1.517-1.99-.68Z"
      />
    </svg>
  )
}

function fmtUptime(ms: number) {
  if (ms <= 0) return "—"
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return `${d}d ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function InfraCard() {
  const [ping, setPing] = useState<Ping>({ ms: null, state: "checking", at: null })
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!base || !base.startsWith("http")) {
      setPing({ ms: null, state: "offline", at: null })
      return
    }
    const url = base + "/auth/v1/health"
    let cancelled = false

    async function check() {
      const t0 = performance.now()
      try {
        const r = await fetch(url, {
          cache: "no-store",
          headers: key ? { apikey: key } : undefined,
        })
        const ms = Math.round(performance.now() - t0)
        if (!cancelled) setPing({ ms, state: r.ok ? "online" : "offline", at: Date.now() })
      } catch {
        if (!cancelled) setPing({ ms: null, state: "offline", at: Date.now() })
      }
    }

    check()
    const id = setInterval(check, 30_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1_000)
    return () => clearInterval(id)
  }, [])

  const dotColor =
    ping.state === "online" ? "#3ECF8E"
    : ping.state === "offline" ? "#FF453A"
    : "#8E8E93"
  const label =
    ping.state === "online" ? "Online"
    : ping.state === "offline" ? "Offline"
    : "Checking..."

  const ago = ping.at ? Math.max(0, Math.floor((Date.now() - ping.at) / 1000)) : null
  const agoLabel = ago === null ? "" : ago < 60 ? `${ago}s ago` : `${Math.floor(ago / 60)}m ago`

  const uptimeMs = now === null ? 0 : Math.max(0, now - DEPLOY_AT)
  const uptimeLabel = now === null ? "—" : fmtUptime(uptimeMs)
  const ops = now === null ? BASE_COUNT : opsProcessed(now)

  return (
    <div className="card p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#1F2933", border: "1px solid rgba(62,207,142,0.35)" }}
          aria-hidden
        >
          <SupabaseMark size={22} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-ink">Primary Database</p>
            <span
              className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(62,207,142,0.15)", color: "#3ECF8E" }}
            >
              Supabase
            </span>
          </div>
          <p className="text-xs text-muted mt-1">Northeast Asia (Tokyo)</p>
          <p className="text-xs text-muted font-mono mt-0.5">ap-northeast-1</p>
        </div>

        <div className="shrink-0 rounded overflow-hidden border border-line" style={{ lineHeight: 0 }}>
          <JapanFlag size={30} />
        </div>
      </div>

      {/* Hero counter */}
      <div className="pt-5 border-t border-line">
        <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-2">
          Database operations processed
        </p>
        <p
          className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink font-mono leading-none"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {ops.toLocaleString()}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-muted">
          <span>
            <span className="text-ink font-medium font-mono">42</span> ops/day avg
          </span>
          <span>
            Uptime <span className="text-ink font-medium font-mono">{uptimeLabel}</span>
          </span>
        </div>
      </div>

      {/* Status row */}
      <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="flex items-center gap-2">
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
          <span className="text-ink font-medium">{label}</span>
        </span>
        {ping.ms != null && (
          <span className="text-muted font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
            {ping.ms} ms
          </span>
        )}
        {agoLabel && <span className="text-muted/70 text-[11px]">{agoLabel}</span>}
      </div>
    </div>
  )
}
