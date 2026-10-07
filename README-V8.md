# Web Factory V8 — Gemini schema compatibility fix

V8 corrige el esquema de salida estructurada enviado a Gemini.

Cambios:
- `services.columns` se solicita como string (`"1"`..`"4"`) y se convierte a número antes de validar el `DesignSpec`.
- `copy.serviceDescriptions` ahora es un array de `{service, description}` y ya no usa `additionalProperties`.
- Se mantiene el fallback local, pero los errores de Gemini siguen apareciendo en los diagnósticos.

Configuración:

```bash
cp .env.example .env.local
```

```env
GEMINI_API_KEY=tu_clave
GEMINI_MODEL=gemini-3.8-flash
```

Arranque:

```bash
npm install
npm run dev
```

Abrir:

`http://localhost:3000/studio`

Primero usa **Probar Gemini** y después **Generar web**.
