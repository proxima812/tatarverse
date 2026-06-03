# tatarverse.cc

A static multilingual Astro site about Tatar and Bashkir communities, cultural centers, sources, translations, and reference materials.

<!-- Russian documentation is available in [READMERU.md](./READMERU.md). -->

## Project Status

This project is being prepared for open-source contributions. The most useful contributions are verified updates to community center data, translations, source references, accessibility fixes, and small UI improvements that preserve the existing visual language.

## Stack

- Astro 6 with static output
- MDX content collections
- Tailwind CSS v4 through `@tailwindcss/vite`
- Bun as the preferred package manager
- Multilingual routes: `ru`, `en`, `tt`, `qt`

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

Please keep contributions focused and easy to review. Use the center data guide in the language most convenient for you:

- [Русский](./CONTRIBUTING.ru.md)
- [English](./CONTRIBUTING.en.md)
- [Татарча](./CONTRIBUTING.tt.md)
- [Qırımtatarca / Türkçe](./CONTRIBUTING.qt.md)

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

This repository uses separate licenses for code and content:

- Code is licensed under the [MIT License](./LICENSE).
- Content, center data, translations, and documentation are licensed under [CC BY 4.0](./CONTENT-LICENSE.md), unless otherwise noted.
- The `tatarverse.cc` name, logos, brand assets, visual identity, and recognizable site design are not licensed for reuse without written permission.

<!-- ## Tasks -->
<!-- - [x] fix -->

## Current Issues

<!-- open-issues:start -->
- Issues #3: [после перехода обратно в index сделать плавную анимацию.](https://github.com/proxima812/tatarverse/issues/3)
<!-- open-issues:end -->








