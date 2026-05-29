# Implementation Plan: Ordo Arcanum Design System

## Phase 1 — Design System Foundation
1. Replace `index.css` with full tokens from `tokens.css` (all CSS variables, ao-* classes, animations, grain, panels, buttons, inputs, tabs, chips, stat blocks, bars, slots, tables, seals, scrollbars)
2. Update `index.html` — add Cormorant Garamond + JetBrains Mono fonts (currently only Cinzel + Inter)
3. Update `tailwind.config.ts` — add new color tokens mapping to CSS vars, add font-serif/font-mono families

## Phase 2 — Shared Ordo Components
Create `src/components/ordo/` with reusable primitives matching the design JSX:
- `Rune.tsx` — SVG geometric glyphs (diamond, shield, sword, flame, etc.)
- `Sigil.tsx` — Decorative wax seal
- `OrdoDivider.tsx` — Engraved divider with central glyph
- `OrdoPanel.tsx` — Framed panel with bronze corner brackets
- `PanelHeader.tsx` — Engraved header bar
- `OrdoChip.tsx` — Toned chip (gold/arcane/ember/rune)
- `OrdoBar.tsx` — Resource bar (HP/XP/mana)
- `StatBlock.tsx` — D&D ability score block
- `CodexID.tsx` — Mono-spaced ID display
- `OrdoField.tsx` — Form field with label/hint/count

## Phase 3 — Layout Shell
- `AppShell.tsx` — Left rail nav + top bar + scrollable content area
- `TopBar.tsx` — Title + breadcrumb + right actions
- `Rail.tsx` — Icon navigation rail (68px)
- `Backdrop.tsx` — Atmospheric backdrop with grain + vignette

## Phase 4 — Auth Screens (Login + Register)
Rewrite LoginPage and RegisterPage to match screens-auth.jsx and screens-register.jsx:
- Split-screen layout (left atmospheric + right form panel)
- Gothic typography, ceremonial language
- Framed form panels with corner brackets
- Role selection with ChoiceCard pattern

## Phase 5 — Player Screens
- CharactersListPage → Roster (screens-roster.jsx) — card grid with portrait, HP/XP bars, status glyphs
- CharacterDetailPage → Character Sheet (screens-sheet.jsx) — identity panel, stats, combat, tabs
- LevelUpPage → Progression (screens-progression.jsx) — ceremonial modal, reward selection cards
- Equipment → Arsenal (screens-arsenal.jsx) — paper-doll slots, bag grid, item detail

## Phase 6 — GM Screens
- Teams → Conclaves (screens-teams.jsx) — card grid with sigils, member list with HP bars
- Artifacts → Reliquary (screens-artifacts.jsx) — rarity-glowing cards, forge form
- Conditions → Edicts (screens-conditions.jsx) — modifier tags, apply modal, active ledger
- Arsenal Enchantments (screens-arsenal-enchant.jsx) — slot selection, weave panel

## Phase 7 — Admin Screens
- Reference data → Master Archive (screens-team-admin.jsx) — left sidebar + right table
- Users → Census of Souls (screens-admin-people.jsx) — role badges, filter tabs
- Level Rewards → Tome of Ascension (screens-admin-people.jsx) — timeline grid
- Buffs/Debuffs → Codex of Afflictions (screens-admin-codex.jsx) — effect type badges, duration
- Enchantment Types → Grimoire (screens-admin-codex.jsx) — damage-colored cards

## Phase 8 — Homebrew Marketplace
- Browse → Forbidden Catalogue (screens-market-browse.jsx) — VersionSeal, StatusBadge, tag chips
- Detail → Doctrine Folio (screens-market-detail.jsx) — hero header, content tabs
- Author → Workshop (screens-market-author.jsx) — status tabs, content management
- Installed → Linked Doctrines (screens-market-author.jsx) — redacted indicators
- Admin → Inquisitorial Ledger (screens-market-admin.jsx) — moderation table, tag registry, lifecycle modals
