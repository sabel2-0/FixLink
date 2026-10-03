"use client"

import { useState } from "react"
import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"

type Role = "customer" | "technician"

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("customer")

  return (
    <div className="relative h-dvh overflow-y-auto bg-paper">
      {/* Fixed background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/login_wall.png"
        alt=""
        aria-hidden
        className="fixed inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      <div
        className="fixed inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,.45) 0%, rgba(0,0,0,.65) 100%)",
          zIndex: 1,
        }}
      />

      {/* Scrollable content */}
      <div className="relative flex flex-col min-h-full" style={{ zIndex: 2 }}>
        <header className="flex items-center justify-between px-5 sm:px-8 h-14 shrink-0">
          <Link href="/" className="display text-lg font-semibold text-white tracking-tight drop-shadow">
            FixLink
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/90 hover:text-white font-medium transition drop-shadow"
          >
            Log in
          </Link>
        </header>

        <main className="flex-1 flex items-start justify-center px-4 sm:px-6 pt-6 pb-16">
          <div className="w-full max-w-md">
            <div
              className="rounded-2xl p-6 sm:p-8 shadow-2xl"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line-2)",
              }}
            >
              <h1 className="text-xl font-semibold text-ink mb-1 tracking-tight">Create your account</h1>
              <p className="text-sm text-muted mb-6">Join FixLink as a customer or technician.</p>
              <RegisterForm onRoleChange={setRole} />
            </div>

            <p className="text-center text-sm text-white/85 mt-6 mb-10 drop-shadow">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-medium hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}