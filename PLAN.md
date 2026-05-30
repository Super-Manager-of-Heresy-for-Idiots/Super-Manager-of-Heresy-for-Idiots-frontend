# Plan: Frontend v2 — New Role Model Integration

## Overview

Extend the Ordo Arcanum frontend with Campaigns (replacing Teams), Character v2 (multiclass, HP, wallet, resources, effects), item instances, GM narrative tools (NPC/quests/locations/session-notes), XP grant, Homebrew v2 (versions/ratings/library), and WebSocket real-time updates.

**Approach**: by sections, new files alongside old (Teams preserved), install WebSocket packages.

**Backend state**: Swagger currently shows only v1 endpoints (Teams, Characters, Conditions, Artifacts, Homebrew). New Campaign/HP/NPC/WebSocket endpoints are not yet deployed. We build the frontend to the target contract from PROMPT_FRONTEND.md; API calls will 404 until backend catches up, but the UI will be ready.

---

## Phase 1: Foundation (Types + API + Missing Ordo Components)

### 1.1 TypeScript Types (`src/types/index.ts`)
Add all new types from PROMPT_FRONTEND.md section 10:
- `CampaignStatus`, `CampaignResponse`, `CampaignMember`
- `CharacterStatus`, updated `CharacterResponse` (HP, wallet, resources, activeEffects)
- `ClassLevel`, `WalletEntry`, `ResourceEntry`
- `ItemInstance`, `RenameMode`
- `ActiveEffect`
- `AbilityCheckResult`
- `GrantXpRequest`
- `WsEventType`, `WsEvent<T>`
- `HomebrewStatusV2`, `HomebrewRating`
- NPC types: `NpcResponse`, `NpcNoteResponse`
- Quest types: `QuestResponse`, `QuestStatus`, `QuestNoteResponse`
- Location types: `LocationResponse`
- Session note types: `SessionNoteResponse`
- Shared storage types: `StorageContainerResponse`, `StorageItemResponse`

### 1.2 API Modules (new files in `src/api/`)

**`campaigns.api.ts`** — all Campaign endpoints:
- `list()`, `getById(id)`, `create(data)`, `update(id, data)`
- `setStatus(id, status)`, `join(inviteCode)`, `leave(id)`
- `getInviteCode(id)`, `regenerateInvite(id)`
- `kickMember(id, userId)`, `reassignCharacter(id, charId, newOwnerId)`
- `getStorage(id)`, `createContainer(id, name)`, `addStorageItem(id, sid, data)`

**`characters-v2.api.ts`** — character v2 endpoints:
- `createInCampaign(cid, data)`, `listInCampaign(cid)`
- `setStatus(id, status)`, `updateHp(id, delta)`
- `getWallet(id)`, `updateWallet(id, currencyTypeId, delta)`
- `getResources(id)`, `updateResource(id, resourceTypeId, value)`
- `abilityCheck(id, statId)`

**`effects.api.ts`** — active effects:
- `list(charId)`, `apply(charId, data)`, `remove(charId, effectId)`

**`inventory-v2.api.ts`** — item instances:
- `list(charId)`, `grant(charId, data)`, `remove(charId, instanceId)`
- `equip(charId, instanceId, slot)`, `rename(charId, instanceId, data)`
- `transfer(cid, fromCharId, instanceId, toCharacterId)`
- `getEnchantments(charId, instanceId)`, `addEnchantment(...)`, `removeEnchantment(...)`

**`npcs.api.ts`** — NPC CRUD + notes + visibility
**`quests.api.ts`** — Quest CRUD + notes
**`locations.api.ts`** — Location CRUD
**`session-notes.api.ts`** — GM session notes CRUD
**`xp.api.ts`** — XP grant
**`homebrew-v2.api.ts`** — library, attach, pin version, override, rating

### 1.3 React Query Hooks (`src/hooks/`)

Create hook files mirroring each API module:
- `useCampaigns.ts` — queries + mutations for campaigns
- `useCharacterV2.ts` — HP, wallet, resources, status, ability check
- `useEffects.ts` — active effects
- `useInventoryV2.ts` — item instances
- `useNpcs.ts`, `useQuests.ts`, `useLocations.ts`, `useSessionNotes.ts`
- `useXp.ts`
- `useHomebrewV2.ts` — library, attach, rating, version pin

