import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Sign in" };

/** Placeholder — the real email/password form arrives in Phase 2. */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">FlowDesk</CardTitle>
          <CardDescription>Sign-in form will be added in Phase 2.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Setup phase complete.
        </CardContent>
      </Card>
    </main>
  );
}
