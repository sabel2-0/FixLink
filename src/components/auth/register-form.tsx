"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function RegisterForm() {
  const supabase = createClient()
  const router = useRouter()
  const [certFile, setCertFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [role, setRole] = useState<"customer" | "technician">("customer")
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  })

  function selectRole(r: "customer" | "technician") {
    setRole(r)
    setValue("role", r)
  }

  async function onSubmit(data: RegisterInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            role: data.role,
            phone: data.phone,
            cert_number: data.certNumber || null,
            cert_trade: data.certTrade || null,
          },
        },
      })
      if (authError) throw authError

      const userId = authData.user?.id
      if (!userId) throw new Error("Signup did not return a user")

      if (!authData.session) {
  router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
  return
}

      if (data.role === "technician" && certFile) {
        const ext = certFile.name.split(".").pop() || "bin"
        const path = `${userId}/nc2-certificate.${ext}`
        const { error: uploadError } = await supabase.storage
          .from("certs")
          .upload(path, certFile, { upsert: true })
        if (uploadError) throw uploadError

        await supabase
          .from("technician_profiles")
          .update({
            cert_file_path: path,
            cert_status: "pending",
            cert_submitted_at: new Date().toISOString(),
          })
          .eq("id", userId)
      }

      router.push(data.role === "technician" ? "/tech" : "/app")
      router.refresh()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="input-label">Full name</label>
        <input {...register("fullName")} placeholder="Juan Dela Cruz" className="input" />
        {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
      </div>

      <div>
        <label className="input-label">Email</label>
        <input {...register("email")} type="email" placeholder="you@example.com" className="input" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="input-label">Mobile</label>
        <input {...register("phone")} placeholder="+63 9XX XXX XXXX" className="input" />
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="input-label">Password</label>
        <input {...register("password")} type="password" placeholder="At least 8 characters" className="input" />
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      <div>
        <label className="input-label">I am a…</label>
        <div className="seg">
          <button type="button" className={role === "customer" ? "active" : ""} onClick={() => selectRole("customer")}>
            Customer
          </button>
          <button type="button" className={role === "technician" ? "active" : ""} onClick={() => selectRole("technician")}>
            Technician
          </button>
        </div>
      </div>

      {role === "technician" && (
        <div className="card-bordered rounded-xl p-3 space-y-3" style={{ border: "1px dashed var(--line)" }}>
          <p className="text-xs font-medium text-ink">Skills verification</p>
          <p className="text-xs text-muted leading-relaxed">
            To protect customers, technicians must pass ID and skills verification before taking jobs.
            A TESDA National Certificate II (NC2) in your trade is the fastest path — admin can also
            accept equivalent training certificates or manufacturer certifications, reviewed manually.
          </p>

          <input {...register("certNumber")} placeholder="e.g. NC2-AIRCON-2024-00123" className="input" />
          <input {...register("certTrade")} placeholder="e.g. RAC Servicing NC2 (Aircon & Ref)" className="input" />
          {errors.certTrade && <p className="text-xs text-red-500 mt-1">{errors.certTrade.message}</p>}

          <div>
            <label className="input-label">Upload certificate (optional now)</label>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
              className="input"
            />
            {certFile && <p className="text-xs text-muted mt-1">Selected: {certFile.name}</p>}
          </div>

          <p className="text-xs text-muted leading-relaxed">
            A photo or PDF of your certificate, plus the number above, lets admin verify you faster
            and more reliably than a number alone.
          </p>
        </div>
      )}

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
        {submitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-xs text-muted mt-2 leading-relaxed text-center">
        By continuing, you agree to the Terms of Service and Privacy Policy.
      </p>
    </form>
  )
}
