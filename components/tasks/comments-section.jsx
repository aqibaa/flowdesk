"use client";

import { useState, useTransition } from "react";
import { Loader2Icon, SendIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { addComment } from "@/lib/actions/tasks";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Comment thread + composer. `submitAction` lets the employee portal pass
 * its own Server Action (defaults to the admin one).
 */
export function CommentsSection({ taskId, comments, submitAction = addComment }) {
  const [pending, start] = useTransition();
  const [body, setBody] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    start(async () => {
      const res = await submitAction({ task_id: taskId, body: text });
      if (res.ok) setBody("");
      else toast.error(res.errors ? Object.values(res.errors)[0] : res.message);
    });
  };

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">
        Comments <span className="font-normal text-muted-foreground">({comments.length})</span>
      </h3>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar name={c.author?.full_name ?? "?"} size="md" className="mt-0.5" />
              <div className="min-w-0 flex-1 rounded-xl bg-muted/40 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium">{c.author?.full_name ?? "Unknown"}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="mt-3 space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
          }}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!body.trim() || pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />} Post
          </Button>
        </div>
      </form>
    </section>
  );
}
