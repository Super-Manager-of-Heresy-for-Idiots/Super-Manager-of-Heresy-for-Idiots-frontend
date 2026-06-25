import { describe, expect, it } from 'vitest';
import type { BattleCombatantResponse } from '@/types';
import type { MapTokenDto } from '../types';
import {
  currentTurnCombatant,
  deriveTacticalTokens,
  resolveLinkedCombatantId,
  unplacedCombatants,
  type TokenCombatLink,
} from './tacticalView';

function token(over: Partial<MapTokenDto> & { id: string }): MapTokenDto {
  return {
    mapSessionId: 'sess',
    characterId: null,
    ownerUserId: null,
    name: 'Token',
    tokenType: 'CHARACTER',
    gridX: 0,
    gridY: 0,
    widthCells: 1,
    heightCells: 1,
    visible: true,
    locked: false,
    data: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function combatant(over: Partial<BattleCombatantResponse> & { id: string }): BattleCombatantResponse {
  return {
    type: 'CHARACTER',
    displayName: 'Hero',
    monsterId: null,
    characterId: null,
    ownerUserId: null,
    instanceIndex: 1,
    initiative: 10,
    initiativeRoll: 10,
    turnOrder: 0,
    currentHp: 10,
    maxHp: 10,
    currentTurn: false,
    ...over,
  } as BattleCombatantResponse;
}

describe('resolveLinkedCombatantId', () => {
  it('prefers an explicit token-combat link', () => {
    const t = token({ id: 'tok1', characterId: 'char-X' });
    const combatants = [combatant({ id: 'cmb-char', characterId: 'char-X' })];
    const links: TokenCombatLink[] = [{ tokenId: 'tok1', externalCombatantId: 'cmb-explicit' }];
    expect(resolveLinkedCombatantId(t, combatants, links)).toBe('cmb-explicit');
  });

  it('falls back to characterId matching for CHARACTER tokens', () => {
    const t = token({ id: 'tok1', characterId: 'char-X' });
    const combatants = [combatant({ id: 'cmb-char', characterId: 'char-X' })];
    expect(resolveLinkedCombatantId(t, combatants)).toBe('cmb-char');
  });

  it('returns null for an unlinked object/marker token', () => {
    const t = token({ id: 'tok1', tokenType: 'OBJECT', characterId: null });
    expect(resolveLinkedCombatantId(t, [combatant({ id: 'c1' })])).toBeNull();
  });
});

describe('deriveTacticalTokens', () => {
  it('links a token to its combatant and surfaces combat facts', () => {
    const tokens = [token({ id: 'tok1', characterId: 'char-X', gridX: 4, gridY: 7 })];
    const combatants = [
      combatant({
        id: 'cmb1',
        characterId: 'char-X',
        displayName: 'Aria',
        currentHp: 6,
        maxHp: 12,
        currentTurn: true,
      }),
    ];
    const [view] = deriveTacticalTokens({ tokens, combatants, currentUserId: null });
    expect(view.linkedCombatantId).toBe('cmb1');
    expect(view.combatant?.id).toBe('cmb1');
    expect(view.displayName).toBe('Aria');
    expect(view.currentHp).toBe(6);
    expect(view.maxHp).toBe(12);
    expect(view.currentTurn).toBe(true);
    expect(view.gridX).toBe(4);
    expect(view.gridY).toBe(7);
    expect(view.isPlaced).toBe(true);
  });

  it('shows unlinked tokens with their own name and no combatant', () => {
    const tokens = [token({ id: 'tok1', tokenType: 'MARKER', name: 'Trap', characterId: null })];
    const [view] = deriveTacticalTokens({ tokens, combatants: [], currentUserId: null });
    expect(view.linkedCombatantId).toBeNull();
    expect(view.combatant).toBeNull();
    expect(view.displayName).toBe('Trap');
    expect(view.currentTurn).toBe(false);
  });

  it('marks ownership from the token owner', () => {
    const tokens = [token({ id: 'tok1', ownerUserId: 'user-1' })];
    const [view] = deriveTacticalTokens({ tokens, combatants: [], currentUserId: 'user-1' });
    expect(view.isOwnedByCurrentUser).toBe(true);
  });

  it('marks ownership from the linked combatant owner', () => {
    const tokens = [token({ id: 'tok1', characterId: 'char-X', ownerUserId: null })];
    const combatants = [combatant({ id: 'cmb1', characterId: 'char-X', ownerUserId: 'user-1' })];
    const [view] = deriveTacticalTokens({ tokens, combatants, currentUserId: 'user-1' });
    expect(view.isOwnedByCurrentUser).toBe(true);
  });
});

describe('unplacedCombatants', () => {
  it('detects combatants without a token, and treats linked ones as placed', () => {
    const combatants = [
      combatant({ id: 'cmb1', characterId: 'char-A' }),
      combatant({ id: 'cmb2', characterId: 'char-B' }),
    ];
    const tokens = [token({ id: 'tok1', characterId: 'char-A' })];
    const unplaced = unplacedCombatants(combatants, tokens);
    expect(unplaced.map((c) => c.id)).toEqual(['cmb2']);
  });

  it('links monster instances only by explicit combatant id, never monsterId', () => {
    const combatants = [
      combatant({ id: 'cmb1', type: 'MONSTER', characterId: null, monsterId: 'gob', instanceIndex: 1 }),
      combatant({ id: 'cmb2', type: 'MONSTER', characterId: null, monsterId: 'gob', instanceIndex: 2 }),
    ];
    // A monster token carries no characterId; without an explicit link both stay unplaced.
    const tokens = [token({ id: 'tok1', tokenType: 'MONSTER', characterId: null })];
    expect(unplacedCombatants(combatants, tokens).map((c) => c.id)).toEqual(['cmb1', 'cmb2']);

    // With an explicit link, exactly that instance becomes placed.
    const links: TokenCombatLink[] = [{ tokenId: 'tok1', externalCombatantId: 'cmb2' }];
    expect(unplacedCombatants(combatants, tokens, links).map((c) => c.id)).toEqual(['cmb1']);
  });
});

describe('currentTurnCombatant', () => {
  it('returns the combatant whose turn it is', () => {
    const combatants = [
      combatant({ id: 'cmb1', currentTurn: false }),
      combatant({ id: 'cmb2', currentTurn: true }),
    ];
    expect(currentTurnCombatant(combatants)?.id).toBe('cmb2');
  });

  it('returns null when no one is acting', () => {
    expect(currentTurnCombatant([combatant({ id: 'cmb1' })])).toBeNull();
  });
});
