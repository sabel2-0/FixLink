import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoleLayout, NavItem } from "@/components/RoleLayout"

const NAV_ADMIN: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/registrations", label: "Registrations", icon: "inbox" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/reviews", label: "Ratings", icon: "star" },
  { href: "/admin/commissions", label: "Commissions", icon: "percent" },
  { href: "/admin/disputes", label: "Disputes", icon: "alert" },
]

const NAV_CUSTOMER: NavItem[] = [
  { href: "/app", label: "Home", icon: "grid" },
  { href: "/app/book", label: "Book a service", icon: "plus" },
  { href: "/app/bookings", label: "My bookings", icon: "calendar" },
  { href: "/app/messages", label: "Messages", icon: "chat" },
  { href: "/app/reviews", label: "Ratings", icon: "star" },
  { href: "/app/profile", label: "Profile", icon: "user" },
]

const NAV_TECH: NavItem[] = [
  { href: "/tech", label: "Dashboard", icon: "grid" },
  { href: "/tech/schedule", label: "Jobs", icon: "calendar" },
  { href: "/tech/estimates", label: "Estimates", icon: "tag" },
  { href: "/tech/messages", label: "Messages", icon: "chat" },
  { href: "/tech/reviews", label: "Reviews", icon: "star" },
  { href: "/tech/earnings", label: "Earnings", icon: "dollar" },
  { href: "/tech/commissions", label: "Commissions", icon: "percent" },
  { href: "/tech/profile", label: "Profile", icon: "user" },
]

export default async function NotificationsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single()

  const role = (profile?.role || "customer") as "admin" | "technician" | "customer"
  const nav = role === "admin" ? NAV_ADMIN : role === "technician" ? NAV_TECH : NAV_CUSTOMER
  const label = role === "admin" ? "Admin" : role === "technician" ? "Technician" : "Customer"
  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <RoleLayout roleLabel={label} nav={nav} initials={initials}>
      {children}
    </RoleLayout>
  )
}