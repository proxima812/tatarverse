# CODEX.md

## Purpose
This file is the local working note for Codex in this project.
It complements `CLAUDE.md` and does not replace it.
Both instruction files should be respected together.

## Collaboration Rules
- Do not edit `CLAUDE.md` unless the user explicitly asks.
- Treat `CLAUDE.md` as shared project guidance.
- Treat this file as Codex-specific execution guidance.
- If instructions conflict, follow the user's latest direct request first, then the stricter project rule.

## Project Approach
- Keep changes minimal and tightly scoped.
- Do not touch unrelated files.
- Preserve the current architecture, naming, and UI unless the user asks otherwise.
- Prefer existing project patterns over new abstractions.
- Use Tailwind-first styling when styling changes are required.

## Validation
- Prefer lightweight validation.
- Do not run full builds by default.
- Report any skipped validation briefly in the final message.

## Response Style
- Keep responses short and practical.
- State what changed, what was checked, and any real risk.
- Offer concise next improvements only when they are clearly useful.
