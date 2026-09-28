import { Icon, IconName } from "@/lib/icons"

export function EmptyState({ icon = "inbox", title, description }: { icon?: IconName; title: string; description?: string }) {
  return (
    <div className="empty-state">
      <div className="icon-wrap">
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-ink mb-1">{title}</p>
      {description && <p className="text-sm">{description}</p>}
    </div>
  )
}
