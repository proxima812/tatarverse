# tatarverse.cc

A static multilingual Astro site about Tatar and Bashkir communities, cultural centers, sources, translations, and reference materials.

Russian documentation is available in [READMERU.md](./READMERU.md).

## Project Status

This project is being prepared for open-source contributions. The most useful contributions are verified updates to community center data, translations, source references, accessibility fixes, and small UI improvements that preserve the existing visual language.

## Stack

- Astro 6 with static output
- MDX content collections
- Tailwind CSS v4 through `@tailwindcss/vite`
- Bun as the preferred package manager
- Multilingual routes: `ru`, `en`, `tt`, `qt`, `uk`, `de`, `es`, `ky`, `uz`, `kk`

## Project Structure

```txt
src/
  components/          Astro UI components
  data/centers_formatted/
                       MDX files for center pages
  data/worldCountries.ts
                       localized country labels and country flags
  i18n/locales/        translation dictionaries
  layouts/             page layouts
  pages/               Astro pages and routes
  styles/tailwind.css  Tailwind v4 theme tokens and global utilities
```

## Getting Started

Install dependencies:

```bash
bun install
```

Run the local dev server:

```bash
bun run dev
```

Build the static site:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

## Contributing

Please keep contributions focused and easy to review.

1. Open an issue or describe the change clearly in your pull request.
2. Create a dedicated branch from the current main branch.
3. Keep changes narrowly scoped to one topic.
4. Do not reformat unrelated files.
5. Include sources for factual content changes.
6. Run a relevant local check when possible.

Good pull requests usually include:

- what was added or fixed;
- links to sources used for data updates;
- screenshots for UI changes;
- notes about incomplete or uncertain data.

## Adding Or Updating A Center

Center data lives in `src/data/centers_formatted`.

Add a new `.mdx` file or edit an existing one. Use this frontmatter shape:

```mdx
---
title: Center name
pubDate: '2025-02-05T00:00:00.000Z'
type: Зарубежный
category: Татарский
source: https://example.com/
summary: Short neutral description of the center
location:
  country: Country
  city: City
  region: Region
---
```

Required field:

- `title`

Allowed `type` values:

- `Регион РФ`
- `Зарубежный`
- `Онлайн`

Allowed `category` values:

- `Татарский`
- `Татаро-Башкирский`
- `Башкирский`
- `Крымотатарский`

Optional `location` fields:

- `country`
- `city`
- `region`
- `flag`

If a value is unknown, omit the field instead of adding placeholder text.

After the frontmatter, add the page content in MDX. Keep it factual, neutral, and source-backed. Avoid promotional wording.

## Translations

Translation dictionaries live in `src/i18n/locales`.

When adding a UI string:

1. Add the same key to every locale file.
2. Use an existing key namespace such as `nav.*`, `list.*`, `detail.*`, `copy.*`, or `feedback.*`.
3. In components, use `useTranslations(locale)` and `t("key.name")`.
4. Do not leave hardcoded user-facing text in components.

## UI Guidelines

The site uses a restrained editorial visual language:

- prefer semantic Tailwind theme tokens from `src/styles/tailwind.css`;
- keep layouts content-first and simple;
- use existing component patterns;
- avoid introducing new color palettes unless there is a clear reason;
- keep light and dark theme behavior in mind when touching global tokens.

## Content And SEO Guidelines

- Preserve canonical route behavior and localized links.
- Keep headings meaningful and structured.
- Preserve source links and factual intent.
- Avoid broad MDX formatting churn.
- Be careful with metadata and structured data.

## License

No open-source license has been added yet. Until a license is published, all rights are reserved by the project owner.
