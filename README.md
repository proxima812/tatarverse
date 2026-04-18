# Tatar & Bashkir Centers

Каталог татарских, башкирских и крымскотатарских культурных центров по всему миру.

## Stack

- [Astro](https://astro.build) 6.1.4 — static site generator
- [Tailwind CSS](https://tailwindcss.com) v4 — styling
- [astro-icon](https://github.com/natemoo-re/astro-icon) + Tabler Icons
- MDX — card content format
- TypeScript

## Run Locally

```bash
bun install
bun dev        # http://localhost:4321
bun run build  # production build → dist/
```

## Adding a Center

Create a new `.mdx` file in `src/data/centers/`:

```yaml
---
title: Название центра
summary: Краткое описание.
pubDate: 2025-06-01
location:
  flag: 🇰🇿
  city: Алматы
  country: Казахстан
links:
  - type: instagram
    url: https://instagram.com/handle
  - type: telegram
    url: https://t.me/handle
---
```

The card appears on `/list` automatically. Cards added within the last 90 days get a **NEW** badge.

The content collection schema lives in `src/content.config.ts`. If you add or rename schema fields, run:

```bash
bunx astro sync
```

## Roadmap

### Near-term
- [ ] Individual center pages `/centers/[id]` — full description, map embed, all links
- [ ] Tag/category system — молодёжный, языковой, онлайн, спортивный, etc.
- [ ] Filter by tags on the list page

### Content & Discovery
- [ ] Map view — interactive map (Leaflet.js) showing all centers as pins
- [ ] Statistics page — bar chart of centers per country
- [ ] RSS feed for newly added centers

### SEO & Performance
- [ ] Per-card Open Graph image generation (Satori / `astro-og-canvas`)
- [ ] Pagefind full-text search (searches card body content, not just frontmatter)
- [ ] Sitemap auto-generation for individual center pages

### Internationalization
- [ ] Multilingual support — Tatar (tt), Russian (ru), English (en) via Astro i18n
- [ ] Localized UI strings

### Community
- [ ] "Suggest a center" form — GitHub Issue template or simple form → email
- [ ] Verified badge for centers that confirmed their info

### UI / UX
- [ ] Dark mode
- [ ] Skeleton loading state for card grid
- [ ] Pagination or infinite scroll for large datasets
