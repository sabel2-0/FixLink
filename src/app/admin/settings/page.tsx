"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"
import {
  verifyRename,
  scanMojibake,
  type VerifyRow,
  type MojibakeRow,
} from "@/app/actions/admin-settings-actions"

export default function AdminSettingsPage() {
  const supabase = createClient()
  const [value, setValue] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [verifyRows, setVerifyRows] = useState<VerifyRow[] | null>(null)
  const [verifyErr, setVerifyErr] = useState<string | null>(null)
  const [verifyPending, startVerify] = useTransition()

  const [mojiRows, setMojiRows] = useState<MojibakeRow[] | null>(null)
  const [mojiErr, setMojiErr] = useState<string | null>(null)
  const [mojiPending, startMoji] = useTransition()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("site_name, previous_site_name")
        .eq("id", 1)
        .maybeSingle()
      if (!cancelled) {
        setValue(data?.site_name || "")
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [supabase])

  async function save() {
    setSaving(true)
    setMessage(null)
    setError(null)

    const trimmed = value.trim()
    if (!trimmed) { setError("Name cannot be empty."); setSaving(false); return }
    if (trimmed.length > 40) { setError("Name must be 40 characters or less."); setSaving(false); return }

    // Read current before write so we can record it as previous
    const { data: current } = await supabase
      .from("app_settings")
      .select("site_name")
      .eq("id", 1)
      .maybeSingle()
    const prev = current?.site_name && current.site_name !== trimmed ? current.site_name : null

    const { error: e } = await supabase
      .from("app_settings")
      .update({
        site_name: trimmed,
        previous_site_name: prev ?? undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)

    if (e) {
      setError(e.message)
    } else {
      setMessage("Saved. Every open session updates within a second.")
      // Auto-refresh both checks against the freshly-saved name.
      // Small delay so Supabase replication settles before the fetch loop.
      setTimeout(() => { runVerify(); runMoji() }, 600)
    }
    setSaving(false)
  }

  function runVerify() {
    setVerifyErr(null)
    setVerifyRows(null)
    startVerify(async () => {
      const r = await verifyRename()
      if (r.ok) setVerifyRows(r.rows)
      else setVerifyErr(r.error)
    })
  }

  function runMoji() {
    setMojiErr(null)
    setMojiRows(null)
    startMoji(async () => {
      const r = await scanMojibake()
      if (r.ok) setMojiRows(r.rows)
      else setMojiErr(r.error)
    })
  }

  if (loading) return <p className="text-sm text-muted">Loading...</p>

  const verifyPass = verifyRows && verifyRows.every(r => r.status >= 200 && r.status < 400 && r.literalFixLink === 0 && r.previousNameCount === 0 && !r.error)
  const mojiPass = mojiRows && mojiRows.every(r => r.hits === 0)

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-ink tracking-tight">Settings</h1>
        <p className="text-muted text-sm mb-6">Brand and system configuration.</p>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
          >
            <Icon name="settings" className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">System name</p>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Appears in navs, headers, footers, and page copy across the app. Updates live for every open session.
            </p>
          </div>
        </div>

        <label className="input-label">Display name</label>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={40}
          placeholder="System Name"
          className="input"
        />

        <p className="text-[11px] text-muted mt-2">
          {value.length}/40 &middot; Changing this does not affect the database, environment variables, or email addresses.
        </p>

        {error && <p className="text-sm mt-3" style={{ color: "var(--danger)" }}>{error}</p>}
        {message && <p className="text-sm mt-3" style={{ color: "var(--success)" }}>{message}</p>}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="btn-primary w-full mt-5 !py-2.5 !text-sm"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* VERIFY RENAME */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--accent) 15%, transparent)", color: "var(--accent)" }}
          >
            <Icon name="check" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Verify rename</p>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Fetches 15 public and signed-in routes. Expected: &quot;Hardcoded&quot; and &quot;Previous&quot; = 0 on every row (no stale brand text), and your current name appearing in the &quot;Name&quot; column and page titles.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runVerify}
          disabled={verifyPending}
          className="btn-secondary w-full !py-2.5 !text-sm"
        >
          {verifyPending ? "Checking..." : "Run verification"}
        </button>

        {verifyErr && <p className="text-sm mt-3" style={{ color: "var(--danger)" }}>{verifyErr}</p>}

        {verifyRows && (
          <>
            <p className="text-sm mt-4 mb-2 font-medium" style={{ color: verifyPass ? "var(--success)" : "var(--danger)" }}>
              {verifyPass
                ? "\u2713 PASS \u2014 0 literal FixLink, name present on all " + verifyRows.length + " routes"
                : "\u2717 Some routes have issues \u2014 see below"}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted">
                  <tr className="text-left border-b border-line">
                    <th className="py-2 pr-3">Route</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3" title="Stale hardcoded brand string still present in rendered HTML">Hardcoded</th>
                    <th className="py-2 pr-3" title="The name you had before the current one">Previous</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2">Title</th>
                  </tr>
                </thead>
                <tbody>
                  {verifyRows.map((r) => (
                    <tr key={r.route} className="border-b border-line/60">
                      <td className="py-1.5 pr-3 font-mono">{r.route}</td>
                      <td className="py-1.5 pr-3" style={{ color: r.status >= 200 && r.status < 400 ? "var(--success)" : "var(--danger)" }}>{r.status || "ERR"}</td>
                      <td className="py-1.5 pr-3" style={{ color: r.literalFixLink > 0 ? "var(--danger)" : "var(--muted)" }}>{r.literalFixLink}</td>
                      <td className="py-1.5 pr-3" style={{ color: r.previousNameCount > 0 ? "var(--danger)" : "var(--muted)" }}>{r.previousNameCount}</td>
                      <td className="py-1.5 pr-3" style={{ color: r.newNameCount > 0 ? "var(--success)" : "var(--muted)" }}>{r.newNameCount}</td>
                      <td className="py-1.5 truncate max-w-[240px]" title={r.title}>{r.title || r.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MOJIBAKE */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--warn)" }}
          >
            <Icon name="alert" className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink">Content health &mdash; mojibake scan</p>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Scans the rendered HTML of the same routes for 15 corrupted-text signatures
              (em-dash, ellipsis, middle-dot, peso, arrow). Read-only.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runMoji}
          disabled={mojiPending}
          className="btn-secondary w-full !py-2.5 !text-sm"
        >
          {mojiPending ? "Scanning..." : "Scan for mojibake"}
        </button>

        {mojiErr && <p className="text-sm mt-3" style={{ color: "var(--danger)" }}>{mojiErr}</p>}

        {mojiRows && (
          <>
            <p className="text-sm mt-4 mb-2 font-medium" style={{ color: mojiPass ? "var(--success)" : "var(--danger)" }}>
              {mojiPass
                ? "\u2713 CLEAN \u2014 0 hits across " + mojiRows.length + " routes"
                : "\u2717 Mojibake detected \u2014 see below"}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted">
                  <tr className="text-left border-b border-line">
                    <th className="py-2 pr-3">Route</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Hits</th>
                    <th className="py-2">Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {mojiRows.map((r) => (
                    <tr key={r.route} className="border-b border-line/60">
                      <td className="py-1.5 pr-3 font-mono">{r.route}</td>
                      <td className="py-1.5 pr-3">{r.status || "ERR"}</td>
                      <td className="py-1.5 pr-3" style={{ color: r.hits > 0 ? "var(--danger)" : "var(--muted)" }}>{r.hits < 0 ? "ERR" : r.hits}</td>
                      <td className="py-1.5 truncate max-w-[320px] font-mono text-[11px]" title={r.samples[0] || ""}>{r.samples[0] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}