"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setSubmitting(true)
    setFormError(null)
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw error

      const userId = signInData.user?.id
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
      setFormError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="input-label">Email</label>
        <input {...register("email")} type="email" placeholder="you@example.com" className="input" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="input-label">Password</label>
        <input {...register("password")} type="password" placeholder="********" className="input" />
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <button type="submit" disabled={submitting} className="btn-primary w-full mt-2">
        {submitting ? "Logging in..." : "Log in"}
      </button>
    </form>
  )
}
