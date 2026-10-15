"use client"

import Link from "next/link"
import { Icon } from "@/lib/icons"
import { SiteName } from "@/components/shared/SiteNameProvider"

type Props = {
  balance: number
  threshold: number
  onTopUp: () => void
}

export function WalletCard({ balance, threshold, onTopUp }: Props) {
  const status =
    balance < 0 ? "negative" :
    balance < threshold ? "low" :
    "good"

  const theme =
    status === "negative"
      ? { bg: "color-mix(in srgb, var(--danger) 15%, transparent)", color: "var(--danger)", label: "Negative balance" }
      : status === "low"
      ? { bg: "color-mix(in srgb, var(--warn) 15%, transparent)", color: "var(--warn)", label: "Low balance" }
      : { bg: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)", label: "Good standing" }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-1"><SiteName /> Wallet</p>
          <p className="text-3xl font-semibold tracking-tight" style={{ color: balance < threshold ? theme.color : "var(--ink)" }}>
            ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted mt-1">
            Minimum required: ₱{threshold.toLocaleString(undefined, { minimumFractionDigits: 0 })}
          </p>
        </div>
        <span
          className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-semibold"
          style={{ background: theme.bg, color: theme.color }}
        >
          {theme.label}
        </span>
      </div>

      {status !== "good" && (
        <div
          className="rounded-lg p-3 mb-4 text-xs leading-relaxed flex items-start gap-2"
          style={{ background: theme.bg, color: theme.color }}
        >
          <Icon name="alert" className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            {status === "negative"
              ? "You have a negative balance. Top up to resume accepting new jobs."
              : "Your balance is below the minimum. Top up soon to keep receiving requests."}
          </span>
        </div>
      )}

      <div className="flex gap-2">
        <button type="button" onClick={onTopUp} className="btn-primary flex-1 !py-2.5 !text-sm">
          <Icon name="plus" className="w-4 h-4" />
          Top up wallet
        </button>
        <Link href="/tech/earnings" className="btn-secondary !py-2.5 !text-sm">
          <Icon name="dollar" className="w-4 h-4" />
          Earnings
        </Link>
      </div>
    </div>
  )
}
