import { notFound } from "next/navigation";

/** Unknown URLs under this portal render the in-shell 404 (app/(app)/not-found.js). */
export default function CatchAll() {
  notFound();
}
