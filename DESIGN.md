---
name: Tatarverse
description: Bilingual catalog of Tatar, Bashkir, Tatar-Bashkir, and Crimean Tatar centers.
register: brand
colors:
  background: "#ffffff"
  foreground: "#1d1d1d"
  muted: "#f0f0f0"
  muted-foreground: "#6b6b6b"
  subtle: "#e6e6e6"
  subtle-foreground: "#8f8f8f"
  surface: "#ffffff"
  surface-foreground: "#1d1d1d"
  surface-muted: "#f5f5f5"
  border: "#dbdbdb"
  border-muted: "#ebebeb"
  ring: "#c7c7c7"
  primary: "#1d1d1d"
  primary-foreground: "#ffffff"
  link: "#1d1d1d"
  link-decoration: "#c7c7c7"
  depth-100: "#e6e6e6"
  depth-200: "#d1d1d1"
  depth-300: "#a3a3a3"
  depth-400: "#7a7a7a"
  depth-500: "#5c5c5c"
  depth-600: "#474747"
  depth-700: "#333333"
  brand-sky: "#38bdf8"
  brand-blue: "#2563eb"
  brand-azure: "#0ea5e9"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 7vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.04em"
    textTransform: "uppercase"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.875rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.375
    letterSpacing: "-0.015em"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  card: "24px"
  catalog-card: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "clamp(48px, 8vw, 96px)"
  page-x: "20px"
components:
  hero-title:
    color: "{colors.foreground}"
    accent: "{colors.brand-blue}"
    typography: "{typography.display}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "{typography.label}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "{typography.label}"
  chip-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
    typography: "{typography.label}"
  stats-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
    typography: "{typography.label}"
  card-center:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.surface-foreground}"
    rounded: "{rounded.catalog-card}"
    padding: "20px"
---

# Design System: Tatarverse

## 1. Overview

**Creative North Star: "A Catalog With A Signal"**

Tatarverse is still a practical catalog, but the current site has a clearer public identity than the older flat system. The homepage introduces the project with a compact brand mark, uppercase hero typography, one controlled blue accent, animated catalog statistics, and a screenshot-led search section. After that first impression, the product returns to a quiet, scannable catalog language.

The design system has two layers:

- **Brand layer:** homepage identity moments, the liquid-metal mark, hero accent, stats choreography, and product imagery.
- **Catalog layer:** centers list, cards, filters, search, MDX content, navigation, translation surfaces, and source-backed detail pages.

The brand layer should make the site memorable. The catalog layer should make the data easy to use.

## 2. Color

The base palette is monochrome and semantic. It is defined in `src/styles/tailwind.css` through Tailwind v4 tokens: `background`, `foreground`, `muted`, `surface`, `border`, `ring`, `primary`, `link`, and `depth-*`.

### Base Roles

- **Background / Surface:** clean white planes for the page, cards, menus, screenshots, and MDX content.
- **Foreground / Primary:** the main ink color for text, strong actions, active filters, and focus affordances.
- **Muted / Subtle:** low-emphasis surfaces, metadata, labels, chips, and quiet card backgrounds.
- **Border / Ring / Depth:** separators, inset rings, dividers, and tonal hierarchy.
- **Primary Foreground:** inverse text for active controls and primary buttons.

### Brand Accent

The homepage uses a blue accent family (`#38bdf8`, `#2563eb`, `#60a5fa`, `#0ea5e9`) inside the hero word treatment. Treat this as a named brand moment, not a general palette. Do not apply it to cards, prose, footer links, filters, or center detail pages unless a specific design pass asks for that expansion.

### Color Rules

**Monochrome Carries Structure.** Default to the semantic neutral tokens for layout, controls, content, and catalog surfaces.

**Blue Is A Signal.** Blue belongs to the homepage identity accent and selected brand moments only. It should never become a generic decoration.

**No Cultural Color Pastiche.** Do not infer a palette from flags, ethnic motifs, or ornamental references. Cultural meaning comes from the content and source-backed data.

## 3. Typography

The site uses the system sans stack. The voice is practical and direct, with a sharper homepage display treatment.

### Hierarchy

- **Display:** homepage hero only. Use heavy uppercase sans, tight tracking no tighter than `-0.04em`, balanced wrapping, and short localized phrases.
- **Headline:** major page titles, list heroes, and content headers.
- **Title:** center card titles, post titles, compact section headings, and detail-page modules.
- **Body:** MDX content, summaries, factual descriptions, policy text, and explanatory copy.
- **Label:** buttons, chips, nav items, stats labels, metadata, and menu controls.

