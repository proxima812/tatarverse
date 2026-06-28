# Product

## Register

brand

## Product Purpose

`tatarverse.cc` is a practical bilingual catalog of Tatar, Bashkir, Tatar-Bashkir, and Crimean Tatar cultural and community centers. Success means a visitor can quickly understand the project, find relevant centers, verify source-backed details, and switch between Russian and English without losing context.

## Users

- People looking for a center, community, source, or related reference page.
- Contributors who can verify and improve center data.
- Translators maintaining English versions of Russian source entries.
- Researchers and community members who need stable source-backed links.

## Current Scope

- Static Astro 6 site.
- Public locales: Russian (`ru`) and English (`en`).
- Russian center entries are the source content in `src/data/centers_formatted`.
- English center entries live in `src/data/centers_i18n/en`.
- UI strings live in `src/i18n/locales/ru.ts` and `src/i18n/locales/en.ts`.
- Primary public surfaces: homepage, centers index, center detail pages, sources, translations, policy, and posts.

## Brand Personality

Useful, precise, compact, cultural, modern, and restrained. The current design system is mostly monochrome, but the homepage has a controlled brand layer: a liquid-metal mark, a blue hero accent, compact animated statistics, and a real search screenshot section. The catalog itself remains quiet and factual.

## Anti-references

No glossy SaaS styling, marketplace templates, generic startup hero language, decorative card grids, invented slogans, cultural-color pastiche, or broad new palettes. Do not make the functional catalog feel like a campaign page. Do not expand motion beyond meaningful hero, stat, and state transitions.

## Design Principles

1. Keep the catalog useful first.
2. Make center information easy to scan, compare, and verify.
3. Preserve factual wording, source links, locale routing, and stable slugs.
4. Use the monochrome token system for structure and the blue accent only for the homepage brand moment.
5. Let real interface imagery carry explanation where it is clearer than text.
6. Use motion sparingly: page identity, stats emphasis, and small control feedback only.
7. Keep localization behavior predictable and visible.

## Accessibility & Inclusion

Aim for clear readable contrast, keyboard-accessible controls, semantic structure, meaningful alt text, and multilingual consistency. Motion must respect `prefers-reduced-motion`. Placeholder text, muted metadata, and small labels must remain legible against their surfaces.
