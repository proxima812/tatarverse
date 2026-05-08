---
name: tt-xima-astro-content
description: Use for Xima Tatars Astro/MDX content, i18n, center data, SEO metadata, canonical routes, robots, sitemap, and structured content changes. Do not use for broad UI redesigns.
---

# Xima Tatars Astro Content

Follow this workflow for content, data, i18n, and SEO tasks in this repository.

1. Identify the smallest source of truth before editing:
   - Routes live in `src/pages`.
   - Center content lives in `src/data`.
   - Locale strings live in `src/i18n`.
   - Shared metadata helpers live in `src/components/partials/SEO.astro` and `src/config.ts`.
2. Preserve existing slugs, route structure, and locale behavior unless the task explicitly asks to change them.
3. For MDX, keep frontmatter shape, heading levels, and semantic content intact.
4. For SEO-related edits, check canonical URLs, robots behavior, headings, translated alternates, sitemap implications, and visible page title consistency.
5. Do not run a full build by default. Use targeted validation, or explain why validation was skipped.

Output should include the files changed and any SEO risk that remains.
