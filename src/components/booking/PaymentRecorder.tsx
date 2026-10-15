"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Icon } from "@/lib/icons"

type Props = {
  bookingId: string
  finalAmount: number
  myRole: "customer" | "technician"
  techName: string
  techGcashNumber?: string | null
  techMayaNumber?: string | null
  techPreferredPayment?: string | null
}

type Wallet = "gcash" | "maya"

export function PaymentRecorder({
  bookingId,
  finalAmount,
  myRole,
  techName,
  techGcashNumber,
  techMayaNumber,
  techPreferredPayment,
}: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<"cash" | Wallet>("cash")
  const [wallet, setWallet] = useState<Wallet>(techPreferredPayment === "maya" ? "maya" : "gcash")
  const [reference, setReference] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasGcash = !!techGcashNumber
  const hasMaya  = !!techMayaNumber
  const onlineAvailable = hasGcash || hasMaya

  const activeNumber = wallet === "gcash" ? techGcashNumber : techMayaNumber
  const activeName = techName

  const qrPayload = activeNumber
    ? encodeURIComponent(`${wallet.toUpperCase()} — ${activeNumber} — ${activeName} — ₱${finalAmount}`)
    : ""
  const qrUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrPayload}`
    : ""

  function reset() {
    setReference("")
    setError(null)
    setChannel("cash")
  }

  function close() {
    if (busy) return
    reset()
    setOpen(false)
  }

  async function record() {
    setBusy(true); setError(null)
    try {
      const method =
        channel === "cash" ? "Cash" :
        channel === "gcash" ? "GCash" : "Maya"

      const { error: e } = await supabase
        .from("bookings")
        .update({
          payment_method: method,
          payment_reference: reference.trim() || null,
          paid_at: new Date().toISOString(),
          payment_recorded_by: myRole,
        })
        .eq("id", bookingId)
      if (e) throw e
      close()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary w-full !py-2.5 !text-sm"
      >
        <Icon name="dollar" className="w-4 h-4" />
        {myRole === "technician" ? "Record payment received" : "Pay technician"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between p-4 border-b border-line shrink-0">
              <div>
                <p className="font-semibold text-sm">
                  {myRole === "technician" ? "Record payment received" : "Pay technician"}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {myRole === "technician" ? `Recording for ${techName}` : `Paying ${techName}`}
                </p>
              </div>
              <button type="button" onClick={close} className="icon-btn" aria-label="Close">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Amount header */}
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
              >
                <p className="text-[10px] uppercase tracking-wider text-muted font-medium">Amount due</p>
                <p className="text-3xl font-semibold tracking-tight mt-1" style={{ color: "var(--ink)" }}>
                  ₱{finalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Cash vs Online */}
              <div>
                <label className="input-label">How will this be paid?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel("cash")}
                    className="rounded-xl p-3.5 text-sm font-medium transition flex flex-col items-center gap-1.5"
                    style={{
                      background: channel === "cash" ? "var(--accent-soft)" : "var(--surface-2)",
                      color: channel === "cash" ? "var(--accent)" : "var(--ink)",
                      border: channel === "cash" ? "2px solid var(--accent)" : "2px solid transparent",
                    }}
                  >
                    <Icon name="dollar" className="w-5 h-5" />
                    <span>Cash on hand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onlineAvailable && setChannel(wallet)}
                    disabled={!onlineAvailable}
                    className="rounded-xl p-3.5 text-sm font-medium transition flex flex-col items-center gap-1.5"
                    style={{
                      background: channel !== "cash" ? "var(--accent-soft)" : "var(--surface-2)",
                      color: channel !== "cash" ? "var(--accent)" : "var(--ink)",
                      border: channel !== "cash" ? "2px solid var(--accent)" : "2px solid transparent",
                      opacity: onlineAvailable ? 1 : 0.4,
                      cursor: onlineAvailable ? "pointer" : "not-allowed",
                    }}
                  >
                    <Icon name="card" className="w-5 h-5" />
                    <span>Online (GCash / Maya)</span>
                  </button>
                </div>
                {!onlineAvailable && (
                  <p className="text-[11px] text-muted mt-2">
                    {techName} hasn&apos;t added an e-wallet number yet. Pay in cash.
                  </p>
                )}
              </div>

              {/* Online payment details */}
              {channel !== "cash" && activeNumber && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    {hasGcash && (
                      <button
                        type="button"
                        onClick={() => setWallet("gcash")}
                        className="rounded-lg p-2 text-xs font-medium transition text-center"
                        style={{
                          background: wallet === "gcash" ? "var(--accent-soft)" : "var(--surface-2)",
                          color: wallet === "gcash" ? "var(--accent)" : "var(--ink)",
                          border: wallet === "gcash" ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                        }}
                      >
                        GCash
                      </button>
                    )}
                    {hasMaya && (
                      <button
                        type="button"
                        onClick={() => setWallet("maya")}
                        className="rounded-lg p-2 text-xs font-medium transition text-center"
                        style={{
                          background: wallet === "maya" ? "var(--accent-soft)" : "var(--surface-2)",
                          color: wallet === "maya" ? "var(--accent)" : "var(--ink)",
                          border: wallet === "maya" ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                        }}
                      >
                        Maya
                      </button>
                    )}
                  </div>

                  <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface-2)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="Payment QR"
                      width={112}
                      height={112}
                      className="rounded-lg bg-white p-1.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-1">
                        {wallet === "gcash" ? "Send GCash to" : "Send Maya to"}
                      </p>
                      <p className="text-base font-semibold text-ink">{activeNumber}</p>
                      <p className="text-xs text-muted mt-0.5">{activeName}</p>
                      <p className="text-[11px] text-muted mt-2 leading-relaxed">
                        Scan the QR or send to the number above. Use the exact amount ₱{finalAmount.toLocaleString()}.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="input-label">Reference number *</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="From your receipt (e.g. 0012 3456 7890)"
                      className="input"
                    />
                  </div>
                </>
              )}

              {channel === "cash" && (
                <div
                  className="rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2"
                  style={{ background: "var(--surface-2)", color: "var(--muted)" }}
                >
                  <Icon name="info" className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Hand ₱{finalAmount.toLocaleString()} to {techName}. The technician will need to confirm receipt on their side.
                  </span>
                </div>
              )}

              {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}
            </div>

            <div className="p-4 border-t border-line flex gap-3 shrink-0">
              <button type="button" onClick={close} disabled={busy} className="btn-secondary flex-1 !py-2.5 !text-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={record}
                disabled={
                  busy ||
                  (channel !== "cash" && !reference.trim())
                }
                className="btn-primary flex-1 !py-2.5 !text-sm disabled:opacity-50"
              >
                {busy ? "Saving..." : channel === "cash" ? "Confirm cash paid" : "Confirm online paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
