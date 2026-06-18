# Contributing Guide

This guide explains how to add new centers and update existing center data in `tatarverse.cc`.

## General Rules

- Keep one pull request focused on one topic: a new center, a data update, a translation, or a small fix.
- Do not reformat or edit neighboring files without a direct reason.
- For factual changes, include a source: website, social profile, official post, organization page, or another verifiable link.
- If data is unknown, omit the field. Do not add placeholders like `unknown`, `n/a`, or `-`.
- Keep the tone neutral: no advertising, claims, or unsupported wording.
- Preserve stable `tbk-*` file names. They act as public slugs.

## Where Centers Live

Russian source center files live in:

```txt
src/data/centers_formatted/
```

English center translations live in:

```txt
src/data/centers_i18n/en/
```

File names should match across languages:

```txt
src/data/centers_formatted/tbk-366.mdx
src/data/centers_i18n/en/tbk-366.mdx
```

The Russian version is the source version. If you update the source entry, check whether the English translation needs the same factual update.

## Adding A New Center

1. Find the next available `tbk-*` number in `src/data/centers_formatted/`.
2. Create a new `.mdx` file with that number.
3. Fill the frontmatter according to the schema in `src/content.config.ts`.
4. Add concise MDX content below the frontmatter: description, links, and verified details.
5. When possible, add the matching English file in `src/data/centers_i18n/en/`.

Minimal example:

```mdx
---
title: Center name
type: Зарубежный
category: Татарский
source: https://example.com/
summary: Short neutral description of the center.
location:
  country: Kazakhstan
  city: Almaty
---

# Center name

Short description with verifiable information.

## Links

- [Official website](https://example.com/)
```

## Updating Existing Information

- Change only the fields and text that are outdated or incorrect.
- Do not rename the `tbk-*` file.
- Do not remove existing information without a reason; replace outdated data with verified data.
- When editing `title`, `summary`, `location`, `source`, `type`, or `category`, make sure the source supports the change.
- Keep the same factual meaning between source and translated files.

## Field Schema

The center schema is defined in `src/content.config.ts`. It is strict: extra frontmatter fields are not allowed.

Allowed fields:

- `title` - required string.
- `pubDate` - optional date string.
- `type` - optional center type.
- `category` - optional center category.
- `source` - optional source URL.
- `summary` - optional short description.
- `location` - optional location object.

`location` fields:

- `country`
- `city`
- `region`
- `flag`

## Categories And Types

Centers do not currently have a separate `tags` field. Grouping is handled by the `category` and `type` fields, both defined with Zod enums.

Allowed `category` values:

- `Татарский`
- `Татаро-Башкирский`
- `Башкирский`
- `Крымотатарский`

Allowed `type` values:

- `Регион РФ`
- `Зарубежный`
- `Онлайн`

Do not add new categories or types directly in MDX. If a new value is needed, update the schema and related UI logic first.

## UI Translation Changes

UI strings live in `src/i18n/locales/ru.ts` and `src/i18n/locales/en.ts`.

When adding a UI label, add the same key to both files and use `useTranslations(locale)` in Astro components. Avoid hardcoded user-facing text.

## Validation

For regular content edits, review the changed `.mdx` files carefully. If schema, routes, locale logic, or shared data behavior changed, run a targeted project check such as:

```bash
bunx astro sync
```

Run a full build only when the change affects routing, Astro config, integrations, or site-wide data behavior.
