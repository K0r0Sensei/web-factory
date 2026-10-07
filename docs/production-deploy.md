# Production: public demos + persistent storage

V18 uses Supabase for demo persistence when these server-only variables exist:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Without them, local development falls back to `.data/demos`.

## 1. Create Supabase project

Create a project at https://supabase.com/dashboard.
Open SQL Editor and run `supabase-schema.sql`.

Then copy the project URL and the **service role key** into your deployment environment. Never prefix this key with `NEXT_PUBLIC_` and never commit it to Git.

Supabase recommends keeping server secrets in environment variables; service-role credentials must remain server-side.

## 2. Local test

Add to `.env.local`:

```env
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Restart Next.js and generate a demo. Reloading `/demo/<slug>` should still work after restarting the dev server.

## 3. Deploy to Vercel

Push the repository to GitHub, then import it into Vercel. Vercel auto-detects Next.js. Add the same environment variables under Project Settings → Environment Variables and redeploy.

Also set:

```env
NEXT_PUBLIC_SITE_URL=https://YOUR-APP.vercel.app
```

Never put Gemini, DataForSEO or Supabase service-role secrets in `NEXT_PUBLIC_*` variables.

## 4. Custom domain

Once the Vercel deployment works, connect a domain such as `app.yourdomain.com` in Vercel. Then update `NEXT_PUBLIC_SITE_URL` and redeploy.

The public proposal URL will look like:

`https://app.yourdomain.com/proposal/fontaneria-garcia-madrid`

The clean website URL is:

`https://app.yourdomain.com/demo/fontaneria-garcia-madrid`
