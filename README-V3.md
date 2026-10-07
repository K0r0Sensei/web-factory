# Web Factory V3

V3 adds the first usable Studio: enter the business data, call the local generation API, let the deterministic Design Director choose a layout, and render the resulting website in the preview panel.

## Run

npm install
npm run dev

Open http://localhost:3000/studio

## Flow

Business form -> POST /api/generate -> BusinessData -> Design Director -> DesignSpec -> GeneratedSite renderer

The API is intentionally deterministic for now. Replace the Design Director implementation later with an AI-backed function without changing the renderer contract.
