# Gemini setup

This project keeps the Gemini API key on the Next.js server and calls the Gemini REST `generateContent` endpoint.

## 1. Create the local env file

```bash
cp .env.example .env.local
```

Then add your key:

```env
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.8-flash
```

The default model is Gemini 3.8 Flash. Google currently documents it as GA, and the developer API pricing page lists a free tier for standard input/output usage. Check your Google AI Studio project for the quota attached to your specific key.

## 2. Start the app

```bash
npm install
npm run dev
```

Open:

`http://localhost:3000/studio`

## 3. Security

Do not put the key in client-side code and do not rename it to `NEXT_PUBLIC_GEMINI_API_KEY`. The route at `app/api/generate/route.ts` reads the key only on the server.

The generator requests structured JSON from Gemini so that the model can choose from the closed design catalog instead of inventing arbitrary layout IDs.
