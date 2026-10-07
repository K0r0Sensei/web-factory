# Web Factory V12 — Gemini model fallback

V12 keeps the strict AI batch behavior but adds automatic model fallback for temporary Gemini availability/capacity errors.

Default order:

1. `gemini-3.8-flash`
2. `gemini-3.7-flash`
3. `gemini-3.6-flash`
4. `gemini-3.5-flash`
5. `gemini-3.5-flash-lite`

Override the order with `GEMINI_MODELS`. `GEMINI_MODEL` is tried first.

A fallback model is only attempted for transient availability errors such as HTTP 429/5xx or messages containing high demand, overload, temporary unavailability, or rate limit. Permanent errors are surfaced immediately.

## Run

```powershell
npm install
npm run dev
```

Set `GEMINI_API_KEY` in `.env.local`.

Open `http://localhost:3000/studio` or `http://localhost:3000/batch`.
