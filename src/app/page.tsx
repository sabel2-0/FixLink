import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 landing-nav">
        <div className="max-w-5xl mx-auto px-5 h-11 flex items-center justify-between">
          <Link href="/" className="display text-lg font-semibold text-ink tracking-tight">FixLink</Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted">
            <a href="#problem" className="hover:text-ink">Problem</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-accent font-medium">Log in</Link>
            <Link href="/register" className="btn-nav">Get started</Link>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-5 pt-24 pb-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="display text-5xl sm:text-6xl font-semibold leading-[1.05] mb-6 tracking-tighter">
            Trusted appliance repair, near you.
          </h1>
          <p className="text-muted text-lg mb-8 max-w-md leading-relaxed">
            Verified technicians for aircon, ref, washer, TV, and more. Real ratings,
            live tracking, and a written quote you approve before any work begins.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="btn-primary">Get started</Link>
            <a href="#how" className="btn-secondary">How it works</a>
          </div>
        </div>
        <div className="card p-7">
          <p className="text-xs uppercase tracking-wider text-muted mb-5 font-medium">Right now</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3.5 border-b border-line">
              <div>
                <p className="text-sm font-medium">Aircon cleaning — Lahug</p>
                <p className="text-xs text-muted mt-0.5">4 techs · 0.8 km</p>
              </div>
              <span className="badge badge-active">Open</span>
            </div>
            <div className="flex items-center justify-between py-3.5 border-b border-line">
              <div>
                <p className="text-sm font-medium">Ref check — Mabolo</p>
                <p className="text-xs text-muted mt-0.5">2 techs · 1.3 km</p>
              </div>
              <span className="badge badge-active">Open</span>
            </div>
            <div className="flex items-center justify-between py-3.5">
              <div>
                <p className="text-sm font-medium">Washer — Talamban</p>
                <p className="text-xs text-muted mt-0.5">3 techs · 1.9 km</p>
              </div>
              <span className="badge badge-active">Open</span>
            </div>
          </div>
        </div>
      </section>

      <section id="problem" className="section-alt border-y border-line">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <h2 className="display text-3xl font-semibold mb-3 tracking-tight">Why finding a repair tech is hard</h2>
          <p className="text-muted mb-12 max-w-xl">Four problems homeowners keep running into.</p>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
            <div>
              <p className="font-medium mb-2">Trust is a gamble</p>
              <p className="text-sm text-muted leading-relaxed">It&apos;s hard to find repair workers you can actually trust with your appliance.</p>
            </div>
            <div>
              <p className="font-medium mb-2">No idea what&apos;s fair</p>
              <p className="text-sm text-muted leading-relaxed">Customers rarely know the correct price before a technician arrives.</p>
            </div>
            <div>
              <p className="font-medium mb-2">Reliability varies</p>
              <p className="text-sm text-muted leading-relaxed">Some workers no-show, show up late, or don&apos;t finish the job properly.</p>
            </div>
            <div>
              <p className="font-medium mb-2">Searching wastes time</p>
              <p className="text-sm text-muted leading-relaxed">Asking around for a referral takes too long.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="max-w-5xl mx-auto px-5 py-20">
        <h2 className="display text-3xl font-semibold mb-3 tracking-tight">How it works</h2>
        <p className="text-muted mb-12 max-w-xl">Six steps from a broken appliance to a five-star technician.</p>
        <div className="grid sm:grid-cols-3 gap-x-10 gap-y-10">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">01</p>
            <p className="font-medium mb-1">Describe the problem</p>
            <p className="text-sm text-muted leading-relaxed">Pick the appliance and symptoms.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">02</p>
            <p className="font-medium mb-1">Pick technicians</p>
            <p className="text-sm text-muted leading-relaxed">Choose one or more. Compare their estimates.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">03</p>
            <p className="font-medium mb-1">Estimated price</p>
            <p className="text-sm text-muted leading-relaxed">Each tech gives an estimate based on the issue.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">04</p>
            <p className="font-medium mb-1">Quote after inspection</p>
            <p className="text-sm text-muted leading-relaxed">The tech arrives, checks the unit, submits a formal quotation.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">05</p>
            <p className="font-medium mb-1">Approve the final price</p>
            <p className="text-sm text-muted leading-relaxed">You approve. Work starts. That&apos;s the price.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">06</p>
            <p className="font-medium mb-1">Rate the job</p>
            <p className="text-sm text-muted leading-relaxed">Your review helps the next customer.</p>
          </div>
        </div>
        <div className="card p-6 mt-12 max-w-2xl">
          <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Three prices, one job</p>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className="price-stage stage-estimated shrink-0">Estimated</span>
              <p>A pre-inspection guess. What you compare when picking a technician. Not binding.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="price-stage stage-quotation shrink-0">Quotation</span>
              <p>The formal price after the technician inspects the appliance on-site. Itemized.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="price-stage stage-final shrink-0">Final</span>
              <p>What you approve and pay. Cash or GCash, directly to the technician.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="section-alt border-y border-line">
        <div className="max-w-5xl mx-auto px-5 py-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <p className="text-accent font-medium text-sm mb-3">For technicians</p>
              <h2 className="display text-3xl font-semibold mb-3 tracking-tight">
                Free to join. 10% commission per completed job.
              </h2>
              <p className="text-muted max-w-xl text-sm leading-relaxed">
                No monthly fees. No upfront cost. You only pay when you get paid. FixLink charges
                10% of the final approved price — the customer pays you directly, and you remit
                the commission to FixLink.
              </p>
            </div>
            <Link href="/register" className="btn-primary whitespace-nowrap">Apply as a technician</Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Free to join</p>
              <p className="text-2xl font-semibold mb-2 tracking-tight">₱0 upfront</p>
              <p className="text-sm text-muted leading-relaxed">
                Sign up, get verified, list your services. No credit card. No commitment.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Commission</p>
              <p className="text-2xl font-semibold mb-2 tracking-tight">10% per job</p>
              <p className="text-sm text-muted leading-relaxed">
                Charged only on completed jobs, on the final approved price. If you don&apos;t get paid, FixLink doesn&apos;t either.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Payment</p>
              <p className="text-2xl font-semibold mb-2 tracking-tight">Direct to you</p>
              <p className="text-sm text-muted leading-relaxed">
                The customer pays you directly. Remit your 10% to FixLink after each completed job — cash or GCash.
              </p>
            </div>
          </div>
          <div className="card p-6 mt-6 max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Example</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Customer approves final price</span>
                <span className="font-medium">₱1,000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">FixLink commission (10%)</span>
                <span>₱100</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-line">
                <span className="text-muted">Technician keeps</span>
                <span className="font-medium">₱900</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-sm text-muted">
        <div className="max-w-5xl mx-auto px-5 py-10 flex flex-col sm:flex-row justify-between gap-3 border-t border-line">
          <p>FixLink — 2026</p>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-ink">Log in</Link>
            <Link href="/register" className="hover:text-ink">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

