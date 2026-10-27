import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { homePathForRole } from "@/lib/auth/guards";
import { BrandMark } from "@/components/shared/brand-mark";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

const ERROR_MESSAGES = {
  inactive: "Your account has been deactivated. Contact your admin.",
  expired: "That link has expired. Ask your admin to send a new invite.",
  invalid: "That link is invalid or was already used.",
};

export default async function LoginPage({ searchParams }) {
  const { next, error } = await searchParams;

  // Already signed in (e.g. back button) → straight to the right portal.
  const { profile } = await getCurrentProfile();
  if (profile?.is_active) redirect(homePathForRole(profile.role));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_10%,rgba(255,255,255,0.18),transparent),radial-gradient(50%_50%_at_10%_90%,rgba(0,0,0,0.18),transparent)]"
        />
        <BrandMark inverted />
        <div className="relative max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Delivery, tracked from kickoff to done.
          </h1>
          <p className="text-primary-foreground/80">
            Clients, service templates, projects and a Jira-style board — with
            progress that updates itself as your team completes work.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Internal tool · access by invitation only
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in with the email your admin invited.
            </p>
          </div>
          <LoginForm next={next} initialError={ERROR_MESSAGES[error]} />
        </div>
      </section>
    </main>
  );
}
