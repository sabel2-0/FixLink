"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Icon } from "@/lib/icons"
import { WalletCard } from "@/components/tech/WalletCard"
import { TopUpModal } from "@/components/tech/TopUpModal"
import { SiteName } from "@/components/shared/SiteNameProvider"

type TopUp = {
  id: string
  amount: number
  method: string
  reference: string | null
  status: "pending" | "confirmed" | "rejected"
  submitted_at: string
  confirmed_at: string | null
  rejection_reason: string | null
}

export default function TechWalletPage() {
  const supabase = createClient()
  const [balance, setBalance] = useState(0)
  const [threshold, setThreshold] = useState(100)
  const [topups, setTopups] = useState<TopUp[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: tp } = await supabase
        .from("technician_profiles")
        .select("credits_balance, min_credits_threshold")
        .eq("id", user.id)
        .maybeSingle()

      if (!cancelled && tp) {
        setBalance(Number(tp.credits_balance || 0))
        setThreshold(Number(tp.min_credits_threshold || 100))
      }

      const { data: tps } = await supabase
        .from("credit_topups")
        .select("id, amount, method, reference, status, submitted_at, confirmed_at, rejection_reason")
        .eq("technician_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(50)

      if (!cancelled) {
        setTopups((tps || []) as TopUp[])
        setLoading(false)
      }
    }

    load()

    const ch = supabase
      .channel("wallet:" + Date.now())
      .on("postgres_changes", { event: "*", schema: "public", table: "credit_topups" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "technician_profiles" }, () => load())
      .subscribe()

    return () => { cancelled = true; supabase.removeChannel(ch) }
  }, [supabase])

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-1 tracking-tight">Wallet</h1>
        <p className="text-muted"><SiteName /> charges a 10% commission per completed job, deducted from this balance.</p>
      </div>

      <div className="mb-8">
        <WalletCard balance={balance} threshold={threshold} onTopUp={() => setShowModal(true)} />
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xs uppercase tracking-wider text-muted font-medium">Top-up history</h2>
        {topups.length > 0 && <span className="text-[11px] text-muted">{topups.length}</span>}
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading...</p>
      ) : topups.length === 0 ? (
        <div className="card p-10 text-center">
          <div
            className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}
          >
            <Icon name="card" className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium mb-1">No top-ups yet</p>
          <p className="text-xs text-muted">Your submitted top-ups will appear here.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {topups.map((t) => {
              const statusColor =
                t.status === "confirmed" ? { bg: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)" } :
                t.status === "rejected" ? { bg: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)" } :
                { bg: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--warn)" }

              return (
                <div key={t.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">
                      ₱{Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-muted font-normal ml-2 text-xs uppercase">{t.method}</span>
                    </p>
                    {t.reference && (
                      <p className="text-xs text-muted mt-0.5 truncate">Ref: {t.reference}</p>
                    )}
                    <p className="text-[11px] text-muted mt-1">
                      {new Date(t.submitted_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                    {t.status === "rejected" && t.rejection_reason && (
                      <p className="text-[11px] mt-1" style={{ color: "var(--danger)" }}>
                        Reason: {t.rejection_reason}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold shrink-0"
                    style={{ background: statusColor.bg, color: statusColor.color }}
                  >
                    {t.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <TopUpModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
