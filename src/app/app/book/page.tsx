"use client"

export const dynamic = "force-dynamic"



import { useEffect, useMemo, useState } from "react"

import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

import { Icon, ApplianceIcon } from "@/lib/icons"
import { Badge } from "@/components/ui/Badge"

import { useToast } from "@/components/ui/AppToast"

import { SERVICES, COMMON_PROBLEMS, nearestBarangay, haversine, BARANGAYS } from "@/lib/booking/constants"

import { NearbyMap } from "@/components/booking/NearbyMap"



type Tech = {

  id: string

  rating: number | null

  jobs_completed: number | null

  home_barangay: string | null

  home_lat: number | null

  home_lng: number | null

  service_radius_km: number | null

  cert_status: string | null

  profile?: { full_name: string } | null

  technician_services?: { service: string }[] | null

}



function cityOf(barangay: string | null | undefined): string {

  if (!barangay) return "Other"

  const b = barangay.toLowerCase()

  if (b.includes("mactan") || b.includes("lapu") || b.includes("pusok") || b.includes("bankal") || b.includes("basak") || b.includes("ibo") || b.includes("babag") || b.includes("gun-ob")) return "Mactan"

  if (b.includes("mandaue")) return "Mandaue"

  if (b.includes("cordova")) return "Cordova"

  if (b.includes("talisay") || b.includes("tabunok")) return "Talisay"

  return "Cebu City"

}



export default function BookPage() {

  const supabase = createClient()

  const router = useRouter()

  const toast = useToast()



  const [step, setStep] = useState(1)

  const [services, setServices] = useState<string[]>([])

  const [issues, setIssues] = useState<Record<string, { problems: string[]; notes: string }>>({})

  const [lat, setLat] = useState<number | null>(null)

  const [lng, setLng] = useState<number | null>(null)

  const [locVerified, setLocVerified] = useState(false)

  const [date, setDate] = useState("")

  const [time, setTime] = useState("")

  const [landmark, setLandmark] = useState("")

  const [addressLabel, setAddressLabel] = useState("")

  const [techs, setTechs] = useState<Tech[]>([])

  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([])

  const [loadingTechs, setLoadingTechs] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const [cityFilter, setCityFilter] = useState("All")

  const [focusId, setFocusId] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeBooking, setActiveBooking] = useState<{ id: string; status: string } | null>(null)

  const [barangayFilter, setBarangayFilter] = useState("All")



  useEffect(() => { setBarangayFilter("All") }, [cityFilter])



  useEffect(() => {

    if (step !== 4) return

    let cancelled = false

    setLoadingTechs(true)

    ;(async () => {

      const { data, error } = await supabase

        .from("technician_profiles")

        .select("id, rating, jobs_completed, home_barangay, home_lat, home_lng, service_radius_km, cert_status, technician_services!technician_services_technician_id_fkey(service), profile:profiles!technician_profiles_id_fkey(full_name)")

      if (cancelled) return

      if (error) { console.error(error); toast(error.message); setLoadingTechs(false); return }

      const filtered = (data as unknown as Tech[]).filter((t) => {

        const svc = (t.technician_services || []).map((s) => s.service)

        return services.every((s) => svc.includes(s))

      })

      setTechs(filtered)

      setLoadingTechs(false)

    })()

    return () => { cancelled = true }

  }, [step, services, supabase, toast])



  useEffect(() => {

    if (lat == null || lng == null) return

    let cancelled = false

    ;(async () => {

      try {

        const url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=16&addressdetails=1"

        const res = await fetch(url, { headers: { "Accept-Language": "en" } })

        const data = await res.json()

        if (cancelled) return

        const a = data.address || {}

        const parts = [a.village || a.suburb || a.neighbourhood || a.hamlet, a.town || a.city || a.municipality, a.province || a.state].filter(Boolean)

        setAddressLabel(parts.join(", ") || data.display_name || "")

      } catch (e) {

        if (!cancelled) setAddressLabel(nearestBarangay(lat, lng).name)

      }

    })()

    return () => { cancelled = true }

  }, [lat, lng])



    // Check for existing active booking on mount (blocks the whole wizard)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase
        .from("bookings")
        .select("id, status")
        .eq("customer_id", user.id)
        .in("status", ["pending","estimated","confirmed","en_route","arrived","in_progress","quote_pending","awaiting_confirmation"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) setActiveBooking(data || null)
    })()
    return () => { cancelled = true }
  }, [step, supabase])
