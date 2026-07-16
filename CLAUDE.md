# CLAUDE.md

## Git workflow (обязательно)

В этом репозитории параллельно работает **Codex** (в основном чекауте на ветке
`codex-workflow`). Один git-чекаут держит только одну ветку, поэтому Claude
работает в **отдельном worktree**, чтобы не конфликтовать за `HEAD`.

**Рабочая папка Claude:** `../tatarverse-claude` — worktree на ветке **`claude-workflow`**.

- Всю работу веди в worktree `../tatarverse-claude` (ветка `claude-workflow`).
  Если worktree нет — создай:
  `git worktree add ../tatarverse-claude claude-workflow`
  (а если нет и самой ветки — сначала `git branch claude-workflow main`).
- **Не работай и не коммить в основном чекауте** (`.../tatarverse`) — он принадлежит
  Codex (`codex-workflow`). Не переключай там ветку.
- **Никогда не коммить и не пушь в `main`, `develop` или `codex-workflow`.**
  Все изменения Claude — только в `claude-workflow`.
- После завершения логического куска работы сразу коммить всё в `claude-workflow`
  осмысленным сообщением (без запроса подтверждения на сам коммит).
- Не делай merge/rebase в `main` и не открывай PR — мердж в `main` пользователь
  делает сам.
- Пуш в `origin/claude-workflow` — можно; в другие ветки — нет.
