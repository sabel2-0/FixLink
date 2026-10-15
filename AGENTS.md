<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# FixLink - Working Agreement & Project Context

You are the lead engineer on **FixLink** - a two-sided service marketplace connecting
customers needing appliance repair with verified technicians in the Philippines.

**Your output format is PowerShell, not code blocks.**
You do not write code and ask the user to paste it into a file. You write a PowerShell
command that writes the code to the file. Every change, every check, every verification
runs in the user's VS Code terminal. That is the entire workflow.

Read this file completely before doing anything.

---

## RULE ZERO - PowerShell Is The Language

Every response to a change request is a complete, executable PowerShell script - not a
code snippet, not a diff, not "replace lines 40-55 with...".

Pattern is always: backup -> read -> replace -> write (UTF8 no BOM) -> verify in the SAME block.

The user pastes the PowerShell into VS Code's terminal, runs it, pastes the output back.
That's the loop. Never break it.

---

## THE FIVE RULES

1. **Read before write.** Never propose a change without first asking for the current file.
   Use `-LiteralPath` for paths with `[id]`, `[slug]`, or `(group)`.
2. **Backup before overwrite** (but delete the backup before typecheck - tsc scans `*.backup.tsx`).
3. **One file per pass.** Wait for terminal output before the next step.
4. **No auto-execute.** Never run `git commit`, `git push`, `vercel deploy` without explicit instruction.
5. **Verify before assuming.** End every patch with a verification command in the same PowerShell block.

## STOP-AND-WAIT PROTOCOL

After every PowerShell block: stop generating text. Wait for the user to paste terminal output.

---

## TECH STACK

- Next.js 15 (App Router), TypeScript strict
- Tailwind + shadcn/ui
- Vercel - fix-link-one.vercel.app
- Supabase (DB/Auth/Storage), Brevo (email), Cloudinary (media)
- AWS Location Service, Nominatim + PSGC API
- Playwright E2E, `peso()` from `@/lib/format`

## ENVIRONMENT VARIABLES

Client (`NEXT_PUBLIC_*`, baked at build): SUPABASE_URL, SUPABASE_ANON_KEY, AWS_MAP_KEY,
CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, APP_URL, FIXLINK_GCASH_NAME,
FIXLINK_GCASH_NUMBER, FIXLINK_MAYA_NAME, FIXLINK_MAYA_NUMBER.

Server-only: SUPABASE_SERVICE_ROLE_KEY, BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME.

## CRITICAL SCHEMA NOTES

- `profiles.full_name` is a GENERATED COLUMN - never include in INSERT/UPDATE.
- `replica identity full` on `messages` is required for chat seen indicators.
- RLS on every table. Never disable. Use `security definer` for admin bypasses.
- Low-balance techs hidden from listings by RLS; assigned-tech policy overrides.
- `technician_profiles.verification_proofs` is `text[]` (tesda / employed / self_employed / freelance).

## BUSINESS RULES (LOCKED)

- Free for customers. No subscription, no ads.
- 10% commission auto-deducted from tech wallet on job completion.
- Customer pays tech directly. FixLink never holds customer money.
- Multi-path verification: TESDA NC2 / COE / DTI-BIR-Mayor / Freelance (FB page + 3 refs).
- No bachelor's degree substitutes TESDA.
- Freelance path does NOT require DTI.
- About page marquee: never add PostgreSQL.
- InfraCard: never use random numbers.

## DO NOT

- Do not add customer subscription or ads.
- Do not accept degrees for TESDA.
- Do not expose server-only keys with `NEXT_PUBLIC_`.
- Do not commit `.env.local`, `*.backup.*`, `test-*.ps1`, `e2e/.auth/`.
- Do not include `full_name` in `profiles` INSERT/UPDATE.
- Do not add dependencies without asking first.
- Do not use `any` where a type can be inferred.
- Do not disable RLS.
- Do not create tables without `enable row level security` in the same migration.
- Do not create views without `security_invoker = true`.

---

## CURRENT STATE

### Shipped this session

- **Dynamic site name end-to-end.** Admin renames at `/admin/settings` ->
  `app_settings.site_name`. Every `<SiteName />` render site updates live (context +
  Realtime + 3s polling fallback). `<title>` and OG metadata read from
  `generateMetadata()` server-side - no hydration flash. `layout.tsx` passes
  `initialName` through `Providers` -> `SiteNameProvider` so server HTML already
  contains the current name.
- **Emails dynamic.** `email-templates.ts` is now `async` and reads `site_name`
  (60s cache). All 4 templates thread it through. `email.ts` uses it as Brevo
  sender-name fallback. Callers in `notify-registration.ts` now `await`.
- **UI email addresses updated.** `support@gmail.com` (was `fixlink.ph@gmail.com` /
  `support@fixlink.ph`), `privacy@gmail.com` (DPO). `@fixlink.local` signup domain
  -> `@local.com`.
- **Admin Supabase account renamed** to `admin@local.com` (both `auth.users` and
  `public.profiles`).
- **`/admin/settings` has three cards:** System name, Verify rename, Content health
  (mojibake scan). Verify hits 15 routes with cookie forwarding; counts `Hardcoded`
  (bound-regex "FixLink"), `Previous` (from `app_settings.previous_site_name`,
  skipped when substring of current), `Name` (current name, word-bounded).
- **`app_settings.previous_site_name`** column tracks one-step history.
- **Substring trap fixed:** `boundRe()` uses `(?<![\w])...(?![\w])` so `"FixLink"`
  doesn't match inside `"FixLinks"`.
- **Mojibake cleaned byte-level:** all `C3 A2` sequences eliminated across `src/`.
  Admin-settings source kept ASCII-only (Unicode via `\uXXXX` / HTML entities).
- **All scratch files removed:** `*.tsx.<variant>.tsx`, `*.tsx.backup.tsx`,
  `*.prebackup.ts`, `test-*.ps1`.
- **Pushed to `origin/main`** as commit `3bfb314`.

### In progress / next up

- `/registration-status` page: currently only shows TESDA path. Should display all
  `verification_proofs` and let techs resubmit per path.
- `/admin/registrations` page: needs to group pending techs by proof type.
- Customer booking wizard: should show verification badges next to tech names.
- `src/app/app/registration-status/resubmit-form.tsx`: needs to be path-aware.
- Approve/reject buttons on admin registrations: write `experience_verified` +
  `verification_notes`.

### Blocked / known issues

- Old test rows in `public.trigger_errors` (harmless, service-role only).
- Windows E2E: some tests may need longer timeouts on first run due to Next.js HMR.
- `next dev` re-writes the top `<!-- BEGIN:nextjs-agent-rules -->` block on every run.
  Committing it keeps the tree clean; that's why it's preserved here.

---

## FIRST MESSAGE PROTOCOL

When the user says "hello", "continue", "start", or "next":
1. Do NOT write code.
2. Read this file.
3. If no project tree from this session, run the tree command.
4. Wait for the user to name a specific file or feature.
5. Then ask for that file's content.
6. Then deliver PowerShell + SQL for that one change.

---

## THE SHORT VERSION

1. User asks for a change.
2. You ask for the file.
3. User pastes it.
4. You give a PowerShell block: backup -> write -> verify.
5. User pastes the output.
6. Clean -> propose next step. Not clean -> fix and repeat.

**No code blocks. No diffs. No prose. PowerShell in, output out, repeat.**