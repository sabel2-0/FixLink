import { RoleLayout, NavItem } from "@/components/RoleLayout"

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/registrations", label: "Registrations", icon: "inbox" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/reviews", label: "Ratings", icon: "star" },
  { href: "/admin/commissions", label: "Commissions", icon: "percent" },
  { href: "/admin/disputes", label: "Disputes", icon: "alert" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout roleLabel="Admin" nav={NAV} initials="AU">
      {children}
    </RoleLayout>
  )
}