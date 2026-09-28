import { Suspense } from "react"
import VerifyForm from "./verify-form"

export const dynamic = "force-dynamic"

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
