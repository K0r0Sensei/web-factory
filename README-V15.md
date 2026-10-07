# Web Factory V15 — Discovery Engine

V15 adds a user-triggered discovery step before website audit/generation.

## Route

`/discover` → choose niche + city → discover businesses → audit websites → generate top 3 demos.

## Providers

### DataForSEO (recommended for commercial validation)
Set `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD`. The adapter uses Business Listings Live Search and Nominatim once per user-triggered search to get a city coordinate. DataForSEO documents Business Listings as a paid live API with business contacts, domains, ratings and related fields.

### OpenStreetMap / Overpass (experimental)
No credentials needed. Search is limited to 20 businesses per action and includes attribution. This is useful for validating the end-to-end flow. Review ODbL/licensing and public-server usage limits before using OSM data in a commercial lead database.

## Notes

Google Places API is intentionally not used as our lead-list source: Google's current Maps terms restrict using Google content to create or augment mailing/telemarketing lists. Use a provider whose licensing permits the intended commercial use instead.

## Usage

```bash
npm install
npm run dev
```

Open `http://localhost:3000/discover`.
