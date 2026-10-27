import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { BrandMark } from "@/components/shared/brand-mark";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Set your password" };

/** Reached from an invite or password-reset link once the token is verified. */
export default async function SetPasswordPage() {
  const { profile } = await getCurrentProfile();
  if (!profile) redirect("/login?error=expired");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8">
        <BrandMark />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            Choose a password for <span className="font-medium text-foreground">{profile.email}</span>.
          </p>
        </div>
        <SetPasswordForm />
      </div>
    </main>
  );
}
