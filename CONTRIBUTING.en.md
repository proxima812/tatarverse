# Contributing Guide

This guide explains how to add new centers and update existing center data in tatarverse.cc.

## General Rules

- Keep one pull request focused on one topic: a new center, a data update, a translation, or a small fix.
- Do not reformat or edit neighboring files without a direct reason.
- For factual changes, include a source: website, social profile, official post, organization page, or another verifiable link.
- If data is unknown, omit the field. Do not add placeholders like `unknown`, `n/a`, or `-`.
- Keep the tone neutral: no advertising, claims, or unsupported wording.

## Where Centers Live

Primary center files live in:

```txt
src/data/centers_formatted/
```

Translated center files live in:

```txt
src/data/centers_i18n/en/
src/data/centers_i18n/tt/
src/data/centers_i18n/qt/
```

The Russian version is the source version. File names should match across languages, for example:

```txt
src/data/centers_formatted/tbk-366.mdx
src/data/centers_i18n/en/tbk-366.mdx
src/data/centers_i18n/tt/tbk-366.mdx
src/data/centers_i18n/qt/tbk-366.mdx
```

## Adding A New Center

1. Find the next available `tbk-*` number in `src/data/centers_formatted/`.
2. Create a new `.mdx` file with that number.
3. Fill the frontmatter according to the Zod schema in `src/content.config.ts`.
4. Add concise MDX content below the frontmatter: description, links, and verified details.
5. When possible, add matching versions in `src/data/centers_i18n/en`, `tt`, and `qt`.

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
- Do not rename the `tbk-*` file: it acts as a stable slug.
- Do not remove existing information without a reason; replace outdated data with verified data.
- When editing `title`, `summary`, `location`, `source`, `type`, or `category`, make sure the source supports the change.
- If you update the Russian version, check whether the translated versions need the same update.

## Zod Field Schema

The schema is defined in `src/content.config.ts`. It is strict: extra frontmatter fields are not allowed.

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

Do not add new categories or types directly in MDX. If a new value is needed, update the Zod schema and related UI logic first.

## Validation

For regular content edits, review the changed `.mdx` files carefully. If the schema, routes, or shared data logic changed, run a stronger project check.
