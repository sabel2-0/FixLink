export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="card card-bordered p-8 max-w-sm text-center">
        <h1 className="text-lg font-semibold text-ink mb-2">Check your inbox</h1>
        <p className="text-sm text-muted leading-relaxed">
          We sent you a verification link. Click it to activate your account, then come back and log in.
        </p>
      </div>
    </div>
  )
}
