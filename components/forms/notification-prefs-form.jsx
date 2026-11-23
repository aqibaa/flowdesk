"use client";

import { useState, useTransition } from "react";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { NOTIFICATION_EVENTS, withPrefDefaults } from "@/lib/validations/settings";
import { updateMyNotificationPrefs } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

/**
 * One in-app toggle per event, saved to profiles.notification_prefs
 * ({event: {in_app}}; notify_user() skips events switched off).
 */
export function NotificationPrefsForm({ stored }) {
  const [prefs, setPrefs] = useState(() => withPrefDefaults(stored));
  const [saved, setSaved] = useState(() => withPrefDefaults(stored));
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(prefs) !== JSON.stringify(saved);

  const toggle = (key, channel, value) =>
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [channel]: value } }));

  const save = () =>
    start(async () => {
      const res = await updateMyNotificationPrefs(prefs);
      if (res.ok) {
        toast.success(res.message);
        setSaved(prefs);
      } else toast.error(res.message);
    });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border">
        <div className="grid grid-cols-[1fr_80px] items-center bg-muted/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Event type</span>
          <span className="text-center">Notify</span>
        </div>
        {NOTIFICATION_EVENTS.map((e) => (
          <div key={e.key} className="grid grid-cols-[1fr_80px] items-center border-t px-4 py-3">
            <div>
              <p className="text-sm font-medium">{e.label}</p>
              <p className="text-xs text-muted-foreground">{e.description}</p>
            </div>
            <div className="flex justify-center">
              <Switch checked={prefs[e.key].in_app} onCheckedChange={(v) => toggle(e.key, "in_app", v)} aria-label={`${e.label} in app`} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Alerts show in the bell and as a live toast while you are signed in.</p>
        <Button onClick={save} disabled={!dirty || pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : <CheckIcon />} Save preferences
        </Button>
      </div>
    </div>
  );
}