const withDist = useMemo(() => {

    return techs.map((t) => {

      const km = (lat != null && lng != null && t.home_lat != null && t.home_lng != null) ? haversine(lat, lng, t.home_lat, t.home_lng) : 999

      return { t, km }

    }).filter((x) => x.km <= (x.t.service_radius_km || 50))

      .sort((a, b) => a.km - b.km || (b.t.rating || 0) - (a.t.rating || 0))

  }, [techs, lat, lng])



  const cityTechs = useMemo(() => withDist.filter((x) => cityFilter === "All" || cityOf(x.t.home_barangay) === cityFilter), [withDist, cityFilter])

  const barangayTechs = useMemo(() => barangayFilter === "All" ? cityTechs : cityTechs.filter((x) => (x.t.home_barangay || "") === barangayFilter), [cityTechs, barangayFilter])



  const cityCounts = useMemo(() => {

    const m: Record<string, number> = {}

    for (const x of withDist) { const c = cityOf(x.t.home_barangay); m[c] = (m[c] || 0) + 1 }

    return m

  }, [withDist])



  const barangayCounts = useMemo(() => {

    const m: Record<string, number> = {}

    for (const x of cityTechs) { const b = x.t.home_barangay || "Unknown"; m[b] = (m[b] || 0) + 1 }

    return m

  }, [cityTechs])



  function toggleService(label: string) {

    setServices((prev) => {

      const has = prev.includes(label)

      if (has) {

        setIssues((i) => { const c = Object.assign({}, i); delete c[label]; return c })

        return prev.filter((x) => x !== label)

      }

      setIssues((i) => Object.assign({}, i, { [label]: i[label] || { problems: [], notes: "" } }))

      return prev.concat([label])

    })

  }



  function toggleProblem(label: string, p: string) {

    setIssues((prev) => {

      const cur = prev[label] || { problems: [], notes: "" }

      const has = cur.problems.includes(p)

      const next = Object.assign({}, prev)

      next[label] = Object.assign({}, cur, { problems: has ? cur.problems.filter((x) => x !== p) : cur.problems.concat([p]) })

      return next

    })

  }



  function setNotes(label: string, v: string) {

    setIssues((prev) => {

      const cur = prev[label] || { problems: [], notes: "" }

      const next = Object.assign({}, prev)

      next[label] = Object.assign({}, cur, { notes: v })

      return next

    })

  }



  function detectLocation() {

    if (!navigator.geolocation) { toast("Geolocation not supported"); return }

    toast("Getting location...")

    navigator.geolocation.getCurrentPosition(

      (pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); setLocVerified(true); toast("Location verified") },

      () => { const b = BARANGAYS[0]; setLat(b.lat); setLng(b.lng); setLocVerified(true); toast("Using default Cebu location") },

      { enableHighAccuracy: true, timeout: 8000 }

    )

  }



  function toggleTech(id: string) {

    setSelectedTechIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.concat([id])))

  }



  const canNext =

    step === 1 ? services.length > 0 :

    step === 2 ? services.length > 0 && services.every((s) => (issues[s] && issues[s].problems.length) > 0) :

    step === 3 ? !!(locVerified && date && time) :

    selectedTechIds.length > 0



  async function submit() {

    if (!canNext || submitting) return

    setSubmitting(true)

    try {

      const res = await supabase.auth.getUser()

      const user = res.data.user

      if (!user) throw new Error("Not signed in")

      const bar = (lat != null && lng != null) ? nearestBarangay(lat, lng) : BARANGAYS[0]

      const insRes = await supabase.from("bookings").insert({

        customer_id: user.id,

        status: "pending",

        barangay: bar.name,

        address: (landmark ? landmark + ", " : "") + bar.name + ", Cebu City",

        lat: lat, lng: lng,

        scheduled_date: date,

        scheduled_time: time,

        requested_techs: selectedTechIds,

      }).select("id").single()

      if (insRes.error) throw insRes.error

      const bookingId = insRes.data.id



      const items = services.map((s) => ({

        booking_id: bookingId, service: s,

        problems: (issues[s] && issues[s].problems) || [],

        notes: (issues[s] && issues[s].notes) || null,

      }))

      const iRes = await supabase.from("booking_items").insert(items)

      if (iRes.error) throw iRes.error



      const rows = selectedTechIds.map((tid) => ({ booking_id: bookingId, technician_id: tid }))

      const rRes = await supabase.from("booking_requested_techs").insert(rows)

      if (rRes.error) throw rRes.error



      toast("Request sent to " + selectedTechIds.length + " technician" + (selectedTechIds.length === 1 ? "" : "s"))

      router.push("/app/bookings")

    } catch (e) {

      toast(e instanceof Error ? e.message : "Something went wrong")

    } finally {

      setSubmitting(false)

    }

  }



    if (activeBooking) {
      return (
        <div className="max-w-xl">
          <div className="card p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "color-mix(in srgb, var(--warn) 18%, transparent)", color: "var(--warn)" }}>
                <Icon name="alert" className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight mb-1">You already have an active booking</h2>
                <p className="text-sm text-muted leading-relaxed">
                  Only one service request can be open at a time. Finish or cancel your current booking before creating a new one.
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-surface-2 p-4 mb-5">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="text-xs uppercase tracking-wider text-muted font-medium">Current booking</span>
                <Badge status={activeBooking.status} />
              </div>
              <p className="text-xs text-muted mt-1">Booking #{activeBooking.id}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={"/app/bookings/" + activeBooking.id} className="btn-primary flex-1">
                <Icon name="chevron" className="w-4 h-4" />
                View current booking
              </a>
              <a href="/app" className="btn-secondary flex-1">
                Back to home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return (

    <div className={step === 4 ? "max-w-6xl" : "max-w-2xl"}>

      {step === 1 && (

        <div>

          <h2 className="text-3xl font-semibold mb-2 tracking-tight">What needs fixing?</h2>

          <p className="text-muted mb-8">Pick one or more appliances.</p>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">

            {SERVICES.map((s) => {

              const sel = services.includes(s.label)

              return (

                <button key={s.id} type="button" onClick={() => toggleService(s.label)} className={"appliance-tile " + (sel ? "selected" : "")}>

                  <div className="icon-wrap">

                    <ApplianceIcon id={s.id} />

                    {sel && <span className="sel-check"><Icon name="check" className="w-2.5 h-2.5" /></span>}

                  </div>

                  <p className="label">{s.label}</p>

                </button>

              )

            })}

          </div>

        </div>

      )}



      {step === 2 && (

        <div>

          <h2 className="text-3xl font-semibold mb-2 tracking-tight">What is wrong with each?</h2>

          <p className="text-muted mb-8">Select symptoms for each appliance.</p>

          <div className="space-y-5">

            {services.map((label) => {

              const svc = SERVICES.find((s) => s.label === label)

              const probs = svc ? (COMMON_PROBLEMS[svc.id] || []) : []

              const st = issues[label] || { problems: [], notes: "" }

              const badgeCls = "badge " + (st.problems.length ? "badge-info" : "badge-warn")

              return (

                <div key={label} className="card card-bordered overflow-hidden">

                  <div className="flex items-center gap-3 p-4 border-b border-line bg-surface-2">

                    {svc && <ApplianceIcon id={svc.id} className="w-5 h-5" />}

                    <p className="font-medium flex-1">{label}</p>

                    <span className={badgeCls}>{st.problems.length ? st.problems.length + " selected" : "Pick at least 1"}</span>

                  </div>

                  {probs.map((p) => {

                    const sel = st.problems.includes(p)

                    return (

                      <button key={p} type="button" onClick={() => toggleProblem(label, p)} className={"problem-checkbox " + (sel ? "selected" : "")}>

                        <span className="box">{sel && <Icon name="check" className="w-3 h-3" />}</span>

                        <span>{p}</span>

                      </button>

                    )

                  })}

                  <div className="p-3 border-t border-line">

                    <textarea rows={2} className="input text-sm" placeholder={"Anything else about the " + label.toLowerCase() + "? (optional)"} value={st.notes} onChange={(e) => setNotes(label, e.target.value)} />

                  </div>

                </div>

              )

            })}

          </div>

        </div>

      )}



      {step === 3 && (

        <div>

          <h2 className="text-3xl font-semibold mb-2 tracking-tight">Where and when?</h2>

          <p className="text-muted mb-8">One visit covers all {services.length} appliance{services.length === 1 ? "" : "s"}.</p>

          <div className="space-y-4">

            {locVerified && lat != null && lng != null ? (

              <div className="space-y-3">

                <div className="location-verified">

                  <div className="dot" />

                  <span>{addressLabel || ("Near " + nearestBarangay(lat, lng).name)}</span>

                </div>

                <div className="rounded-xl overflow-hidden border border-line" style={{ height: 260 }}>

                  <NearbyMap meLat={lat} meLng={lng} height="100%" techs={[]} />

                </div>

              </div>

            ) : (

              <div>

                <label className="input-label">Location</label>

                <button type="button" onClick={detectLocation} className="btn-secondary w-full">Detect my location</button>

              </div>

            )}

            {locVerified && (

              <div>

                <label className="input-label">Landmark or unit (optional)</label>

                <input className="input" value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Unit 4B, near SM Seaside" />

              </div>

            )}

            <div>

              <label className="input-label">Date</label>

              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />

            </div>

            <div>

              <label className="input-label">Time</label>

              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />

            </div>

          </div>

        </div>

      )}



      {step === 4 && (

        <div className="flex flex-col md:h-[calc(100vh-220px)] md:min-h-[460px]">

          <div className="flex items-center justify-between mb-3">

            <h2 className="text-2xl font-semibold tracking-tight">Pick technicians</h2>

            <p className="text-xs text-muted hidden sm:block">Filter by city · select one or more</p>

          </div>



          {loadingTechs && <p className="text-muted">Loading technicians...</p>}



          {!loadingTechs && withDist.length === 0 && (

            <p className="text-muted">No technicians available for these services near you.</p>

          )}



          {!loadingTechs && withDist.length > 0 && (

            <>

              <div className="flex flex-wrap gap-2 mb-3 shrink-0">

                <button type="button" onClick={() => setCityFilter("All")} className={cityFilter === "All" ? "chip chip-active" : "chip"}>

                  All ({withDist.length})

                </button>

                {["Cebu City", "Mactan", "Mandaue", "Cordova", "Talisay"].map((city) => {

                  const count = cityCounts[city] || 0

                  if (count === 0) return null

                  return (

                    <button key={city} type="button" onClick={() => setCityFilter(city)} className={cityFilter === city ? "chip chip-active" : "chip"}>

                      {city} ({count})

                    </button>

                  )

                })}

              </div>



              {cityFilter !== "All" && Object.keys(barangayCounts).length > 1 && (

                <div className="flex flex-wrap gap-2 mb-4 shrink-0">

                  <button type="button" onClick={() => setBarangayFilter("All")} className={barangayFilter === "All" ? "chip chip-active" : "chip"}>

                    All {cityFilter} ({cityTechs.length})

                  </button>

                  {Object.keys(barangayCounts).sort().map((b) => (

                    <button key={b} type="button" onClick={() => setBarangayFilter(b)} className={barangayFilter === b ? "chip chip-active" : "chip"}>

                      {b} ({barangayCounts[b]})

                    </button>

                  ))}

                </div>

              )}



              <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:overflow-hidden">

                <div className="rounded-2xl overflow-hidden border border-line h-[280px] sm:h-[340px] lg:h-full">

                  <NearbyMap

                    meLat={lat}

                    meLng={lng}

                    height="100%"

                    onToggle={toggleTech}

                    focusId={focusId}

                    techs={barangayTechs.map((x) => ({

                      id: x.t.id,

                      lat: x.t.home_lat as number,

                      lng: x.t.home_lng as number,

                      name: (x.t.profile && x.t.profile.full_name) || "Tech",

                      isSelected: selectedTechIds.includes(x.t.id),

                      rating: x.t.rating || 0,

                      jobs: x.t.jobs_completed || 0,

                      distanceKm: x.km,

                      services: (x.t.technician_services || []).map((s) => s.service),

                      certified: x.t.cert_status === "verified",

                    }))}

                  />

                </div>



                <div className="rounded-2xl border border-line overflow-y-auto bg-surface h-[300px] sm:h-[360px] lg:h-full">

                  {barangayTechs.length === 0 ? (

                    <p className="p-6 text-sm text-muted">No technicians in this area.</p>

                  ) : (

                    <div className="divide-y divide-line">

                      {barangayTechs.map((x) => {

                        const t = x.t

                        const km = x.km

                        const sel = selectedTechIds.includes(t.id)

                        const name = (t.profile && t.profile.full_name) || "Technician"

                        return (

                          <button key={t.id} type="button" onClick={() => { toggleTech(t.id); setFocusId(t.id) }} className={"w-full text-left p-4 hover:bg-surface-2 transition flex items-start gap-3 " + (sel ? "bg-accent-soft" : "")}>

                            <span className={"check-circle mt-0.5 " + (sel ? "selected" : "")} style={{ flexShrink: 0 }}>

                              {sel && <Icon name="check" className="w-3.5 h-3.5" />}

                            </span>

                            <span className="flex-1 min-w-0">

                              <span className="flex items-center gap-1.5 text-base font-medium">

                                {name}

                                {t.cert_status === "verified" && <Icon name="shieldCheck" className="w-4 h-4 text-[var(--success)]" />}

                              </span>

                              <span className="block text-xs text-muted mt-1">

                                ★ {(t.rating || 0).toFixed(1)} · {t.jobs_completed || 0} jobs · {km.toFixed(1)} km

                              </span>

                              <span className="block text-xs text-muted mt-0.5">{t.home_barangay}</span>

                            </span>

                          </button>

                        )

                      })}

                    </div>

                  )}

                </div>

              </div>

            </>

          )}

        </div>

      )}



        <div className={"flex flex-col-reverse sm:flex-row gap-3 shrink-0 " + (step === 4 ? "mt-4 pt-4 border-t border-line" : "mt-10")}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="btn-secondary sm:flex-1"
            >
              <Icon name="back" className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            type="button"
            disabled={!canNext || submitting}
            onClick={() => (step < 4 ? setStep(step + 1) : setShowConfirm(true))}
            className="btn-primary sm:flex-1"
          >
            {step === 4 ? (
              <>
                <span>{submitting ? "Sending…" : "Request estimates"}</span>
                {!submitting && selectedTechIds.length > 0 && (
                  <span style={{
                    background: "rgba(255,255,255,.22)",
                    borderRadius: 999,
                    padding: "1px 8px",
                    fontSize: 12,
                    fontWeight: 600,
                    marginLeft: 4,
                  }}>
                    {selectedTechIds.length}
                  </span>
                )}
              </>
            ) : (
              <>
                <span>Next</span>
                <Icon name="chevron" className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div className="bg-surface w-full sm:rounded-2xl rounded-t-2xl max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-surface z-10">
              <p className="font-semibold text-sm">Confirm your request</p>
              <button type="button" onClick={() => setShowConfirm(false)} className="icon-btn">
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Appliances</p>
                <div className="space-y-2">
                  {services.map((s) => {
                    const st = issues[s] || { problems: [], notes: "" }
                    return (
                      <div key={s} className="px-3 py-2 rounded-lg bg-surface-2">
                        <p className="text-sm font-medium">{s}</p>
                        <p className="text-xs text-muted mt-0.5">{st.problems.join(", ") || "—"}</p>
                        {st.notes && <p className="text-xs text-muted mt-1 italic">"{st.notes}"</p>}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">When & where</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Date</span>
                    <span>{date}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Time</span>
                    <span>{time}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">Location</span>
                    <span className="text-right">{addressLabel || (lat != null && lng != null ? nearestBarangay(lat, lng).name : "—")}</span>
                  </div>
                  {landmark && (
                    <div className="flex justify-between gap-3">
                      <span className="text-muted">Landmark</span>
                      <span className="text-right">{landmark}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">
                  Technicians · {selectedTechIds.length}
                </p>
                <div className="space-y-1.5">
                  {withDist
                    .filter((x) => selectedTechIds.includes(x.t.id))
                    .map((x) => (
                      <div key={x.t.id} className="flex items-center justify-between gap-3 text-sm">
                        <span>{(x.t.profile && x.t.profile.full_name) || "Technician"}</span>
                        <span className="text-xs text-muted">{x.km.toFixed(1)} km away</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-lg bg-accent-soft p-3 text-xs leading-relaxed" style={{ color: "var(--accent)" }}>
                Each technician will send their own estimate. You compare them and choose one to visit — nothing is booked or charged until you approve a quote.
              </div>
            </div>

            <div className="p-4 border-t border-line flex gap-3 sticky bottom-0 bg-surface">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Edit
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={() => { if (activeBooking) { setShowConfirm(false); return } setShowConfirm(false); submit() }}
                disabled={submitting}
              >
                {submitting ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}    </div>

  )

}


