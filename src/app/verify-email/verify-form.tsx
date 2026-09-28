"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function VerifyForm() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const emailFromQuery = params.get("email") ?? ""

  const [email, setEmail] = useState(emailFromQuery)
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [resentAt, setResentAt] = useState<number | null>(null)

  useEffect(() => {
    if (!cooldown) return
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  async function verify() {
    const trimmed = code.trim()
    if (!trimmed) {
      setError("Enter the code from your email")
      return
    }
    if (!email) {
      setError("Missing email. Go back and sign up again.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: trimmed,
        type: "signup",
      })
      if (verifyError) throw verifyError

      const userId = data.user?.id
      if (!userId) throw new Error("No user returned")

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

      const dest =
        profile?.role === "technician" ? "/tech" : profile?.role === "admin" ? "/admin" : "/app"

      router.push(dest)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code")
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    if (!email) {
      setError("Missing email. Go back and sign up again.")
      return
    }
    setError(null)
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    })
    if (resendError) {
      setError(resendError.message)
      return
    }
    setResentAt(Date.now())
    setCooldown(60)
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="card card-bordered p-8 max-w-sm w-full">
        <Link
          href="/"
          className="display text-lg font-semibold block text-center mb-6 text-ink"
        >
          FixLink
        </Link>

        <h1 className="text-lg font-semibold text-ink mb-1 text-center">Check your inbox</h1>
        <p className="text-sm text-muted text-center mb-6 leading-relaxed">
          We sent a verification code to
          <br />
          <b className="text-ink">{email || "your email"}</b>
        </p>

        {!emailFromQuery && (
          <div className="mb-4">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        )}

        <div className="mb-5">
          <label className="input-label">Verification code</label>
          <input
            className="input text-center font-mono text-2xl tracking-[0.5em] py-4"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") verify()
            }}
            placeholder="00000000"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm mb-3 text-center" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <button
          onClick={verify}
          disabled={submitting || !code}
          className="btn-primary w-full mb-3"
        >
          {submitting ? "Verifying…" : "Verify"}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0}
          className="btn-link w-full text-center text-sm"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Didn't get a code? Resend"}
        </button>

        {resentAt && cooldown > 0 && (
          <p className="text-xs text-muted text-center mt-3">
            New code sent. Check your inbox.
          </p>
        )}

        <p className="text-xs text-muted text-center mt-6">
          <Link href="/register" className="btn-link">
            ← Back to sign up
          </Link>
        </p>
      </div>
    </div>
  )
}