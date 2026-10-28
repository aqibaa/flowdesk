import { cn } from "@/lib/utils";

/** Card wrapper for a settings block: icon, title, description, content. */
export function SettingsSection({ id, icon: Icon, title, description, aside, children, className }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-2xl border bg-card p-5 shadow-soft sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-[18px]" />
            </span>
          )}
          <div>
            <h2 className="font-heading text-lg font-semibold leading-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
