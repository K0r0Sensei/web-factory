# Web Factory V4

V4 adds an optional AI Design Director + copy generator while preserving the deterministic fallback. The renderer still consumes the same closed DesignSpec contract, so AI can be turned on/off without changing the visual engine.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000/studio

## Enable AI

Create `.env.local` from `.env.example` and set `GEMINI_API_KEY`.
`GEMINI_MODEL` is optional; it defaults to `gpt-6-luna` and can be changed without code changes.

The server calls the Gemini Responses API. The model must return JSON containing `design` and `copy`. Invalid or failed AI responses automatically fall back to the local Design Director and fallback copy.

## Architecture

BusinessData -> AI/Local Director -> DesignSpec + SiteCopy -> Renderer

The API key is only read server-side; do not expose it in client components.
