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

- `src/pages/` — routes
- `src/components/` — UI grouped by purpose
- `src/layouts/` — shared page layouts
- `src/lib/` — catalog logic, browser scripts, SEO and build integrations
- `src/data/` — catalog content and reference data
- `src/i18n/` — Russian and English UI dictionaries
- `src/styles/` — Tailwind v4 tokens, palettes and component styles
- `src/worker.ts` — Cloudflare Worker entry: Markdown for bots and `Accept: text/markdown`, `/api/geo.json`, then Astro
- `public/` — public static assets

Keep stable `tbk-*` URLs, localized routes and source references intact.
The catalog API lives at [api.tatarverse.cc](https://api.tatarverse.cc/docs/).

## Center pages and hosting

- One page for every center: `/centers/tbk-N/` and `/en/centers/tbk-N/` are rendered on request
  (`export const prerender = false`) from `GET /centers/{code}` of the catalog API, so search engines get
  ready HTML (header, links, facts, text, canonical, hreflang, JSON-LD) and new or edited centers are live
  at once, without a rebuild. API responses are cached at the Cloudflare edge for a minute
  (`src/lib/server/centerApi.ts`). `/centers/386/` and `/centers/TBK-386/` redirect to `/centers/tbk-386/`,
  an unknown code is a 404, an unreachable API is a 503 with `Retry-After`.
- Page data: `src/lib/center/cardDetail.ts`, text: `src/components/centers/CenterBody.astro` — the same
  sections the sync writes into mdx (`centerBody` in `src/lib/center/apiCard.ts`). Neighbours and related
  centers come from `src/data/centers.meta.json`, which `centers:sync` writes next to the snapshot.
- Hosting is Cloudflare Workers with static assets (`@astrojs/cloudflare` v14 no longer supports Pages).
  Every other page is still prerendered. `bun run cf:deploy` runs `wrangler deploy`.
  One-time move from Pages: the first deploy creates the `tatarverse` Worker; then move the tatarverse.cc
  (and www) custom domain from the Pages project to the Worker (Workers & Pages → tatarverse → Settings →
  Domains & Routes). Until then the Pages site keeps working.
- Local check in the Workers runtime: `bun run build && bunx astro preview`.
