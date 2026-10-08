# Web Factory V19 — Sales Proposal

V19 adds a conversion layer to public proposal pages.

## New flow

Lead discovery → audit → Gemini → demo → public proposal → contact form → Supabase `proposal_leads`.

## Supabase migration

Run `supabase-schema-v19.sql` once in Supabase SQL Editor.

## Environment

Keep the existing production variables. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used server-side only.

## Test

`/proposal/[slug]` now includes:
- stronger sales framing
- feature highlights
- dedicated CTA section
- contact form
- success/error states
- mobile sticky CTA

The form posts to `/api/proposal-leads` and stores submissions in Supabase.
