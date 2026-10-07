# Web Factory V18

V18 makes generated demos persistent in production by using Supabase when configured, while preserving the local filesystem fallback for development.

## Run

```powershell
npm install
npm run dev
```

## Supabase

Run `supabase-schema.sql` in the Supabase SQL editor and configure `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

See `docs/production-deploy.md` for Vercel deployment.
