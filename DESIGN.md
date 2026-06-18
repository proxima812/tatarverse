---
name: Tatarverse
description: Practical Russian and English catalog of Tatar, Bashkir, Tatar-Bashkir, and Crimean Tatar centers.
colors:
  background: "#fafafa"
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
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.25rem, 7vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
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
  card: "32px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  page-x: "20px"
components:
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
  card-center:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.surface-foreground}"
    rounded: "{rounded.card}"
    padding: "20px"
---

# Design System: Tatarverse

## 1. Overview

**Creative North Star: "The Useful Catalog"**

Tatarverse is a Russian and English catalog, not a campaign page. The visual system should make center pages easy to find, scan, compare, translate, and maintain. The interface is minimal, practical, fresh, modern, and restrained, with the content carrying the meaning.

The system is mostly monochrome. Depth comes from subtle gray steps, squircle corners, thin rings, and restrained spacing. It explicitly rejects decorative animations, invented words, artificial meanings, glossy SaaS or marketplace styling, and extra color palettes beyond the existing restrained visual system.

**Key Characteristics:**
- Monochrome semantic tokens with rare functional contrast.
- Catalog-first layouts with compact controls and readable cards.
- Squircle geometry on buttons, chips, cards, search, and menu controls.
- Factual UI copy, localized labels, and no decorative claims.
- No new decorative motion.

## 2. Colors

The palette is a restrained neutral system: black text, white or near-white surfaces, soft gray structure, and one primary ink role for action states.

### Primary
- **Catalog Ink**: The primary action and text color. Use it for primary buttons, active chips, strong links, focus outlines, and the darkest hierarchy.
- **White on Ink**: The inverse text color for active or primary controls.

### Neutral
- **Page White**: The page background, slightly below pure white to reduce glare.
- **Surface White**: Cards, inputs, popovers, and overlays that need a clean foreground plane.
- **Quiet Muted**: Low-contrast control backgrounds and center cards.
- **Soft Structure**: Borders, dividers, rings, underline decoration, and subtle separators.
- **Depth Ramp**: The `depth-100` through `depth-700` ramp creates hierarchy in the homepage hero and supporting surfaces without adding colors.

### Named Rules

**The No Extra Palette Rule.** Do not introduce new color families for decoration. If a new role is required, first map it to `background`, `surface`, `muted`, `subtle`, `border`, `primary`, or `depth-*`.

**The Ink Means Active Rule.** `primary` is reserved for active filters, primary actions, strong text, and focus affordances. Its scarcity keeps the catalog practical.

## 3. Typography

**Display Font:** system sans-serif stack.
**Body Font:** system sans-serif stack.
**Label/Mono Font:** system sans-serif stack.

**Character:** The type system is direct and utilitarian. It uses weight, size, and neutral color depth rather than decorative font choices.

### Hierarchy
- **Display** (700, `text-4xl` to `lg:text-7xl`, tight tracking): Homepage and list hero statements only. Keep display text short enough to avoid overflow on mobile.
- **Headline** (700, large responsive sizes, tight tracking): Major page titles and high-level catalog surfaces.
- **Title** (700, `1rem`, snug line-height): Center card titles and compact headings.
- **Body** (400, `1rem`, readable line-height): MDX content, descriptions, and catalog prose. Keep long prose inside comfortable line lengths.
- **Label** (500, `0.75rem` to `0.875rem`): Buttons, chips, filter labels, menu section labels, metadata, and small controls.

### Named Rules

**The Factual Type Rule.** Use typography to organize real information, not to dramatize it. No invented slogans, no decorative claims, no all-caps body copy.

**The Tight Display Limit.** Display headings may use tight tracking, but never beyond `-0.04em`, and they must remain readable across locales.

## 4. Elevation

The system is flat by default and uses tonal layering first. Shadows are minimal, usually `shadow-2xs`, and paired with subtle rings only when a surface must separate from the page, such as cards, search controls, menu buttons, and suggestion lists.

### Shadow Vocabulary
- **Soft Surface Lift** (`shadow-2xs`): Low lift for center cards, toolbar shells, compact menu buttons, and reset controls.
- **Menu Overlay Lift** (`shadow-md`): Reserved for floating suggestion lists or temporary overlays where a stronger plane distinction is required.

### Named Rules

**The Flat Catalog Rule.** Surfaces should feel calm at rest. Do not add large soft shadows, glass panels, or decorative glow.

## 5. Components

### Buttons
- **Shape:** Squircle rounded controls (`rounded-2xl`, about 16px).
- **Primary:** `bg-primary` with `text-primary-foreground`, compact `px-4 py-2`, medium label weight.
- **Hover / Focus:** Hover darkens or tints the existing token. Focus must remain visible with `focus-visible:outline-primary` or a `primary` ring.
- **Secondary / Ghost:** Ghost buttons stay transparent and use `text-primary` with a low-contrast `hover:bg-primary/5`.

### Chips
- **Style:** Filter chips use `bg-muted`, `text-muted-foreground`, compact padding, squircle corners, and optional count badges.
- **State:** Active chips switch to `bg-primary` and `text-primary-foreground`. Count badges invert with `primary-foreground/15`.

### Cards / Containers
- **Corner Style:** Center cards use large squircle rounding (`rounded-4xl`, about 32px) because it is already part of the catalog identity.
- **Background:** Center cards use `bg-muted`; page and content surfaces use `bg-background`, `bg-surface`, or `bg-surface-muted`.
- **Shadow Strategy:** Use `shadow-2xs` plus a low-opacity `depth-100` ring for quiet separation.
- **Border:** Prefer rings and token borders over colored stripes.
- **Internal Padding:** Center cards use `p-5` to `sm:p-6`.

### Inputs / Fields
- **Style:** Search fields use `bg-surface`, squircle rounding, left search icon, `text-surface-foreground`, and `placeholder:text-subtle-foreground`.
- **Focus:** Use a `primary/25` ring or visible outline. Do not rely on color change alone.
- **Error / Disabled:** Use `destructive` only for real destructive or error states. Disabled states should use `text-muted-foreground` and reduced opacity.

### Navigation
- **Desktop:** Navigation uses compact ghost `ButtonLink` items with icons and localized labels.
- **Mobile:** The menu uses a fixed compact trigger and a full-screen `bg-background/95` overlay. Labels are grouped by practical sections.
- **Footer:** Footer links use underlined text links with `decoration-link-decoration` and small separators.

### Center Card

Center cards are the signature catalog primitive. They combine category icons, location metadata, a divider mark, and the center title in one compact row. The card must stay scannable, truncate gracefully, and preserve locale-aware links.

## 6. Do's and Don'ts

### Do:
- **Do** reuse `src/styles/tailwind.css` semantic tokens before adding any new visual role.
- **Do** keep the catalog useful first: search, filters, cards, locations, and localized routes must remain clear.
- **Do** keep UI copy factual and direct.
- **Do** use squircle geometry where the existing components already use it.
- **Do** preserve readable contrast for muted text, placeholders, and small labels.

### Don't:
- **Don't** add decorative animations.
- **Don't** add invented words, slogans, or artificial meanings.
- **Don't** make the site look like glossy SaaS, a marketplace, or a startup landing page.
- **Don't** introduce extra color palettes beyond the existing restrained visual system.
- **Don't** add side-stripe card accents, gradient text, glassmorphism, huge shadows, or repeated marketing-style card grids.
