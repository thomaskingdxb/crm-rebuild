# Monthly Newsletter — Template & Structure

This is the standing structure for every edition. Section order and purpose stay
fixed; only the content changes month to month. Built from the reference
newsletter ("The Real Estate Report") the user liked, adapted for a solo
Dubai agent's client list rather than a mass-market subscriber base.

## 1. Header
- **Period label** (e.g. "August 2026")
- **Headline** — one hook line summarizing the month's single biggest story,
  same spirit as "Dubai ultra-prime home sales hit $6 billion despite regional
  tensions" in the reference.

## 2. Curated News Roundup
- 6–8 short items, each: headline, 2–3 sentence summary (paraphrased, not
  reproduced), source name + link ("Read the full article on [Source]").
- Sourced via web search each edition from: Gulf News, Arabian Business,
  Khaleej Times, Bayut, Property Finder, DXB Interact, Construction Week,
  Zawya, and similar.
- Mix of: transaction/volume trends, commercial/office market, regulatory or
  legal news, rental market, supply/handover data.
- **No sponsor/ad content** — the reference newsletter's "In partnership
  with" blocks are beehiiv monetization and are never replicated here.

## 3. Developer Launch of the Month
- One featured item, called out distinctly from the general news roundup
  (not just item #6 in a numbered list) — a significant new project launch
  from the month, chosen for genuine newsworthiness.
- **Open item**: user wants this eventually filtered by their own developer
  preferences (favored vs. avoided) — not yet captured, so for now this is
  picked on newsworthiness alone. Revisit once that preference list exists.

## 4. Luxury Market
- Tracks the super-high-end segment specifically (separate from the general
  news roundup) — ultra-prime sales volume/value for the month, **compared
  month-by-month**, not just a one-off snapshot.
- **Threshold: $10M+ / AED 36.7M+** (confirmed 2026-08-14, matches the
  reference newsletter's own definition).
- Tracked metrics per edition: total ultra-prime sales value (AED and/or
  USD) and deal count for the month, plus % change vs. the prior edition.
- Sourced the same way as the Local Market Snapshot — DXB Interact (live,
  logged in) filtered to AED 36.7M+, cross-checked against published press
  figures (Khaleej Times/Arabian Business/Property Finder ultra-prime
  coverage) where DXB Interact data is thin.
- Needs a structured `luxury_sales_value_aed` + `luxury_deal_count` pair
  stored per edition (not just narrative text) so next month can compute a
  real period-over-period change instead of guessing.

## 5. Local Market Snapshot — Recent Notable Transactions
- Real, dated comparable sales pulled live from DXB Interact (requires the
  user logged into their own account in-session — aggregate stat cards are
  gated behind sign-in and don't load without it, but individual transaction
  records are public even without login).
- **Focused on the user's actual working areas** (Arjan, JVC, Motor City,
  Golf Links, Avelon Boulevard, etc. — not generic citywide averages), since
  this is what's actually useful to his client base.
- Format: building/project, price, sqft, price/sqft, beds, sold date.
- This replaces the reference newsletter's DLD-style aggregate category table
  (off-plan vs. ready, AED value by Flats/Villas/etc.) — that data requires a
  paid feed the user doesn't have. Individual comparable sales are the
  realistic substitute and arguably more useful to an agent's own audience.
- If DXB Interact access fails or yields too few/unrepresentative records for
  a given month, this section can be omitted entirely rather than shipped
  thin — confirmed acceptable to skip a month rather than force it.

## 6. Market Insights & Outlook
- One narrative section (3–5 paragraphs) synthesizing everything above into
  the user's own read on the month — what's actually moving, what to watch,
  any client-facing talking points (e.g. regulatory changes as reassurance
  for hesitant buyers).
- This is the section that should sound most like Thomas's own voice/analysis,
  not just a recap of the news items.

## 7. Footer
- Data source disclosure (e.g. "DXB Interact, Dubai Land Department").
- Standard disclaimer: not individual financial advice.
- Signature / contact.

---

## Standing rules
- **Cadence**: monthly.
- **Distribution**: user sends it themselves — no email automation built.
- **Cost**: text content (research, writing) is free — same Claude Code
  session, no metered API. Only exception would be if visual/image generation
  is added later (Canva/Higgsfield) — that has real per-use cost and is
  opt-in, never automatic.
- **No copyright reproduction**: summaries are paraphrased and substantially
  shorter than source articles; at most one short quote (<15 words) per item
  if used at all.
