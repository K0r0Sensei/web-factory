# Web Factory V10

V10 añade el **Batch Generator** para convertir una lista CSV de negocios en muchas generaciones de webs con el mismo motor Gemini + renderer.

## Ejecutar

```bash
npm install
npm run dev
```

Abre:

- `/studio` para una web individual.
- `/batch` para generación masiva.

## CSV

Cabeceras mínimas:

```text
businessName,city,phone,services
```

Opcionales:

```text
whatsapp,rating,reviewsCount,description,emergency24h,serviceAreas
```

`services` y `serviceAreas` usan `|` para separar valores.

## Flujo Batch

```text
CSV
 ↓
cola secuencial
 ↓
POST /api/generate
 ↓
Gemini
 ↓
DesignSpec + Copy
 ↓
preview por negocio
```

La cola es deliberadamente secuencial para no disparar muchas solicitudes simultáneas contra la cuota de Gemini.
