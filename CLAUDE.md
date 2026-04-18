# CLAUDE.md — Developer Instructions

## Stack

| Tool | Version | Notes |
|------|---------|-------|
| Astro | 6.1.4 | Static site output |
| Tailwind CSS | v4 | Vite plugin, no tailwind.config.js |
| TypeScript | ~5.7 | Strict mode, `@/` alias → `src/` |
| astro-icon | ^1.1.5 | Tabler icons (`@iconify-json/tabler`) |
| MDX | via @astrojs/mdx | Card content format |

## Commands

```bash
bun dev        # Start dev server (localhost:4321)
bun run build  # Production build → dist/
bun preview    # Preview production build
bunx astro sync  # Regenerate content collection types (run after schema changes)
```

## Path Alias

`@/` maps to `src/`. Use it everywhere:
```ts
import Layout from "@/layouts/Layout.astro";
import { cn } from "@/utils/libs/cn";
```

## Content Collections

Cards live in `src/data/centers/` as `.mdx` files. Schema is defined in `src/content.config.ts`.

### Adding a New Card

Create `src/data/centers/my-center.mdx` with this frontmatter:

```yaml
---
title: Название центра
summary: Краткое описание центра в 1–2 предложениях.
pubDate: 2025-06-01
location:
  flag: 🇰🇿
  city: Алматы
  country: Казахстан
  address: ул. Примерная, 1
links:
  - type: instagram
    url: https://instagram.com/handle
    label: Instagram
  - type: telegram
    url: https://t.me/handle
    label: Telegram
---

Здесь можно написать подробный текст о центре в формате Markdown.
```

**Supported link types:** `instagram`, `telegram`, `vk`, `facebook`, `youtube`, `tiktok`, `twitter`, `site` / `web` / `website`

After saving, the card appears on `/list` automatically. No imports needed.

**NEW badge** shows automatically for cards with `pubDate` within the last 90 days.

## Design Tokens

Defined in `src/styles/tailwind.css` as Tailwind v4 `@theme` variables:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1d1d1d` | Dark background, buttons |
| `--color-primary-foreground` | `#ffffff` | Text on primary |
| `--color-intense-cherry-*` | OKLCH scale (50–950) | Accent, NEW badge |

Use via Tailwind classes: `bg-primary`, `text-primary-foreground`, `bg-intense-cherry-500`, etc.

## Icons

Uses Tabler icons via `astro-icon`:
```astro
---
import { Icon } from "astro-icon/components";
---
<Icon name="tabler:brand-instagram" class="h-4 w-4" />
```

Browse all icons at [tabler-icons.io](https://tabler-icons.io).

## Key Utilities

- `src/utils/libs/cn.ts` — `cn(...classes)` merges Tailwind classes with clsx + tailwind-merge
- `corner-squircle` — Tailwind utility from `@toolwind/corner-shape`, adds iOS-style squircle corners. Use alongside `rounded-2xl`.

## Component Structure

```
src/components/
├── ui/
│   ├── ActionPill.astro    # Shared pill primitive for links/buttons/chips
│   ├── ButtonLink.astro    # Navigation and CTA links
│   └── CardItem.astro      # Center card (title, location, summary, links, NEW badge)
├── partials/
│   ├── Container.astro     # Max-width wrapper
│   ├── SEO.astro           # Meta tags
│   ├── Logo.astro
│   └── WhoDev.astro        # Fixed footer attribution
├── LinksNav.astro          # Homepage navigation links
├── MainText.astro          # Hero heading
├── BubbleMsg.astro
└── list/
    ├── ListCards.astro     # Full cards page with search/filter/view
    ├── CountryFilter.astro
    ├── RegionFilter.astro
    └── ListBackLink.astro
```

## Schema Changes

After editing `src/content.config.ts`, always run:
```bash
bunx astro sync
```
This regenerates `.astro/types.d.ts` so TypeScript picks up new fields.
