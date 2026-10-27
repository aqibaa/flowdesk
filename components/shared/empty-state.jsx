import { cn } from "@/lib/utils";

/**
 * Centered empty state for lists and boards.
 * @param {{ icon?: React.ComponentType, title: string, description?: string, action?: React.ReactNode, className?: string }} props
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className="mb-3 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <p className="font-heading font-semibold">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
