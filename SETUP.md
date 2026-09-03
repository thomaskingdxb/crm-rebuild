# Setting up your own copy of this CRM

This app is a Next.js + Supabase CRM. Each person who runs it gets their **own
Supabase project** (own database, own login, own data) and their **own
deployment**. Nothing here is shared with the original author — forking this
repo does not give anyone access to anyone else's data.

## 1. Get the code

Fork this repository on GitHub (or clone it if you were given a zip/tarball).
Then, locally:

```bash
git clone <your-fork-url>
cd crm-app
npm install
```

## 2. Create your own Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free account if you don't have one.
2. Create a new project. Pick any name/region — this is entirely separate from anyone else's project.
3. Once it's provisioned, go to **Settings -> API** and note down:
   - **Project URL**
   - **anon public key**

## 3. Set up the database schema

The database structure (tables, relationships, dropdown options like deal
stages/property types/areas) lives in `supabase/migrations/` as numbered SQL
files, in the order they should run.

**Option A — Supabase CLI (recommended):**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>   # found in your project URL
npx supabase db push
```

This runs every migration file in `supabase/migrations/` against your new
project, in order.

**Option B — manual (no CLI):**

In the Supabase dashboard, open **SQL Editor**, and paste + run each file in
`supabase/migrations/` **in filename order** (they're numbered/timestamped so
sorting alphabetically gives you the right order). Run them one at a time
and confirm each succeeds before moving to the next.

Either way, when this is done you'll have all the tables, relationships, and
dropdown option data (deal stages, property types, areas, developers, etc.)
— but **zero clients, deals, properties, or other real records**. It's a
clean, empty CRM with the same structure.

> The `developers` list seeded here reflects the Dubai real-estate market.
> Edit or clear that table in the Supabase dashboard if you operate elsewhere
> — it's just reference data, safe to change any time.

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the **Project URL** and **anon public key** from
step 2.

## 5. Create your first login

This app has no public sign-up page — accounts are created by invite. To
create your own first account:

1. In the Supabase dashboard, go to **Authentication -> Users -> Add user -> Invite user**.
2. Enter your email. Supabase sends an invite email with a link.
3. Follow the link — it lands on this app's `/auth/callback` page, where you set your password.
4. You're in.

To add teammates later, repeat step 1 with their email.

## 6. Run it

```bash
npm run dev
```

Visit `http://localhost:3000` — you should see the login page, and after
signing in, an empty CRM ready for your own data.

## 7. Deploy (optional)

The easiest path is [Vercel](https://vercel.com): import the repo, add the
same two environment variables from step 4 in the Vercel project settings,
and deploy. Any other Next.js-compatible host works the same way.

## Getting updates from the original repo

If you forked this on GitHub, you can pull in future improvements:

```bash
git remote add upstream <original-repo-url>
git fetch upstream
git merge upstream/main
```

If a new migration file appears in `supabase/migrations/` after a merge, run
it against **your own** Supabase project the same way you did in step 3
(`npx supabase db push`, or paste the new file into the SQL editor) — new
migrations only ever add or change structure, never touch your existing
rows.
