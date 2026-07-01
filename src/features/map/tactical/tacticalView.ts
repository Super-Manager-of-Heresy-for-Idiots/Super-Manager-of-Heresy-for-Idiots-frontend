/**
 * Derived tactical view model — the read-only bridge between core-BE battle state
 * and map-service spatial state. It is COMPUTED on every render from:
 *
 *   map tokens (committed store)  +  battle combatants (React Query)  +  token↔combatant links
 *
 * and is never persisted as independent state (combat HP/turn stays owned by the
 * battle query; token positions stay owned by the committed map store).
 *
 * Token↔combatant linkage: the map-service will expose explicit `tokenCombatLinks`
 * (frontend prompt 03 / map-service prompt 02). Until that lands, we fall back to
 * matching a CHARACTER token's `characterId` to a CHARACTER combatant's
 * `characterId`. Monster instances cannot be linked by `monsterId` (the same
 * monster may appear several times) — they only link once explicit links exist.
 */

import type { BattleCombatantResponse } from '@/types';
import type { MapTokenDto } from '../types';

/**
 * Bridge record between a spatial token and a core battle combatant. Mirrors the
 * map-service `TokenCombatLink` DTO (added by map-service prompt 02); optional
 * fields are present so the snapshot shape can grow without breaking this model.
 */
export interface TokenCombatLink {
  tokenId: string;
  externalBattleId?: string;
  externalCombatantId: string;
  combatantType?: 'CHARACTER' | 'MONSTER' | 'NPC';
  externalCharacterId?: string | null;
  externalMonsterId?: string | null;
  displayName?: string;
}

/** One token, enriched with its linked combatant's combat facts (if any). */
export interface TacticalTokenView {
  tokenId: string;
  gridX: number;
  gridY: number;
  tokenType: string;
  linkedCombatantId: string | null;
  combatant: BattleCombatantResponse | null;
  displayName: string;
  currentHp?: number;
  maxHp?: number;
  currentTurn: boolean;
  isOwnedByCurrentUser: boolean;
  isPlaced: boolean;
}

/**
 * Resolve the combatant id a token is linked to. Prefers an explicit link;
 * otherwise falls back to CHARACTER `characterId` matching. Returns `null` for
 * tokens with no resolvable combatant (objects, markers, unlinked monsters).
 */
export function resolveLinkedCombatantId(
  token: MapTokenDto,
  combatants: BattleCombatantResponse[],
  links?: TokenCombatLink[],
): string | null {
  const explicit = links?.find((l) => l.tokenId === token.id);
  if (explicit) return explicit.externalCombatantId;

  if (token.characterId) {
    const match = combatants.find(
      (c) => c.type === 'CHARACTER' && c.characterId === token.characterId,
    );
    return match?.id ?? null;
  }
  return null;
}

export interface DeriveTacticalTokensInput {
  tokens: MapTokenDto[];
  combatants: BattleCombatantResponse[];
  tokenCombatLinks?: TokenCombatLink[];
  currentUserId: string | null;
}

/** Build one {@link TacticalTokenView} per map token. */
export function deriveTacticalTokens({
  tokens,
  combatants,
  tokenCombatLinks,
  currentUserId,
}: DeriveTacticalTokensInput): TacticalTokenView[] {
  const byId = new Map(combatants.map((c) => [c.id, c]));

  return tokens.map((token) => {
    const linkedCombatantId = resolveLinkedCombatantId(token, combatants, tokenCombatLinks);
    const combatant = linkedCombatantId ? byId.get(linkedCombatantId) ?? null : null;
    const link = tokenCombatLinks?.find((l) => l.tokenId === token.id);

    const ownedByToken = !!currentUserId && token.ownerUserId === currentUserId;
    const ownedByCombatant = !!currentUserId && combatant?.ownerUserId === currentUserId;

    return {
      tokenId: token.id,
      gridX: token.gridX,
      gridY: token.gridY,
      tokenType: token.tokenType,
      linkedCombatantId,
      combatant,
      // Step 6 precedence: live combatant name → token name → link's snapshot name.
      displayName: combatant?.displayName || token.name || link?.displayName || '',
      currentHp: combatant?.currentHp ?? undefined,
      maxHp: combatant?.maxHp ?? undefined,
      currentTurn: combatant?.currentTurn ?? false,
      isOwnedByCurrentUser: ownedByToken || ownedByCombatant,
      isPlaced: true,
    };
  });
}

/**
 * Combatants that have NOT yet been placed as a token on the map. Drives the
 * left-panel "Place" affordance (frontend prompt 03); a combatant counts as
 * placed once any token resolves to its id.
 */
export function unplacedCombatants(
  combatants: BattleCombatantResponse[],
  tokens: MapTokenDto[],
  tokenCombatLinks?: TokenCombatLink[],
): BattleCombatantResponse[] {
  const placed = new Set<string>();
  for (const token of tokens) {
    const id = resolveLinkedCombatantId(token, combatants, tokenCombatLinks);
    if (id) placed.add(id);
  }
  return combatants.filter((c) => !placed.has(c.id));
}

/** The combatant whose turn it currently is, or `null` between/outside turns. */
export function currentTurnCombatant(
  combatants: BattleCombatantResponse[],
): BattleCombatantResponse | null {
  return combatants.find((c) => c.currentTurn) ?? null;
}
