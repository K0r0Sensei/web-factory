# Web Factory V11

Batch mode now uses **strict AI mode**: it never counts a local fallback as a successful Gemini generation.

## What changed
- `/api/generate` accepts `strictAI: true` and returns an error status instead of silently falling back.
- Batch requests use `strictAI: true`.
- Transient Gemini errors are retried up to 3 attempts with backoff.
- A small delay is added between businesses.
- The batch UI now shows `IA` only for real Gemini output and `Error IA` for failures.
- The actual Gemini error is shown on the failed card.

## Run
```powershell
npm install
npm run dev
```
