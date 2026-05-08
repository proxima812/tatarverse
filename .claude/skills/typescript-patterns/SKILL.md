---
name: typescript-patterns
description: TypeScript conventions and type safety patterns for tt.xima.work — strict mode, Astro component typing, data modeling, and utility patterns
---

# TypeScript Patterns

Project uses TypeScript 6 with Astro's strict tsconfig.

## Compiler Settings

- `extends: "astro/tsconfigs/strict"` — strict mode enabled
- `strictNullChecks: true` — always handle null/undefined
- `exactOptionalPropertyTypes: false` — optional props accept undefined
- `allowJs: true` — JS files coexist
- Path alias: `@/*` maps to `src/*` — always use `@/` imports, never relative `../`

## Astro Component Typing

```astro
---
interface Props {
  id: string;
  title?: string;
  location?: {
    flag?: string;
    city?: string;
    country?: string;
  };
}

const { id, title, location } = Astro.props as Props;
---
```

- Define `interface Props` in every component frontmatter
- Use `as Props` assertion on `Astro.props`
- Optional fields use `?:` — guard with `&&` or `??` before accessing
- For string unions, use `type X = "a" | "b" | "c"` over enum

## Data Type Patterns

### Record maps for locale data
```ts
export const localeLabels: Record<AppLocale, { label: string; short: Uppercase<AppLocale> }> = { ... };
```

### Const assertions for static arrays
```ts
export const locales = ["ru", "en", "tt"] as const;
export type AppLocale = (typeof locales)[number];
```

### Country label maps
```ts
type CountryLabels = Partial<Record<AppLocale, string>>;
```

## Utility Patterns

- `cn()` from `@/utils/libs/cn` — combines clsx + tailwind-merge for class merging
- Hash function for deterministic visual output:
  ```ts
  const hashValue = (v: string) =>
    Array.from(v).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);
  ```
- Truncation helper: `const truncate = (v?: string, max = 23) => ...`

## Module Style

- ESM only (`"type": "module"` in package.json)
- Named exports preferred over default exports
- Group imports: external packages first, then `@/` aliases
- Type imports: use `import type { X }` for type-only imports

## Guard Patterns

- Sentinel value `"Нет данных."` — check and replace with undefined before display
- `isDump` pattern: detect auto-generated content by prefix matching and skip it
- Always derive locale from URL, never assume: `getLocaleFromUrl(Astro.url)`

## When Adding New Types

1. Co-locate types with their data (e.g., type in same file as the data it describes)
2. Export types from the module that owns the data
3. Use `Record<Key, Value>` for lookup maps
4. Use `as const` for static configuration arrays/objects
5. Prefer intersection (`&`) over inheritance for composing component prop types
