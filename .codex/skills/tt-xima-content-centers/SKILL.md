---
name: tt-xima-content-centers
description: Use when adding, fixing, or reviewing center content, collection schema usage, center page data, or MDX entry structure in tt.xima.work.
---

# TT Xima Content Centers

Use this skill for content tasks around centers.

## Source of Truth

- Center collection key: `centers`
- Loader base path: `src/data/centers`
- Schema file: `src/content.config.ts`
- Card list renderer: `src/components/list/ListCards.astro`
- Card preview UI: `src/components/ui/CardItem.astro`
- Center detail page: `src/pages/list/centers/[slug].astro`

Do not rely on older notes that mention `src/data/cards/`. In this repo, the active content path is `src/data/centers`.

## Working Rules

- Keep frontmatter aligned with the current `centers` schema before editing content.
- Prefer fixing content shape instead of patching UI around broken data.
- Preserve existing language and editorial tone unless the user requests copy changes.
- When content is missing, favor omission over noisy placeholder text.

## Expected Fields

Common fields used by the current UI:

- `title`
- `summary`
- `pubDate`
- `type`
- `category`
- `source`
- `location.flag`
- `location.city`
- `location.country`
- `location.region`

Check the actual schema before introducing new fields. If the schema changes, run `bunx astro sync`.

## UI-Sensitive Content Notes

- Very long dump-style summaries are intentionally suppressed in the preview card.
- Country and region values affect client-side filters.
- `pubDate` affects the `new` badge logic in cards.
- Missing country data falls back to `Прочее` in filtering.

## Safe Workflow

1. Read `src/content.config.ts`.
2. Inspect one or two nearby entries in `src/data/centers`.
3. Make the narrowest content change.
4. If fields changed, run `bunx astro sync`.
5. Prefer a lightweight verification over a full build.
