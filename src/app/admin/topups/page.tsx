import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/lib/icons"
import { EmptyState } from "@/components/ui/EmptyState"
import { TopupActions } from "@/components/admin/topup-actions"
import { RealtimeRefresh } from "@/components/RealtimeRefresh"

function fmtAmt(n: number) {
  return "₱" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
}

export default async function AdminTopups() {
  const supabase = await createClient()

  const { data: rows } = await supabase
    .from("credit_topups")
    .select("id, amount, method, reference, note, status, submitted_at, confirmed_at, rejection_reason, technician_id")
    .order("submitted_at", { ascending: false })
    .limit(200)

  const list = rows || []
  const pending   = list.filter((r: any) => r.status === "pending")
  const confirmed = list.filter((r: any) => r.status === "confirmed")
  const rejected  = list.filter((r: any) => r.status === "rejected")

  const techIds = [...new Set(list.map((r: any) => r.technician_id).filter(Boolean))]
  const { data: techs } = techIds.length
    ? await supabase
        .from("technician_profiles")
        .select("id, credits_balance, min_credits_threshold, profile:profiles!technician_profiles_id_fkey(full_name)")
        .in("id", techIds)
    : { data: [] as any[] }

  const techMap: Record<string, any> = {}
  for (const t of techs || []) techMap[t.id] = t

  return (
    <div className="max-w-5xl">
      <RealtimeRefresh tables={["credit_topups"]} />

      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1 tracking-tight">Top-ups</h1>
        <p className="text-muted">Confirm e-wallet payments to credit technicians&apos; wallets.</p>
      </div>

      {/* Pending */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xs uppercase tracking-wider text-muted font-medium">Pending</h2>
          {pending.length > 0 && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: "color-mix(in srgb, var(--warn) 18%, transparent)", color: "var(--warn)" }}
            >
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="card p-8">
            <EmptyState icon="check" title="No pending top-ups" description="Everything's been reviewed." />
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((t: any) => {
              const tech = techMap[t.technician_id]
              const name = tech?.profile?.full_name || "Technician"
              const balance = Number(tech?.credits_balance || 0)
              const threshold = Number(tech?.min_credits_threshold || 100)
              return (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-semibold shrink-0 text-sm"
                        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                      >
                        {name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{name}</p>
                        <p className="text-xs text-muted">
                          Balance: {fmtAmt(balance)} · Min: {fmtAmt(threshold)}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-ink shrink-0">{fmtAmt(Number(t.amount))}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Method</p>
                      <p className="text-sm text-ink mt-1 uppercase">{t.method}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Reference</p>
                      <p className="text-sm text-ink mt-1 break-all">{t.reference || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Submitted</p>
                      <p className="text-sm text-ink mt-1">{fmtDate(t.submitted_at)}</p>
                    </div>
                    {t.note && (
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Note</p>
                        <p className="text-sm text-muted mt-1 italic">"{t.note}"</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
                    <p className="text-xs text-muted">
                      Verify this reference in your GCash/Maya history before confirming.
                    </p>
                    <TopupActions topupId={t.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* History */}
      {list.length > pending.length && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xs uppercase tracking-wider text-muted font-medium">History</h2>
            <span className="text-[10px] text-muted">{confirmed.length + rejected.length}</span>
          </div>

          <div className="card overflow-hidden">
            <div className="divide-y divide-line">
              {[...confirmed, ...rejected].map((t: any) => {
                const tech = techMap[t.technician_id]
                const name = tech?.profile?.full_name || "Technician"
                const color =
                  t.status === "confirmed"
                    ? { bg: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" }
                    : { bg: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)" }

                return (
                  <div key={t.id} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {name} · <span className="text-muted font-normal">{fmtAmt(Number(t.amount))} via {t.method.toUpperCase()}</span>
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {fmtDate(t.submitted_at)}
                        {t.reference && <> · Ref: {t.reference}</>}
                      </p>
                      {t.status === "rejected" && t.rejection_reason && (
                        <p className="text-[11px] mt-1" style={{ color: "var(--danger)" }}>
                          Reason: {t.rejection_reason}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold shrink-0"
                      style={{ background: color.bg, color: color.color }}
                    >
                      {t.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
