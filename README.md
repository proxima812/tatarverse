# tatarverse.cc

Private Astro catalog of Tatar, Bashkir, and Crimean Tatar communities.
All rights reserved. Source code and project materials are not licensed for redistribution.

## Development

```sh
bun install
bun run dev
bun run check
bun run build
```

## Structure

- `src/pages/` — routes and static API endpoints
- `src/components/` — UI grouped by purpose
- `src/layouts/` — shared page layouts
- `src/lib/` — catalog logic, browser scripts, SEO and build integrations
- `src/data/` — catalog content and reference data
- `src/i18n/` — Russian and English UI dictionaries
- `src/styles/` — Tailwind v4 tokens, palettes and component styles
- `functions/` — Cloudflare Pages runtime handlers
- `public/` — public static assets

Keep stable `tbk-*` URLs, localized routes and source references intact.
The static catalog API is documented in [docs/API.md](docs/API.md).
