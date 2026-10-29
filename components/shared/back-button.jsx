"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "Go back" for status pages — history back, falling back to home. */
export function BackButton({ fallback = "/dashboard" }) {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push(fallback));
  return (
    <Button variant="outline" onClick={back}>
      <ArrowLeftIcon /> Go back
    </Button>
  );
}
