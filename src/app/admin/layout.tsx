import { RoleLayout, NavItem } from "@/components/RoleLayout"

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/technicians", label: "Technicians", icon: "shield" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/commissions", label: "Commissions", icon: "percent" },
  { href: "/admin/disputes", label: "Disputes", icon: "alert" },
  { href: "/admin/audit", label: "Audit log", icon: "doc" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout roleLabel="Admin" nav={NAV} initials="AU">
      {children}
    </RoleLayout>
  )
}
