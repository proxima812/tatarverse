---
name: astro-dev
description: Astro SSG development patterns for tt.xima.work — routing, i18n, content collections, MDX, components, and build workflow
---

# Astro Development Playbook

This project is a static Astro 6 site (output: "static") using Bun as package manager.

## Stack

- Astro 6.1 with MDX, Sitemap, PWA (@vite-pwa/astro), astro-icon, astro-meta-tags
- Tailwind CSS v4 via @tailwindcss/vite (Vite plugin, NOT PostCSS)
- Remark: remark-gfm, remark-gemoji
- Rehype: rehype-prism-plus
- TypeScript 6 strict mode with `@/*` path alias to `src/*`

## i18n Architecture

- 10 locales defined in astro.config.mjs: ru (default), en, tt, qt, uk, de, es, ky, uz, kk
- Default locale (ru) has NO prefix — all others use `/{locale}/...` prefix
- `prefixDefaultLocale: false` — never add /ru/ prefix
- Server-side: `useTranslations(locale)` from `@/i18n` returns a `t(key, values?, default?)` function
- Client-side: `src/i18n/runtime.ts` handles language switching via `data-language-switcher` / `data-language-option` selectors
- Dictionary files: `src/i18n/locales/{locale}.ts` — only ru/en/tt/qt/uk are complete; de/es/ky/uz/kk are sparse stubs
- When adding new UI strings: add the key to ALL locale files, use `t("key")` in templates

### Adding i18n keys

1. Define key in `src/i18n/locales/ru.ts` (source of truth)
2. Add translations to en.ts, tt.ts, qt.ts, uk.ts
3. Add stub/placeholder to de.ts, es.ts, ky.ts, uz.ts, kk.ts
4. Use via `const t = useTranslations(locale); t("my.key")`

## Routing

- Pages live in `src/pages/` — root pages AND `src/pages/[locale]/` mirror pages
- Every `[locale]` page has `getStaticPaths()` that filters out the default locale
- Use `localizePath(locale, href)` for all internal links — never hardcode locale prefixes
- Use `getSwitcherHref(locale, url)` for language switcher links

## Content Collections

- Config: `src/content.config.ts`
- Center data: `src/data/centers_formatted/*.mdx` (~365 files with frontmatter)
- Static data: `src/data/worldCountries.ts`, `src/data/links.ts`, `src/data/_list-data.ts`
- Run `bunx astro sync` after changing content schema or collection structure

## Component Conventions

- All components are `.astro` files (no React/Vue/Svelte)
- Props defined via `interface Props {}` in frontmatter
- Use `Astro.props` with type assertion: `const { prop } = Astro.props as Props`
- Locale always derived from URL: `const locale = getLocaleFromUrl(Astro.url)`
- Components organized: `partials/` (layout pieces), `ui/` (reusable), `list/` (list page), `markdown/` (prose)

## Build & Dev

- `bun run dev` — dev server at localhost:4321
- `bun run build` — static build to dist/
- `bunx astro sync` — regenerate types after schema changes
- Prefetch strategy: viewport-based with prefetchAll enabled
