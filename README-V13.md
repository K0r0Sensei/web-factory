# Web Factory V13 — Lead Factory

V13 añade una primera capa comercial controlada:

- importar leads desde CSV;
- auditar ligeramente la home pública (si existe);
- calcular un `opportunityScore` de 0-100;
- priorizar candidatos con mayor margen de mejora;
- generar demos reales con Gemini solo para los candidatos seleccionados;
- ver y exportar resultados desde el mismo panel.

## Fuente de leads

La V13 usa CSV de forma deliberada. No implementa scraping masivo de Google Maps, ni convierte los servicios públicos de OpenStreetMap en un backend de prospección comercial.

Las instancias públicas de Nominatim tienen límites estrictos y desaconsejan la geocodificación masiva regular; Overpass también pide cachear, limitar la frecuencia y señala que el uso comercial habitual debe pasar a servidores propios o proveedores de pago. Consulta las políticas antes de automatizar una fuente de ese tipo.

## Ejecutar

```powershell
npm install
npm run dev
```

Abre:

`http://localhost:3000/leads`

Mantén tu `.env.local`:

```env
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
```

## Flujo

1. Cargar leads.
2. Auditar webs.
3. Ajustar el umbral.
4. Generar las demos top con Gemini.
5. Abrir la demo y exportar resultados.
