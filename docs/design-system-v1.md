# Design System V1

## Goal

Turn `BusinessData` into a complete website through a constrained `DesignSpec`.

The LLM must not generate arbitrary JSX/CSS. It should only choose values from the design catalog. The renderer owns the implementation.

## Current layouts

- L1 Conversion Split: urgency + phone conversion.
- L2 Professional Center: traditional local business with a cleaner, trust-first presentation.
- L3 Emergency Direct: high-intent 24h services.
- L4 Local Authority: strong reviews, locations and local trust.
- L5 Premium Minimal: higher-ticket installation/renovation positioning.

## Preview

Run the app and open `/playground?layout=L1` through `/playground?layout=L5`.

## Contract

`BusinessData -> DesignSpec -> Renderer -> Website`

The contract is intentionally stable so the future AI layer can replace the deterministic rules without changing the site renderer.
