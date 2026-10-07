# Implementación V1

## Sprint A — Renderer

Crear un renderer con componentes puros:

- Navbar
- Hero
- TrustStrip
- Services
- Benefits
- Reviews
- Areas
- FAQ
- Contact
- Footer

Cada componente recibe datos de negocio + la variante correspondiente.

## Sprint B — Validation

Validar `DesignSpec` contra el catálogo antes de renderizar. Si falla, no publicar.

## Sprint C — AI planner

Entrada: `BusinessData`.
Salida: `DesignSpec` estructurado.

## Sprint D — Visual critic

- Renderizar screenshot desktop y mobile con Playwright.
- Evaluar jerarquía, legibilidad, CTA, densidad y consistencia.
- Permitir una sola iteración automática en V1.

## Sprint E — Demo deployment

Asignar slug estable:

`https://demo.tudominio.com/{business-id}`

Guardar versión y DesignSpec para reproducibilidad.

## Sprint F — Monetización

Cuando una demo se convierte:

`Stripe -> onboarding -> datos finales -> producción -> dominio -> mantenimiento`

## Stack base verificada

La documentación oficial actual de Next.js recomienda App Router, TypeScript y Tailwind para nuevos proyectos; el proyecto puede crearse con `pnpm create next-app@latest`. En esta V1 el renderer usa CSS propio para no bloquear el experimento en una librería de UI; shadcn/ui puede añadirse después porque distribuye componentes como código editable dentro del proyecto. citeturn758775search0turn758775search2turn796703search3
