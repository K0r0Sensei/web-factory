# Web Factory V7 — Gemini diagnostics

V7 corrige un problema importante de V6: los fallos de Gemini ya no quedan ocultos detrás de un fallback local silencioso.

## Configuración

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=tu_clave
GEMINI_MODEL=gemini-3.8-flash
```

Reinicia `npm run dev` tras modificar `.env.local`. En `/studio` usa **Probar Gemini** antes de generar una web.

- `✓ Gemini responde`: la clave y el modelo funcionan.
- `⚠ Gemini no responde`: se muestra el error exacto.
- Al generar, el preview muestra `IA · modelo · X ms` cuando Gemini se utilizó realmente.

No se muestra ni devuelve la clave de API.
