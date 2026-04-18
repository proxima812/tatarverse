---
name: tt-xima-ui-edits
description: Use when editing Astro components, Tailwind v4 classes, layout spacing, buttons, cards, filters, or page composition in tt.xima.work while preserving the existing UI language.
---

# TT Xima UI Edits

Use this skill for project UI work.

## Stack Pattern

- Astro pages and components
- Tailwind CSS v4 via `src/styles/tailwind.css`
- `@/` alias for imports
- `astro-icon` for icons
- `cn()` from `src/utils/libs/cn.ts` for class composition
- `corner-squircle` utility is already part of the visual language

## Existing Design Language

- Base shell: white background, dark zinc text, restrained chrome
- Container width: `max-w-6xl` via `src/components/partials/Container.astro`
- Primary accent is neutral dark via `bg-primary`
- Accent highlight exists mainly as `intense-cherry-*`
- Rounded shapes commonly use `rounded-2xl` plus `corner-squircle`
- Cards, chips, and buttons rely on thin borders/rings over heavy shadows

## Reuse First

Prefer existing components before adding new patterns:

- Buttons and CTA links: `src/components/ui/ButtonLink.astro`
- Center cards: `src/components/ui/CardItem.astro`
- Page container: `src/components/partials/Container.astro`
- Filters and chips: `src/components/list/CountryFilter.astro`, `src/components/list/RegionFilter.astro`

## Editing Rules

- Match the current zinc-first palette unless the task explicitly asks for visual change.
- Do not introduce a new spacing scale, corner style, or button treatment without a concrete need.
- Prefer Tailwind utilities. Use component-local styles only when utilities are not enough.
- Keep list/grid behavior stable across view toggles and filters.
- Preserve SEO/layout wiring in `src/layouts/Layout.astro`.

## Watchouts

- There is some duplication between shared button patterns and list-specific link/chip styling.
- `ListCards.astro` mixes global CSS and client JS; keep changes there tightly scoped.
- Hero typography is custom and intentionally expressive; do not normalize it unless requested.

## Safe Workflow

1. Inspect the nearest existing component with similar behavior.
2. Reuse tokens and classes already present in the repo.
3. Edit the smallest possible file set.
4. Run a lightweight check only if the change touches behavior or syntax.
