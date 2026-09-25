import { RegisterForm } from "@/components/auth/register-form"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-paper py-16 px-4">
      <div className="w-full max-w-sm mx-auto">
        <Link href="/" className="display text-lg font-semibold block text-center mb-8 text-ink tracking-tight">
          FixLink
        </Link>
        <div className="card card-bordered p-6">
          <h2 className="text-base font-semibold text-ink mb-1">Create account</h2>
          <p className="text-xs text-muted mb-5">Join FixLink as a customer or technician.</p>
          <RegisterForm />
        </div>
        <p className="text-center text-sm text-muted mt-6">
          Already have an account? <Link href="/login" className="text-accent font-medium">Log in</Link>
        </p>
      </div>
    </div>
  )
}
