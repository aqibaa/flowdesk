# FlowDesk — deploy checklist (Vercel + Supabase)

Work through this top to bottom. Items marked **DEV-done** were already done
on the `flowdesk-dev` project and must be repeated on a production project.

## 1. Supabase production project

- [ ] Create a new project (e.g. `flowdesk-prod`), region close to the team.
- [ ] **Apply migrations in order** — SQL Editor, one file at a time, from
      `supabase/migrations/` (sorted by filename). Each file is idempotent-safe
      to run once; do not run `seed.sql` on production.
- [ ] **First admin**: Authentication → Users → Add user (auto-confirm), then
      `update public.profiles set role = 'admin' where email = '<you>';`
- [ ] Authentication → Sign In / Providers → Email: **disable "Allow new users
      to sign up"** (invite-only).
- [ ] Authentication → URL Configuration: Site URL = production domain;
      Redirect URLs include `https://<domain>/auth/confirm`.
- [ ] Authentication → Emails → **Invite user** template: link must be
      `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`.
      Same pattern with `type=recovery` for the **Reset password** template.
- [ ] Authentication → Emails → **SMTP Settings**: enable custom SMTP
      (Resend / Brevo / Google Workspace). The built-in sender is limited to
      ~2 emails/hour and is not for production.
- [ ] Authentication → Attack protection: enable **Leaked password protection**
      (the only remaining security-advisor warning).
- [ ] Project Settings → API Keys: copy the **publishable** key and create a
      **secret** key for the app (never the legacy `service_role` JWT in
      client code; the secret key is used server-side only).
- [ ] Run Database → Advisors → Security. Expected intentional findings:
      `employee_tasks_view` and `my_task_comments_view` are SECURITY DEFINER
      (self-filtered to `auth.uid()`); `is_admin`, `activate_project`,
      `update_my_task_status` are executable by `authenticated` (each checks
      its caller). Anything else should be investigated.

## 2. Vercel

- [ ] Import the GitHub repo. Framework: Next.js (auto). Node 20+.
- [ ] Environment variables (Production + Preview):
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
      - `SUPABASE_SECRET_KEY` (server-only; Vercel never exposes non-`NEXT_PUBLIC_` vars to the browser)
      - `NEXT_PUBLIC_SITE_URL` = `https://<domain>` (used in invite + notification links)
      - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — optional;
        enables email notifications via nodemailer (Resend/Brevo/Workspace SMTP).
        Without them only in-app (bell) notifications are sent.
- [ ] Deploy. Confirm `/login` loads and the response has the security headers
      (`Content-Security-Policy`, `X-Frame-Options: DENY`, HSTS; no `X-Powered-By`).
- [ ] Add the Vercel preview domain pattern to Supabase Redirect URLs if you
      want invites to work from previews (optional).

## 3. Smoke test on production

- [ ] Admin login → `/admin` dashboard renders.
- [ ] Create a client, a service with 2 template tasks, a project; **Activate**
      → 2 tasks appear; activating again is refused.
- [ ] Invite an employee (real email) → link → set password → lands on
      `/employee` in blue.
- [ ] Assign a task to that employee; as the employee, complete it → project
      progress changes in `/admin/projects` with no app code involved.
- [ ] As the employee, open `/admin` → redirected to `/employee`.
- [ ] Deactivate the employee → their next request is bounced to `/login`.

## 4. Operational notes

- **No polling anywhere.** Global Monitor refreshes on demand.
- **Secrets**: `.env*` is git-ignored; a build-time canary check confirmed
  `SUPABASE_SECRET_KEY` never lands in `.next/static`. Rotate the secret key
  from Supabase if it ever leaks; the app reads it only in `lib/supabase/admin.js`.
- **Backups**: Supabase Pro has PITR; on Free, schedule `pg_dump` or rely on
  daily backups.
- **Adding a migration**: write `supabase/migrations/<timestamp>_<name>.sql`,
  apply to DEV, verify with advisors, then apply to prod during a quiet window.
