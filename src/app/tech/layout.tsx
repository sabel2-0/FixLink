import { RoleLayout, NavItem } from "@/components/RoleLayout"

const NAV: NavItem[] = [
  { href: "/tech", label: "Dashboard", icon: "grid" },
  { href: "/tech/schedule", label: "Jobs", icon: "calendar" },
  { href: "/tech/estimates", label: "Estimates", icon: "tag" },
  { href: "/tech/messages", label: "Messages", icon: "chat" },
  { href: "/tech/earnings", label: "Earnings", icon: "dollar" },
  { href: "/tech/commissions", label: "Commissions", icon: "percent" },
  { href: "/tech/profile", label: "Profile", icon: "user" },
]

export default function TechLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout roleLabel="Technician" nav={NAV} initials="JA">
      {children}
    </RoleLayout>
  )
}
