"use client";

import { useEffect, useState } from "react";
import { BellIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { user: UserIcon, shield: ShieldCheckIcon, bell: BellIcon };

/**
 * Tab strip that scrolls to the matching section (all sections stay
 * rendered, as in the mockup). Highlights the section nearest the top.
 */
export function SettingsTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    for (const t of tabs) {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [tabs]);

  return (
    <nav className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl border bg-card p-1 shadow-soft" aria-label="Settings sections">
      {tabs.map((t) => {
        const Icon = ICONS[t.icon];
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            onClick={() => setActive(t.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
              active === t.id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="size-4" />}
            {t.label}
            {t.badge !== undefined && (
              <span className="rounded-full bg-accent px-1.5 text-[11px] text-accent-foreground">{t.badge}</span>
            )}
          </a>
        );
      })}
    </nav>
  );
}