### 1.4 Missing Ordo Components

Create components referenced in mockups but missing from `src/components/ordo/`:
- **`Bar`** — HP/XP progress bar with tone variants (gold, arcane, ember)
- **`ModalScene`** — ceremonial modal wrapper (codexId, overline, title, sub, rune, tone, danger, width, footer, children)
- **`Field`** — form field (extends OrdoField with count, hint — may already be OrdoField, check)
- **`EmptyVault`** — empty state placeholder (glyph, overline, title, body, action)
- **`RoleBadge`** — GM/PLAYER role badge
- **`ModifierTag`** — stat modifier tag (+2 STR / -1 DEX) with color
- **`CodexID`** — monospace ID display (may already exist in homebrew)
- **`StatBlock`** — stat card (label, value, modifier)
- **`DamageBadge`** — dice + type + bonus display
- **`Placeholder`** — generic placeholder box (for portraits etc.)

Update `src/components/ordo/index.ts` to export all new components.

---

## Phase 2: Campaign Screens (replace Teams)

### 2.1 New Pages (`src/pages/gm/campaigns/`)
- **`CampaignListPage.tsx`** — list of campaigns (like GmTeamsListPage but for campaigns)
- **`CampaignDashboardPage.tsx`** — dashboard with header, status switch, drill blocks, roster summary
- **`CampaignMembersPage.tsx`** — members list with kick
- **`CampaignInvitePage.tsx`** — invite code panel, GM vs player view
- **`SharedStoragePage.tsx`** — campaign containers

### 2.2 Campaign Components (`src/components/campaigns/`)
- `CampaignStatusPill.tsx` — ACTIVE/PAUSED/COMPLETED pill
- `StatusSwitch.tsx` — segmented status switch (creator only)
- `CharStatusBadge.tsx` — ACTIVE/DEAD/RESERVE/DOWN badge
- `RosterRow.tsx` — character row in campaign roster
- `DrillBlock.tsx` — navigation tile (NPC/Quests/Locations/Storage/Notes)
- `MemberRow.tsx` — member list row
- `InvitePanelCard.tsx` — invite code card
- `StorageContainer.tsx` — shared storage container card
- `QuickAction.tsx` — icon button for GM actions

### 2.3 Campaign Modals
- `ChangeCampaignStatusModal.tsx`
- `KickMemberModal.tsx`
- `ReassignCharacterModal.tsx`

---

## Phase 3: Character v2 Panels

### 3.1 New Components (`src/components/characters/v2/`)
- `MulticlassPanel.tsx` — class levels display
- `HPRailPanel.tsx` — HP bar + damage/heal controls
- `WalletPanel.tsx` — currencies list with ± controls
- `ResourcesPanel.tsx` — custom resources with bars
- `AbilityCheckPanel.tsx` — check result breakdown
- `StatusControlPanel.tsx` — GM status selector
- `ReadOnlyOverlay.tsx` — overlay for DEAD/RESERVE characters

### 3.2 Modals
- `DamageHealModal.tsx` — damage/heal modal

### 3.3 Pages
- `CharacterFolioPage.tsx` — integrating all v2 panels (multiclass, HP, wallet, resources, stats with ability checks, status)

---

## Phase 4: Items — Instances, Stacking, Transfer

### 4.1 Components (`src/components/items/`)
- `InvRow.tsx` — inventory row (instance with rarity, slot, source tag)
- `ItemTemplateEditor.tsx` — template form with live preview

### 4.2 Modals
- `GrantItemModal.tsx` — GM grants item from template
- `ItemTransferModal.tsx` — transfer to campaign member
- `RenameStackModal.tsx` — whole-stack vs split-one

### 4.3 Pages
- `InventoryV2Page.tsx` — full instance-based inventory

---

## Phase 5: GM Tools (XP, Effects, Session Notes)

### 5.1 Pages (`src/pages/gm/`)
- `XPGrantPage.tsx` — XP grant with ALL/SELECTED/SINGLE + threshold preview
- `ApplyEffectPage.tsx` — buff/debuff picker + active effects ledger
- `SessionNotesPage.tsx` — GM-only private notes

