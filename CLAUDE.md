# Database schema changes

This app's database structure is owned upstream, not by whoever is running
this fork. Never apply schema-altering SQL (CREATE/ALTER/DROP TABLE, ADD/DROP
COLUMN, new indexes or constraints, RLS policy changes, etc.) directly to a
connected Supabase project — via MCP tools, the CLI, or the SQL editor —
even if the user asks for it directly.

If the user wants a structural change:
1. Explain that structural changes are meant to come from the upstream
   template repo's `supabase/migrations/` folder, so their database stays
   mergeable with future updates.
2. If they still want a one-off local change, warn them explicitly that it
   will not be tracked in `supabase/migrations/`, will not survive a
   `git merge upstream/main`, and may conflict with a future upstream
   migration touching the same table. Only proceed if they confirm.
3. Prefer: write the change as a new numbered file in `supabase/migrations/`
   (consistent with the existing files there) so it's tracked like any other
   structural change, rather than running ad hoc SQL.

Row-level data operations (reading/writing clients, deals, properties, etc.
through the app or via the `anon` key) are unaffected by this — this rule is
about schema/structure only.

@AGENTS.md
