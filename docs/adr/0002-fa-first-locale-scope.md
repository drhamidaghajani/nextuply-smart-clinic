# 0002. Persian-first build scope

Status: Accepted
Date: 2026-07-01

## Context

Hamid confirmed: "فعلا سایت فارسی رو طراحی می‌کنیم و متناسب با اون محتوا عربی و انگلیسی رو برات می‌فرستم" — build the Persian site first; Arabic/English content will follow once it matches the finished Persian structure.

## Decision

- The `[locale]` route segment and the `i18n/` dictionary structure (SYSTEM_ARCHITECTURE.md §9, FOLDER_STRUCTURE.md §5) are scaffolded for `fa`/`en`/`ar` from the start, so adding a locale later is a content/dictionary change, not a routing rewrite.
- Only `fa` gets real content, real copy, and full QA in this build phase. `en`/`ar` routes exist structurally but are not linked from navigation or launched until their content arrives.
- RTL (`fa`) is therefore the default and primary layout direction validated first; LTR (`en`) support is verified functionally but not content-polished until Phase 2 of this locale rollout.

## Consequences

- Avoids the common mistake of hardcoding RTL-only assumptions that would need undoing when `en` content arrives later.
- Removes English/Arabic copywriting from the current critical path — the homepage can ship on the Persian content already available (dralirezasadighi.com content, see CONTENT_INVENTORY.md) plus whatever new copy Hamid/the client provides in Persian.
