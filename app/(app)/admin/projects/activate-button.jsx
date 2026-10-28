"use client";

import { useTransition } from "react";
import { Loader2Icon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { activateProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";

/** Pending → active. Copies the service template; the RPC is idempotent. */
export function ActivateButton({ projectId, size = "sm", className }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size={size}
      className={className}
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        start(async () => {
          const res = await activateProject(projectId);
          res.ok ? toast.success(res.message) : toast.error(res.message);
        });
      }}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <ZapIcon />}
      Activate
    </Button>
  );
}
