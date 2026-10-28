import { formatDistanceToNow } from "date-fns";
import { describeActivity } from "@/lib/activity";

/** Compact activity timeline for one task (rows come from activity_log). */
export function TaskActivity({ activity, names = {} }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold">Activity</h3>
      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity recorded.</p>
      ) : (
        <ol className="relative space-y-3 border-l pl-4">
          {activity.map((row) => (
            <li key={row.id} className="text-sm">
              <span className="absolute -left-[5px] mt-1.5 size-2 rounded-full bg-primary/60" />
              <p className="leading-snug">{describeActivity(row, names)}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
