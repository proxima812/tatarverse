---
name: tt-xima-design-review
description: Use when auditing or improving the design system, visual consistency, reusable component patterns, token usage, and UI cohesion in tt.xima.work.
---

# TT Xima Design Review

Use this skill when the task is to assess or tighten the project's design system.

## Current System Snapshot

The project already has the beginnings of a design system:

- global tokens in `src/styles/tailwind.css`
- a shared container component
- a shared button component
- a shared center card component
- repeatable chip/filter patterns
- a stable neutral palette with one accent family

This is a lightweight component system, not yet a fully normalized design system.

## Strengths

- Consistent neutral base palette across layout, cards, filters, and text
- Repeated use of the same rounded-squircle shape language
- Clear separation between layout shell, content cards, and filter controls
- Tokenized accent color instead of many ad hoc accent colors
- Reasonable component boundaries for cards, buttons, and container

## Weak Points To Check

- shared patterns are partially duplicated instead of fully abstracted
- some styling lives in components, some in global `is:global` blocks
- button/chip/link treatments are close to each other but not unified
- hero typography uses bespoke effects that do not generalize to the rest of the UI
- docs contain stale project-path guidance, which can produce bad future edits

## Review Heuristics

When reviewing, check these in order:

1. Are tokens reused before raw color values or one-off treatments?
2. Does a new element match existing radius, border, ring, and spacing patterns?
3. Should a repeated pattern become a shared UI component?
4. Is the expressive homepage style leaking into utilitarian list/detail screens?
5. Did the change improve consistency without forcing a redesign?

## Preferred Direction

- Keep the current monochrome editorial feel.
- Consolidate repeated chip/button styles gradually.
- Expand tokens only when a second real use case appears.
- Avoid broad refactors unless the user asks for a system pass.
