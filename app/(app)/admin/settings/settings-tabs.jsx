"use client";

import { useEffect, useRef, useState } from "react";
import { BellIcon, ShieldCheckIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = { user: UserIcon, shield: ShieldCheckIcon, bell: BellIcon };

/**
 * Tab strip that scrolls to the matching section (all sections stay
 * rendered, as in the mockup). The highlight follows the section whose top
 * has passed the upper third of the viewport; at the very bottom of the page
 * the last tab wins (a short last section may never reach that line).
 * A click pins the highlight until the smooth scroll has settled.
 */
export function SettingsTabs({ tabs }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const pinnedUntil = useRef(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      if (Date.now() < pinnedUntil.current) return;
      const line = window.innerHeight * 0.35;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
      if (atBottom) return setActive(tabs[tabs.length - 1].id);
      let current = tabs[0]?.id;
      for (const t of tabs) {
        const el = document.getElementById(t.id);
        if (el && el.getBoundingClientRect().top <= line) current = t.id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Deep link (#notifications) on first paint.
    const hash = window.location.hash.slice(1);
    if (hash && tabs.some((t) => t.id === hash)) setActive(hash);
    else update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tabs]);

  const select = (id) => {
    pinnedUntil.current = Date.now() + 900;
    setActive(id);
  };

  return (
    <nav className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl border bg-card p-1 shadow-soft" aria-label="Settings sections">
      {tabs.map((t) => {
        const Icon = ICONS[t.icon];
        return (
          <a
            key={t.id}
            href={`#${t.id}`}
            onClick={() => select(t.id)}
            aria-current={active === t.id ? "true" : undefined}
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
