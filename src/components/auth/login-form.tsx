"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LoginForm({ notice }: { notice?: string | null } = {}) {
  const supabase = createClient()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      const { data: signIn, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      // Map Supabase's technical errors → friendly, non-enumerating messages
      if (error) {
        const msg = (error.message || "").toLowerCase()
        if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
          setFormError("Email or password is incorrect.")
        } else if (msg.includes("email not confirmed")) {
          setFormError("Please confirm your email first. Check your inbox (or spam).")
        } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
          setFormError("Too many attempts. Please wait a few minutes and try again.")
        } else {
          setFormError("Login failed. Please try again.")
        }
        return
      }

      const userId = signIn.user?.id
      if (!userId) throw new Error("No user returned")

      // Use .maybeSingle() so a missing profile returns null instead of a 406
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", userId)
        .maybeSingle()

      // Auth row exists but no profile = account was deleted by admin
      if (!profile) {
        await supabase.auth.signOut()
        setFormError("This account doesn't exist or has been removed. If you think this is a mistake, contact fixlink.ph@gmail.com.")
        return
      }

      // Suspended/deactivated account
      if (profile.status === "suspended") {
        await supabase.auth.signOut()
        setFormError("Your account has been deactivated. Contact fixlink.ph@gmail.com for help.")
        return
      }

      // Technician → check verification before routing to /tech
      if (profile.role === "technician") {
        const { data: tech } = await supabase
          .from("technician_profiles")
          .select("cert_status")
          .eq("id", userId)
          .maybeSingle()

        if (!tech || tech.cert_status !== "verified") {
          router.push("/registration-status")
          router.refresh()
          return
        }
        router.push("/tech")
        router.refresh()
        return
      }

      // Customer → check verification
      if (profile.role === "customer") {
        const { data: cust } = await supabase
          .from("profiles")
          .select("verification_status")
          .eq("id", userId)
          .maybeSingle()

        if (!cust || cust.verification_status !== "verified") {
          router.push("/registration-status")
          router.refresh()
          return
        }
        router.push("/app")
        router.refresh()
        return
      }

      if (profile.role === "admin") {
        router.push("/admin")
        router.refresh()
        return
      }

      router.push("/app")
      router.refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      {notice && (
        <div className="rounded-lg p-3 text-sm mb-1"
             style={{
               background: "color-mix(in srgb, var(--warn) 12%, transparent)",
               borderLeft: "3px solid var(--warn)",
               color: "var(--ink)",
             }}>
          {notice}
        </div>
      )}

      <div>
        <label className="input-label">Email</label>
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          className="input"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="input-label">Password</label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="input pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink transition"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full mt-2 !py-2.5 !text-[15px] whitespace-nowrap">
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  )
}