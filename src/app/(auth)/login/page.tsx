import { LoginForm } from "@/components/auth/login-form"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="relative h-full overflow-hidden bg-paper">
      {/* Full-page background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/login_wall.png"
        alt=""
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark gradient overlay so form is readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.6) 100%)",
        }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-14">
        <Link href="/" className="display text-lg font-semibold text-white tracking-tight drop-shadow">
          FixLink
        </Link>
        <Link
          href="/register"
          className="text-sm text-white/90 hover:text-white font-medium transition drop-shadow"
        >
          Sign up
        </Link>
      </header>

      {/* Centered form */}
      <main className="relative z-10 h-[calc(100%-3.5rem)] flex items-center justify-center p-5 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="card card-bordered p-6 sm:p-8 backdrop-blur-sm" style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)" }}>
            <h1 className="text-xl font-semibold text-ink mb-1 tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted mb-6">Log in to your FixLink account.</p>
            <LoginForm />
          </div>

          <p className="text-center text-sm text-white/80 mt-6 drop-shadow">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-white font-medium hover:underline">
              Sign up
            </Link>
          </p>

          <div className="text-center text-xs text-white/60 mt-8 mb-6 flex items-center justify-center gap-3 drop-shadow flex-wrap">
            <Link href="/help" target="_blank" className="hover:text-white/90">Help</Link>
            <span className="opacity-40">·</span>
            <Link href="/terms" target="_blank" className="hover:text-white/90">Terms</Link>
            <span className="opacity-40">·</span>
            <Link href="/privacy" target="_blank" className="hover:text-white/90">Privacy</Link>
          </div>
        </div>
      </main>
    </div>
  )
}