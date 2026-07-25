import type { OrdoInterfaceIconKey } from '@/components/ordo';

/**
 * Navigation map of `/campaigns/:campaignId`, in one place.
 *
 * Two surfaces read from here and only from here:
 *  - {@link CAMPAIGN_TABS} — the persistent top strip, kept short on purpose:
 *    only screens used *during* a session.
 *  - {@link CAMPAIGN_TILE_GROUPS} — the Overview page, where every remaining
 *    section lives, grouped by purpose.
 *
 * Because both come from the same list, a section can never be visible in one
 * surface and role-hidden in the other.
 */

export interface CampaignSection {
  /** Path relative to `/campaigns/:campaignId` (empty string = Overview). */
  to: string;
  labelKey: string;
  icon: OrdoInterfaceIconKey;
  /** Decorative rune used by the Overview tiles. */
  glyph: string;
  /** Visible to GM/ADMIN only. */
  gm?: boolean;
  /** Visible to plain players only. */
  player?: boolean;
  /** Match the index route exactly (no prefix matching). */
  end?: boolean;
  /** Counter rendered on the Overview tile. */
  count?: 'members';
}

export interface CampaignSectionGroup {
  titleKey: string;
  gm?: boolean;
  sections: CampaignSection[];
}

/** Persistent top tabs — the screens a table actually uses mid-session. */
export const CAMPAIGN_TABS: CampaignSection[] = [
  { to: '', labelKey: 'camp.nav.overview', icon: 'campaign', glyph: 'helm', end: true },
  { to: 'my', labelKey: 'camp.nav.myHero', icon: 'character', glyph: 'helm', player: true },
  { to: 'world', labelKey: 'camp.dash.drill.world', icon: 'location', glyph: 'sigil-3' },
  { to: 'battle', labelKey: 'battle.tabLabel', icon: 'battle', glyph: 'sword' },
  { to: 'camp', labelKey: 'campfire.nav', icon: 'resource-restored', glyph: 'flame' },
  { to: 'checks', labelKey: 'camp.dash.drill.checks', icon: 'ability-check', glyph: 'sigil-1', gm: true },
];

/** Everything else — reachable in one click from the Overview. */
export const CAMPAIGN_TILE_GROUPS: CampaignSectionGroup[] = [
  {
    titleKey: 'camp.dash.group.party',
    sections: [
      {
        to: 'members',
        labelKey: 'camp.dash.drill.roster',
        icon: 'character-in-campaign',
        glyph: 'helm',
        count: 'members',
      },
      { to: 'storage', labelKey: 'camp.dash.drill.storage', icon: 'shared-storage', glyph: 'sword' },
    ],
  },
  {
    titleKey: 'camp.dash.group.lore',
    sections: [
      { to: 'bestiary', labelKey: 'camp.dash.drill.bestiary', icon: 'bestiary', glyph: 'sword' },
      { to: 'items', labelKey: 'camp.dash.drill.items', icon: 'item', glyph: 'coin' },
    ],
  },
  {
    titleKey: 'camp.dash.group.story',
    gm: true,
    sections: [
      { to: 'npcs', labelKey: 'camp.dash.drill.npcs', icon: 'npc', glyph: 'sigil-1', gm: true },
      { to: 'quests', labelKey: 'camp.dash.drill.quests', icon: 'quest', glyph: 'scroll', gm: true },
      { to: 'notes', labelKey: 'camp.dash.drill.notes', icon: 'session-note', glyph: 'lock', gm: true },
    ],
  },
  {
    titleKey: 'camp.dash.group.manage',
    gm: true,
    sections: [
      { to: 'xp', labelKey: 'camp.dash.drill.grantXp', icon: 'reward-xp', glyph: 'flame', gm: true },
      { to: 'wallet', labelKey: 'camp.dash.drill.balances', icon: 'wallet', glyph: 'coin', gm: true },
      { to: 'invite', labelKey: 'camp.dash.drill.invite', icon: 'friend-request', glyph: 'cross-pat', gm: true },
      { to: 'homebrew', labelKey: 'camp.dash.drill.homebrew', icon: 'homebrew-package', glyph: 'scroll', gm: true },
    ],
  },
];

/** GM sub-tabs of the World section (`/campaigns/:campaignId/world/*`). */
export const WORLD_TABS: CampaignSection[] = [
  { to: '', labelKey: 'camp.world.tab.overview', icon: 'location', glyph: 'sigil-3', end: true },
  { to: 'locations', labelKey: 'camp.dash.drill.locations', icon: 'location', glyph: 'sigil-3', gm: true },
  { to: 'maps', labelKey: 'camp.dash.drill.maps', icon: 'map', glyph: 'sigil-2', gm: true },
  { to: 'manage', labelKey: 'camp.world.tab.manage', icon: 'location', glyph: 'sigil-3', gm: true },
];

/** Character sub-tabs (`/campaigns/:campaignId/characters/:characterId/*`). */
export const CHARACTER_TABS: CampaignSection[] = [
  { to: '', labelKey: 'camp.char.tab.folio', icon: 'character', glyph: 'helm', end: true },
  { to: 'inventory', labelKey: 'camp.char.tab.inventory', icon: 'item', glyph: 'sword' },
  { to: 'wallet', labelKey: 'camp.char.tab.wallet', icon: 'wallet', glyph: 'coin' },
  { to: 'resources', labelKey: 'camp.char.tab.resources', icon: 'resource', glyph: 'flame' },
  { to: 'rewards', labelKey: 'camp.char.tab.rewards', icon: 'reward-xp', glyph: 'sigil-1' },
  { to: 'effects', labelKey: 'camp.char.tab.effects', icon: 'active-effect', glyph: 'sigil-2' },
];

/** Drop entries the current role must not see. */
export function visibleSections<T extends { gm?: boolean; player?: boolean }>(
  sections: T[],
  isGm: boolean,
): T[] {
  return sections.filter((s) => (!s.gm || isGm) && (!s.player || !isGm));
}
