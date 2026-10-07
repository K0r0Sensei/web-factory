# Web Factory V9

V9 migra Gemini a la **Interactions API** y usa `gemini-3.8-flash` por defecto.

Google documenta actualmente `POST /v1beta/interactions` para este flujo y el campo `response_format` para exigir JSON conforme a un esquema.

## Configuración

```env
GEMINI_API_KEY=tu_clave
GEMINI_MODEL=gemini-3.8-flash
```

## Ejecutar

```bash
npm install
npm run dev
```

Abre `/studio`. Usa primero **Probar Gemini** y después **Generar web**.

La respuesta de Interactions se lee desde `steps[].content[].text`. El fallback local sigue disponible únicamente cuando Gemini falla.
