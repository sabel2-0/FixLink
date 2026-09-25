import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper py-16 px-4">
      <div className="w-full max-w-sm mx-auto">
        <Link href="/" className="display text-lg font-semibold block text-center mb-8 text-ink tracking-tight">
          FixLink
        </Link>
        <div className="card card-bordered p-6">
          <h2 className="text-base font-semibold text-ink mb-1">Welcome back</h2>
          <p className="text-xs text-muted mb-5">Log in to your FixLink account.</p>
          <LoginForm />
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Don&apos;t have an account? <Link href="/register" className="text-accent font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
