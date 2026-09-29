import { peso } from "@/lib/format"
import { Icon } from "@/lib/icons"

type Props = {
  finalAmount: number
  method: string | null
  reference: string | null
  recordedBy: string | null
  paidAt: string | null
  confirmedBy: string | null
  confirmedAt: string | null
  commission: number
  technicianName: string
  serviceLabel: string
  scheduledDate: string | null
}

export function PaymentReceipt({
  finalAmount, method, reference, recordedBy, paidAt,
  confirmedBy, confirmedAt, commission, technicianName, serviceLabel, scheduledDate,
}: Props) {
  const techKeeps = finalAmount - commission
  const verified = !!confirmedAt

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">Receipt</p>
        {verified ? (
          <span className="badge badge-active"><Icon name="check" className="w-3 h-3" />Verified</span>
        ) : (
          <span className="badge badge-pending">Awaiting tech confirmation</span>
        )}
      </div>

      <div className="space-y-3 text-sm mb-5 pb-5 border-b border-line">
        <div className="flex justify-between gap-3">
          <span className="text-muted">Service</span>
          <span className="text-right">{serviceLabel || "Service"}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted">Technician</span>
          <span className="text-right">{technicianName}</span>
        </div>
        {scheduledDate && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Completed</span>
            <span className="text-right">{scheduledDate}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 text-sm mb-5 pb-5 border-b border-line">
        <div className="flex justify-between">
          <span className="text-muted">Method</span>
          <span>{method || "—"}</span>
        </div>
        {reference && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Reference</span>
            <span className="text-right font-mono text-xs truncate">{reference}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted">Recorded by</span>
          <span className="capitalize">{recordedBy || "—"}</span>
        </div>
        {paidAt && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Recorded on</span>
            <span className="text-right">{new Date(paidAt).toLocaleString()}</span>
          </div>
        )}
        {confirmedAt && (
          <div className="flex justify-between gap-3">
            <span className="text-muted">Confirmed by</span>
            <span className="text-right capitalize">{confirmedBy || "—"} · {new Date(confirmedAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between">
          <span className="text-muted text-sm">Final price</span>
          <span className="font-semibold">{peso(finalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted text-sm">FixLink commission (10%)</span>
          <span>{peso(commission)}</span>
        </div>
        <div className="flex justify-between pt-2.5 border-t border-line">
          <span className="text-sm font-medium">Technician receives</span>
          <span className="font-semibold" style={{ color: "var(--success)" }}>{peso(techKeeps)}</span>
        </div>
      </div>
    </div>
  )
}