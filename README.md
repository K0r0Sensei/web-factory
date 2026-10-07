# Web Factory V17 — Public demos + sales proposal

V17 keeps the V15 discovery/audit/Gemini flow and adds a local persistent demo store.

## New flow

```text
DataForSEO / CSV
  ↓
Audit
  ↓
Gemini
  ↓
Generated business + design
  ↓
POST /api/demos
  ↓
.data/demos/<slug>.json
  ↓
/demo/<slug>          raw website
/proposal/<slug>      sales-ready proposal
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000/discover` or `http://localhost:3000/leads`.

After generating a demo, use **Abrir propuesta** or **Copiar enlace**.

## Public URL

Locally the link is based on the current origin, for example:

`http://localhost:3000/proposal/fontaneria-garcia-madrid`

For a real client, deploy the app and the exact same path becomes a public HTTPS URL. The local `.data/demos` JSON store is intentionally for local validation only; before production deployment we should move demo storage to Supabase/Postgres or another durable database.

## Proposal CTA

Set this optional variable to make **Quiero esta web** open your sales inbox:

```env
WEB_FACTORY_CONTACT_EMAIL=ventas@tudominio.com
```

Without it, the CTA points to the contact section of the proposal page.
