# Web Factory V14 — Fast & bounded Gemini generation

V14 keeps the V13 lead factory but fixes an important operational issue: a Gemini generation could sit in `Gemini…` for minutes because the server waited indefinitely for the request.

Changes:
- `GEMINI_THINKING_LEVEL=low` by default for this simple copy/design task.
- 45 second hard timeout per Gemini model attempt (configurable).
- Existing multi-model fallback order remains intact.
- Batch UI shows elapsed seconds and retry attempt while a lead is generating.
- Gemini test endpoint has its own 20 second timeout.

## Run

```powershell
npm install
npm run dev
```

Keep `.env.local` with:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
GEMINI_MODELS=gemini-3.8-flash,gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.5-flash-lite
GEMINI_THINKING_LEVEL=low
GEMINI_TIMEOUT_MS=45000
GEMINI_TEST_TIMEOUT_MS=20000
```
