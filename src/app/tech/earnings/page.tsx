import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Icon } from "@/lib/icons"
import { peso } from "@/lib/format"
import { SiteName } from "@/components/shared/SiteNameProvider"

export default async function TechEarnings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: done } = await supabase
    .from("bookings")
    .select("id, scheduled_date, final_amount, final_commission, paid_at, payment_confirmed_at, customer:profiles!bookings_customer_id_fkey(full_name), booking_items(service)")
    .eq("technician_id", user.id)
    .eq("status", "completed")
    .order("scheduled_date", { ascending: false })

  const { data: wallet } = await supabase
    .from("technician_profiles")
    .select("credits_balance, min_credits_threshold")
    .eq("id", user.id)
    .maybeSingle()

  const list = done || []
  const balance = Number(wallet?.credits_balance ?? 0)
  const threshold = Number(wallet?.min_credits_threshold ?? 100)

  const jobsDone = list.length
  const grossEarned = list.reduce((s, b: any) => s + Number(b.final_amount || 0), 0)
  const collected = list.filter((b: any) => b.paid_at).reduce((s, b: any) => s + Number(b.final_amount || 0), 0)
  const awaitingPayment = list.filter((b: any) => !b.paid_at).reduce((s, b: any) => s + Number(b.final_amount || 0), 0)
  const lifetimeCommission = list.reduce((s, b: any) => s + Number(b.final_commission || 0), 0)

  const now = new Date()
  const monthCommission = list
    .filter((b: any) => {
      if (!b.scheduled_date) return false
      const d = new Date(b.scheduled_date)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((s, b: any) => s + Number(b.final_commission || 0), 0)

  const state =
    balance < 0 ? "owed"
    : balance < threshold ? "low"
    : "good"
  const stateTheme =
    state === "owed"
      ? { bg: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)", label: <>Balance owed to <SiteName /></> }
      : state === "low"
      ? { bg: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--warn)", label: "Low balance — top up soon" }
      : { bg: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)", label: "Good standing" }

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-2 tracking-tight">Earnings</h1>
      <p className="text-muted mb-6">You collect directly from customers. <SiteName /> auto-deducts 10% per completed job from your wallet.</p>

      {/* OWED BANNER — only when negative */}
      {balance < 0 && (
        <div
          className="card p-4 mb-4 flex items-center gap-3"
          style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", borderLeft: "4px solid var(--danger)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "color-mix(in srgb, var(--danger) 18%, transparent)", color: "var(--danger)" }}
          >
            <Icon name="alert" className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
              You owe <SiteName /> ₱{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted mt-0.5 leading-relaxed">
              Accumulated commission from completed jobs. Top up your wallet to resume appearing to new customers.
            </p>
          </div>
          <Link
            href="/tech/wallet"
            className="btn-primary !py-2 !px-3 !text-xs shrink-0"
          >
            Top up
          </Link>
        </div>
      )}
      {/* WALLET — the star of the show */}
      <div
        className="card p-6 mb-6"
        style={{ background: stateTheme.bg, border: "1px solid color-mix(in srgb, " + stateTheme.color + " 25%, transparent)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-wider font-medium mb-1" style={{ color: stateTheme.color }}><SiteName /> wallet
            </p>
            <p className="text-4xl font-semibold tracking-tight" style={{ color: stateTheme.color }}>
              ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs mt-2" style={{ color: stateTheme.color }}>
              {stateTheme.label}
              {state === "owed" && (
                <> — top up ₱{Math.abs(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })} to resume accepting jobs.</>
              )}
            </p>
          </div>
          <Link
            href="/tech/wallet"
            className="btn-primary !py-2.5 !px-4 !text-sm shrink-0"
          >
            <Icon name="card" className="w-4 h-4" />
            Manage wallet
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: "color-mix(in srgb, " + stateTheme.color + " 20%, transparent)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Minimum required</p>
            <p className="text-sm text-ink mt-0.5">₱{threshold.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Commission this month</p>
            <p className="text-sm text-ink mt-0.5">{peso(monthCommission)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Commission lifetime</p>
            <p className="text-sm text-ink mt-0.5">{peso(lifetimeCommission)}</p>
          </div>
        </div>
      </div>

      {/* EARNINGS STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Jobs done</p>
          <p className="text-3xl font-semibold tracking-tight">{jobsDone}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Gross earned</p>
          <p className="text-3xl font-semibold tracking-tight">{peso(grossEarned)}</p>
          <p className="text-xs text-muted mt-1">Total from completed jobs</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Collected</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: "var(--success)" }}>{peso(collected)}</p>
          <p className="text-xs text-muted mt-1">Customer has paid</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Awaiting payment</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: awaitingPayment > 0 ? "var(--warn)" : "var(--muted)" }}>{peso(awaitingPayment)}</p>
          <p className="text-xs text-muted mt-1">Jobs done, not yet paid</p>
        </div>
      </div>

      <div className="card p-6 mb-4">
        <p className="text-sm font-medium mb-1">How <SiteName /> charges you</p>
        <p className="text-xs text-muted leading-relaxed">
          Each completed job auto-deducts 10% from your <SiteName /> wallet. Top up your wallet via GCash or Maya and the admin will confirm.
          If your balance drops below ₱{threshold.toLocaleString()}, you&apos;re hidden from new customer listings until you top up.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-muted">No completed jobs yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr_1fr_28px] gap-3 px-5 py-3 border-b border-line text-[11px] uppercase tracking-wider text-muted font-medium">
            <span>Customer</span>
            <span>Service</span>
            <span>Date</span>
            <span>Final</span>
            <span>Net</span>
            <span>Payment</span>
            <span></span>
          </div>

          <div className="divide-y divide-line">
            {list.map((b: any) => {
              const paid = !!b.paid_at
              const confirmed = !!b.payment_confirmed_at
              const customer = b.customer?.full_name || "Customer"
              const service = (b.booking_items || []).map((i: any) => i.service).join(", ")
              const net = Number(b.final_amount || 0) - Number(b.final_commission || 0)

              return (
                <Link
                  key={b.id}
                  href={`/tech/jobs/${b.id}`}
                  className="grid grid-cols-1 md:grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr_1fr_28px] gap-3 px-5 py-4 hover:bg-surface-2 transition items-center"
                >
                  <span className="text-sm font-medium text-ink truncate">{customer}</span>
                  <span className="text-sm text-muted truncate">{service || "Service"}</span>
                  <span className="text-xs text-muted">{b.scheduled_date}</span>
                  <span className="text-sm text-ink">{peso(b.final_amount)}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--success)" }}>{peso(net)}</span>
                  <span>
                    {!paid ? (
                      <span className="badge badge-pending">Not paid</span>
                    ) : !confirmed ? (
                      <span className="badge badge-warn">Paid, unverified</span>
                    ) : (
                      <span className="badge badge-active"><span aria-hidden>✓</span> Verified</span>
                    )}
                  </span>
                  <Icon name="chevron" className="w-4 h-4 text-muted shrink-0 hidden md:block" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