### Typography Rules

**Display Is Scarce.** Heavy uppercase display type is for the homepage identity and rare page-level statements. Do not use it inside cards or dense content modules.

**Factual Copy Wins.** The site should not sound like marketing. Use direct labels, source-backed descriptions, and localized wording that stands alone.

**Respect Locale Length.** Russian and English strings must wrap without overflow. Long titles need `overflow-wrap`, balanced headings, or tighter component constraints before changing copy.

## 4. Layout

The site uses centered content, generous vertical rhythm on the homepage, and compact catalog modules on data-heavy pages.

- Homepage: stacked brand mark, hero title, quick links, stats, and a screenshot-led search section.
- Centers index: list hero, toolbar, search/filter controls, grid cards, and pagination.
- Center detail: compact navigation, centered header, metadata badges, source links, sidebar facts, and MDX body.
- MDX pages: a readable surface with clear prose styles and restrained borders.

### Layout Rules

**One Strong Idea Per Fold.** The homepage can breathe. Catalog pages should stay compact and practical.

**Cards Are Functional.** Use cards for center records, posts, MDX surfaces, and real grouped data. Do not add decorative card grids.

**Screenshots Are Product Imagery.** The search section should use real interface imagery when explaining behavior. Avoid placeholder panels.

## 5. Shape And Surface

The visual language uses squircle geometry through `@toolwind/corner-shape` and rounded Tailwind utilities.

- Buttons, chips, menus, stats pills: `rounded-2xl` or full-pill where appropriate.
- Center cards: large squircle identity, currently about `32px`.
- Marketing or screenshot blocks: `rounded-3xl`, with image clipping and a deliberate shadow.
- MDX and utility panels: `rounded-2xl`, thin border or ring, and `shadow-2xs` only when separation is needed.

Avoid pairing a border with a large soft shadow on routine components. Stronger shadow belongs to screenshot-led sections or temporary overlays.

## 6. Motion

Motion is part of the new system, but it is limited.

- **Hero accent:** slow brand accent movement on the highlighted word.
- **Stats:** short count and focus animation that emphasizes catalog scale.
- **Marquee / word imagery:** optional brand texture, only when it supports the page rhythm.
- **Controls:** small hover, focus, and active-state transitions.

Every animation needs a reduced-motion path. Motion must enhance already visible content, not gate content rendering.

## 7. Components

### Liquid-Metal Mark

The homepage mark is a compact identity object. It should stay centered, decorative, and non-blocking. It is not a reusable card or icon style for the catalog.

### Hero Title

The hero title uses heavy uppercase lines with one blue accent phrase and quieter secondary lines. Keep words short enough for mobile. Do not add repeated section eyebrows around it.

### Home Links

Home links should be direct, localized navigation to key catalog surfaces. Keep them compact and useful.

### Catalog Stats

Stats are small, three-column pills with icons, tabular numbers, and muted labels. The animation should feel like a quick focus cue, not a dashboard metric showpiece.

### Search Screenshot Section

The homepage search section combines explanatory copy with localized screenshot imagery (`1-ru.png` / `1-en.png`). It may use stronger shadow than routine catalog cards because it is a product image feature.

### Buttons And Chips

Buttons and chips use compact padding, squircle rounding, semantic tokens, and visible focus states. Active states use `primary` and `primary-foreground`.

### Center Cards

Center cards remain the core catalog primitive. They must keep titles readable, metadata compact, locations scannable, and localized routes stable.

### MDX Surfaces

MDX content should use the typography plugin tokens, readable line lengths, restrained borders, and clear link styling. Do not add marketing wrappers around factual content.

## 8. Do And Do Not

### Do

- Reuse `src/styles/tailwind.css` tokens before adding visual roles.
- Keep the homepage brand layer distinct from catalog utility surfaces.
- Use real product imagery where it clarifies a feature.
- Preserve source-backed content, locale routes, stable slugs, and metadata behavior.
- Verify contrast for muted labels, placeholders, metadata, and small controls.
- Keep reduced-motion behavior in every animated component.

### Do Not

- Do not turn the whole site blue.
- Do not add extra cultural palettes or ornamental motifs.
- Do not add glossy SaaS gradients, glass panels, side stripes, or generic icon-card grids.
- Do not reuse homepage display treatment inside dense catalog surfaces.
- Do not add decorative motion to MDX pages, lists, or center detail content.
- Do not rewrite factual copy into slogans.
