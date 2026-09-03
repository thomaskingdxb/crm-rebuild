# Onboarding prompt — paste this to Claude

Give this file to the person you're handing the CRM to. Before they paste
anything into Claude, they need to do two manual things themselves (Claude
cannot create accounts on anyone's behalf):

1. **Create a free GitHub account** (if they don't have one) at github.com,
   then click **Fork** on this repository, then clone their fork locally:
   ```bash
   git clone <their-fork-url>
   cd crm-app
   ```
2. **Create a free Supabase account** at supabase.com (no project needed yet —
   Claude will create the project itself via the Supabase connector once
   connected).

Then, in Claude Code (or claude.ai/code) opened inside that cloned folder,
they connect the **Supabase MCP connector** to their own Supabase account
(via `claude mcp` or the app's connector settings — NOT the original
author's connection). Once connected, they paste everything below this line
as their first message to Claude.

---

## Prompt to paste into Claude

I've just forked and cloned a CRM app template. I want you to set up my own
independent copy of it, end to end. Here's what I need you to do:

1. Read `SETUP.md` in this repo — it's the source of truth for every step.
2. Confirm the Supabase MCP connector is connected to *my* Supabase account
   (not anyone else's) before creating anything.
3. Create a new Supabase project for me (ask which organization/region if
   there's a choice, and confirm any cost before creating — it should be
   free tier).
4. Apply every migration file in `supabase/migrations/`, in filename order,
   to that new project. Confirm each one succeeds.
5. Get the project's URL and anon public key, and set up my `.env.local`
   from `.env.example` with those values.
6. Tell me exactly how to create my first login (this part needs me to
   click an email link, so walk me through inviting myself via the
   Supabase dashboard rather than trying to do it yourself).
7. Run the app locally (`npm install`, `npm run dev`) and confirm it loads
   the login page without errors.
8. Summarize what you did, what's left for me to do manually (inviting
   myself, deploying if I want to), and confirm my database has the
   reference/dropdown data (deal stages, property types, etc.) but no
   client, deal, or property records from anyone else.

Ask me before anything that costs money, before deploying anywhere public,
or before any step you're unsure about. Otherwise, go ahead and drive this
yourself using the Supabase MCP tools you have access to.
