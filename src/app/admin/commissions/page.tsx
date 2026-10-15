import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/lib/icons"
import { peso } from "@/lib/format"

export default async function AdminCommissionsPage() {
  const supabase = await createClient()

  // One row per technician, joined with their wallet + lifetime commission
  const { data: summary } = await supabase
    .from("tech_wallet_summary")
    .select("*")
    .order("lifetime_commission", { ascending: false })

  const rows = summary ?? []

  const totalCommission = rows.reduce((s: number, r: any) => s + Number(r.lifetime_commission || 0), 0)
  const totalOwed       = rows.reduce((s: number, r: any) => s + (Number(r.credits_balance || 0) < 0 ? Math.abs(Number(r.credits_balance)) : 0), 0)
  const totalCredits    = rows.reduce((s: number, r: any) => s + (Number(r.credits_balance || 0) > 0 ? Number(r.credits_balance) : 0), 0)
  const owedCount       = rows.filter((r: any) => r.wallet_state === "owed").length

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1 tracking-tight">Commissions</h1>
        <p className="text-muted">Wallet-based commission ledger. 10% of every completed job is deducted from the technician&apos;s wallet.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Lifetime charged" value={peso(totalCommission)} />
        <Stat label="Outstanding owed" value={peso(totalOwed)} color={totalOwed > 0 ? "var(--danger)" : undefined} hint={owedCount > 0 ? `${owedCount} technician${owedCount === 1 ? "" : "s"}` : undefined} />
        <Stat label="Credits held" value={peso(totalCredits)} color={totalCredits > 0 ? "var(--success)" : undefined} />
        <Stat label="Rate" value="10%" />
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">No technicians with completed jobs yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_1fr_28px] gap-3 px-5 py-3 border-b border-line text-[11px] uppercase tracking-wider text-muted font-medium">
            <span>Technician</span>
            <span>Wallet balance</span>
            <span>State</span>
            <span>Lifetime charged</span>
            <span>Jobs done</span>
            <span>Last job</span>
            <span></span>
          </div>

          <div className="divide-y divide-line">
            {rows.map((r: any) => {
              const bal = Number(r.credits_balance || 0)
              const state = r.wallet_state as "good" | "low" | "owed"
              const stateMeta =
                state === "owed"
                  ? { label: "Owed", bg: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)" }
                  : state === "low"
                  ? { label: "Low",  bg: "color-mix(in srgb, var(--warn) 15%, transparent)",   color: "var(--warn)" }
                  : { label: "Good", bg: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }

              return (
                <Link
                  key={r.technician_id}
                  href="/admin/topups"
                  className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_1fr_28px] gap-3 px-5 py-4 hover:bg-surface-2 transition items-center"
                >
                  <span className="min-w-0">
                    <span className="text-sm font-medium text-ink truncate block">{r.full_name || "Technician"}</span>
                    <span className="text-xs text-muted truncate block">{r.email || "—"}</span>
                  </span>

                  <span className="text-sm font-semibold" style={{ color: bal < 0 ? "var(--danger)" : bal < Number(r.min_credits_threshold || 100) ? "var(--warn)" : "var(--success)" }}>
                    {bal < 0 ? `-₱${Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₱${bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>

                  <span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold inline-block"
                      style={{ background: stateMeta.bg, color: stateMeta.color }}
                    >
                      {stateMeta.label}
                    </span>
                  </span>

                  <span className="text-sm text-ink">{peso(Number(r.lifetime_commission || 0))}</span>
                  <span className="text-sm text-muted">{r.jobs_completed ?? 0}</span>
                  <span className="text-xs text-muted">
                    {r.last_job_date ? new Date(r.last_job_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </span>
                  <Icon name="chevron" className="w-4 h-4 text-muted shrink-0 hidden md:block" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="card p-5 mt-4">
        <p className="text-xs text-muted leading-relaxed">
          <span className="text-ink font-medium">How this works:</span> Every completed job auto-deducts 10% from the technician&apos;s wallet balance.
          When a technician tops up via GCash or Maya, the admin confirms the top-up on the{" "}
          <Link href="/admin/topups" className="text-accent hover:underline">Top-ups</Link>{" "}
          page and the balance is credited.
        </p>
      </div>
    </div>
  )
}

function Stat({ label, value, color, hint }: { label: string; value: string; color?: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">{label}</p>
      <p className="text-2xl font-semibold tracking-tight" style={{ color: color || "var(--ink)" }}>{value}</p>
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  )
}
