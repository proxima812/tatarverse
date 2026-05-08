z# AGENTS.md

## Project

Xima Tatars is a static Astro site about Tatar communities, centers, sources, and multilingual reference content.

## Stack

- Astro 6 with static output.
- MDX content and Astro components.
- Tailwind CSS v4 through `@tailwindcss/vite`.
- Bun is the preferred package manager.
- Main source folders: `src/pages`, `src/components`, `src/layouts`, `src/data`, `src/i18n`, `src/styles`.

## Working Rules

- Keep changes narrowly scoped to the requested task.
- Do not touch `.claude/`.
- Do not modify generated screenshots or local browser artifacts unless explicitly asked.
- Do not redesign UI, spacing, hierarchy, colors, or interactions unless the task asks for UI changes.
- Prefer existing Astro component patterns and Tailwind utilities.
- Do not add dependencies when the existing stack is enough.
- Use `rg` for search.
- Use `apply_patch` for manual file edits.

## Content And SEO

- Preserve existing meaning, language, frontmatter, headings, canonical intent, and internal linking behavior.
- Be careful with locale routes and default Russian routes.
- For center data, preserve stable slugs and existing field semantics.
- When editing MDX, avoid broad formatting churn.

## Validation

- Do not run full builds by default.
- Prefer targeted checks such as `bunx astro check`, focused type checks, or parsing the files touched when useful.
- Run `bun run build` only when the change affects routing, Astro config, integrations, or site-wide data behavior.
