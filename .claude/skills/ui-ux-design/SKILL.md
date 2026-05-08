---
name: ui-ux-design
description: UI/UX design system for tt.xima.work — Tailwind v4 tokens, OKLCH color space, responsive patterns, dark mode, component styling, and accessibility
---

# UI/UX Design System

## Tailwind CSS v4

- Config via CSS: `src/styles/tailwind.css` — NOT tailwind.config.js
- Plugins loaded with `@plugin`: @tailwindcss/typography, @toolwind/corner-shape
- Custom utilities via `@utility` directive (e.g., `content-auto`)
- Custom theme tokens in `@theme {}` block

## Design Tokens (CSS custom properties)

Semantic color system — never use raw colors, always use tokens:

| Token | Purpose |
|-------|---------|
| `background` / `foreground` | Page base |
| `surface` / `surface-foreground` | Card/panel surfaces |
| `muted` / `muted-foreground` | Secondary/dimmed content |
| `subtle` / `subtle-foreground` | Tertiary content |
| `border` / `border-muted` | Borders |
| `primary` / `primary-foreground` | Primary actions |
| `link` / `link-decoration` | Link text and underlines |
| `depth-100` to `depth-700` | Neutral depth scale (light to dark) |
| `destructive` | Error/danger (uses lab() color) |

## Dark Mode

- Class-based: `.dark` on root element toggles all token values
- ThemeToggle component handles switching
- NEVER use `dark:` variant classes — all theming flows through CSS variables
- All tokens auto-switch — components don't need dark-mode-specific styles

## Color System — OKLCH

Badge/card colors use OKLCH for perceptually uniform results:
```ts
oklch(lightness, chroma, hue, alpha)
// L: 0–1, C: ~0–0.4, H: 0–360
```

- Pastel palette: L=0.74–0.88, C=0.14–0.20
- Warm cream base: `oklch(0.965, 0.022, hue+18, 1)`
- Deterministic from content hash — same card always gets same colors
- Mesh gradient: 4 radial gradients at edges/corners, clean center

## Component Styling Patterns

### Squircle cards
```
rounded-4xl corner-squircle
```

### Glass/frosted elements
```
bg-white/50 backdrop-blur-lg ring-inset ring ring-white
```

### Hover lift
```
transition-all hover:-translate-y-0.5
```

### Focus visible
```
focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
```

### Text rendering
- Headings: `antialiased md:subpixel-antialiased text-balance`
- Body: `antialiased md:subpixel-antialiased text-pretty`
- Line clamping: `line-clamp-1`, `line-clamp-2`

## Responsive Approach

- Mobile-first: base styles are mobile, scale up with `sm:`, `md:`, `lg:`
- Cards: `h-56 sm:h-60`, padding `p-5 sm:p-6`
- Filter panel: collapsible on mobile with toggle button + active filter badge
- Use `content-auto` (content-visibility: auto) for long lists

## Animations

Defined in `@layer components`:
- `scrollX` — infinite horizontal background scroll (70s)
- `word-rise` — text entry from below with blur (1.1s cubic-bezier)
- `word-sink` — text exit downward (0.9s)
- `fade-x` — horizontal mask-image fade for scrolling containers

## Accessibility

- All interactive elements need `focus-visible` outlines
- Use semantic HTML: `<article>`, `<nav>`, `<h2>` inside cards
- Icon-only buttons need `aria-label`
- Decorative elements: `aria-hidden="true"` or `pointer-events-none`
- Language switcher: `aria-checked`, `tabindex`, arrow key navigation
- Links must have visible text or `aria-label`, not just wrapped containers

## When Creating New Components

1. Use semantic tokens from the design system, never raw hex/hsl
2. Apply `corner-squircle` with `rounded-*` for the project's signature look
3. Glass effect for floating/overlaid elements
4. Responsive: design mobile layout first, enhance for desktop
5. Always include focus-visible styles on interactive elements
6. Use `cn()` utility for conditional class composition
7. Test both light and dark themes — tokens handle it automatically
