import { RoleLayout, NavItem } from "@/components/RoleLayout"

const NAV: NavItem[] = [
  { href: "/app", label: "Home", icon: "grid" },
  { href: "/app/book", label: "Book a service", icon: "plus" },
  { href: "/app/bookings", label: "My bookings", icon: "calendar" },
  { href: "/app/messages", label: "Messages", icon: "chat" },
  { href: "/app/reviews", label: "Ratings", icon: "star" },
  { href: "/app/profile", label: "Profile", icon: "user" },
]

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout roleLabel="Customer" nav={NAV} initials="MS">
      {children}
    </RoleLayout>
  )
}