### 5.2 Components
- `EffectRow.tsx` — active effect with round timer
- `XPCharRow.tsx` — character in XP grant list

### 5.3 Modals
- `GrantXPModal.tsx`
- `ApplyRemoveEffectModal.tsx`

---

## Phase 6: GM Narrative (NPC, Quests, Locations)

### 6.1 Pages (`src/pages/gm/narrative/`)
- `NPCManagerPage.tsx` — NPC list with visibility toggles
- `NPCDetailPage.tsx` — NPC detail + notes feed + linked quests/locations
- `QuestManagerPage.tsx` — quest table with status/visibility
- `QuestDetailPage.tsx` — quest detail + rewards + linked entities + status setter
- `LocationsPage.tsx` — location grid

### 6.2 Components (`src/components/narrative/`)
- `VisibilityToggle.tsx`
- `QuestStatusBadge.tsx`
- `NpcCard.tsx`
- `NoteEntry.tsx`

---

## Phase 7: Homebrew v2

### 7.1 Components (`src/components/homebrew/`)
- `RatingControl.tsx` — like/dislike with net display

### 7.2 Pages (extend existing or add)
- `VersionManagerPage.tsx` — pinned version selector + history
- `OverrideCreatorPage.tsx` — child package creation
- `HomebrewLibraryPage.tsx` — my library + attach to campaign
- Update `MarketplaceBrowsePage.tsx` — add ratings, sort by rating, ARCHIVED state

---

## Phase 8: WebSocket (Real-time)

### 8.1 Install Dependencies
```
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client
```

### 8.2 WebSocket Service (`src/lib/websocket.ts`)
- STOMP client setup over SockJS
- JWT in connect headers/query
- Auto-reconnect with exponential backoff
- Subscribe/unsubscribe management
- Connection state tracking

### 8.3 WebSocket Hook (`src/hooks/useWebSocket.ts`)
- `useWebSocket(campaignId)` — connects, subscribes, handles events
- Event dispatcher that invalidates React Query caches
- Toast display for each event type

### 8.4 Real-time Components (`src/components/realtime/`)
- `EventToast.tsx` — styled toast for WS events
- `ConnectionSigil.tsx` — connection state indicator
- `NotificationsFeed.tsx` — private notification queue

### 8.5 WebSocket Store (`src/store/wsStore.ts`)
- Zustand store for connection state, notification feed, unread count

---

## Phase 9: Routing + Integration

### 9.1 Update Router (`src/router.tsx`)
Add new routes:
```
/gm/campaigns                          → CampaignListPage
/gm/campaigns/:id                      → CampaignDashboardPage
/gm/campaigns/:id/members              → CampaignMembersPage
/gm/campaigns/:id/invite               → CampaignInvitePage
/gm/campaigns/:id/storage              → SharedStoragePage
/gm/campaigns/:id/npcs                 → NPCManagerPage
/gm/campaigns/:id/npcs/:nid            → NPCDetailPage
/gm/campaigns/:id/quests               → QuestManagerPage
/gm/campaigns/:id/quests/:qid          → QuestDetailPage
/gm/campaigns/:id/locations            → LocationsPage
/gm/campaigns/:id/notes                → SessionNotesPage
/gm/campaigns/:id/xp                   → XPGrantPage
/gm/campaigns/:id/characters/:charId/effects    → ApplyEffectPage
/gm/campaigns/:id/characters/:charId/inventory  → InventoryV2Page
/characters/:id/folio                   → CharacterFolioPage (v2)
/gm/homebrew/library                    → HomebrewLibraryPage
/gm/homebrew/versions/:id               → VersionManagerPage
/gm/homebrew/override/new               → OverrideCreatorPage
```

### 9.2 Campaign Layout
- Create `CampaignLayout.tsx` with campaign-specific sidebar nav (CAMPAIGN_NAV)
- Nested routes under `/gm/campaigns/:id/*`

---

## File Count Estimate
- ~12 new API modules
- ~12 new hook files
- ~10 new Ordo components
- ~15 new page files
- ~25 new component files
- ~5 modal files
- ~3 store/service files
- Router update + Types update

**Total: ~80+ new/modified files**

## Execution Order
Phases 1→2→3→4→5→6→7→8→9 sequentially. Each phase is self-contained.
