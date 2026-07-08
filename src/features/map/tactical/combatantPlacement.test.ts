import { describe, expect, it } from 'vitest';
import type { BattleCombatantResponse } from '@/types';
import type { MapTokenDto } from '../types';
import {
  buildFromCombatantRequest,
  canPlaceCombatant,
  enterPlacement,
} from './combatantPlacement';
import { deriveTacticalTokens, type TokenCombatLink } from './tacticalView';

function token(over: Partial<MapTokenDto> & { id: string }): MapTokenDto {
  return {
    mapSessionId: 'sess',
    characterId: null,
    ownerUserId: null,
    name: 'Token',
    tokenType: 'MONSTER',
    gridX: 0,
    gridY: 0,
    widthCells: 1,
    heightCells: 1,
    visible: true,
    locked: false,
    elevationFt: 0,
    gmName: null,
    gmNotes: null,
    data: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function combatant(
  over: Partial<BattleCombatantResponse> & { id: string },
): BattleCombatantResponse {
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

describe('canPlaceCombatant', () => {
  it('allows the GM and admin', () => {
    expect(canPlaceCombatant('GAME_MASTER')).toBe(true);
    expect(canPlaceCombatant('ADMIN')).toBe(true);
  });

  it('forbids a player from placing (including monsters)', () => {
    expect(canPlaceCombatant('PLAYER')).toBe(false);
    expect(canPlaceCombatant(null)).toBe(false);
    expect(canPlaceCombatant(undefined)).toBe(false);
  });
});

describe('enterPlacement', () => {
  it('enters PLACE_COMBATANT mode for the chosen combatant (default 1×1)', () => {
    expect(enterPlacement('cmb-7')).toEqual({
      mode: 'PLACE_COMBATANT',
      combatantId: 'cmb-7',
      widthCells: 1,
      heightCells: 1,
    });
  });

  it('carries the GM-chosen creature size', () => {
    expect(enterPlacement('cmb-7', 3, 3)).toEqual({
      mode: 'PLACE_COMBATANT',
      combatantId: 'cmb-7',
      widthCells: 3,
      heightCells: 3,
    });
  });
});

describe('buildFromCombatantRequest', () => {
  it('carries battleId, combatantId and grid coordinates', () => {
    const req = buildFromCombatantRequest('bat-1', 'cmb-2', { gridX: 10, gridY: 8 });
    expect(req).toEqual({ battleId: 'bat-1', combatantId: 'cmb-2', gridX: 10, gridY: 8 });
  });

  it('sends grid coordinates ONLY — never pixel/image/viewport coords', () => {
    const cell = { gridX: 3, gridY: 4, screenX: 512, screenY: 256, imageX: 999, imageY: 111 };
    const req = buildFromCombatantRequest('bat-1', 'cmb-2', cell as never);
    expect(Object.keys(req).sort()).toEqual(['battleId', 'combatantId', 'gridX', 'gridY']);
    const serialized = JSON.stringify(req);
    expect(serialized).not.toContain('screen');
    expect(serialized).not.toContain('image');
    expect(serialized).not.toContain('512');
  });

  it('links a placed monster by its instance combatantId, not its monsterId', () => {
    const req = buildFromCombatantRequest('bat-1', 'cmb-goblin-2', { gridX: 1, gridY: 1 });
    expect(req.combatantId).toBe('cmb-goblin-2');
    expect(JSON.stringify(req)).not.toContain('monsterId');
  });
});

describe('deriveTacticalTokens with a freshly created link', () => {
  it('surfaces a newly placed monster token in the derived view via its link', () => {
    const combatants = [
      combatant({
        id: 'cmb-goblin-2',
        type: 'MONSTER',
        monsterId: 'goblin',
        instanceIndex: 2,
        displayName: 'Гоблин 2',
        currentHp: 5,
        maxHp: 7,
      }),
    ];
    const tokens = [token({ id: 'tok-new', tokenType: 'MONSTER', characterId: null, name: '' })];
    const links: TokenCombatLink[] = [
      {
        tokenId: 'tok-new',
        externalBattleId: 'bat-1',
        externalCombatantId: 'cmb-goblin-2',
        combatantType: 'MONSTER',
        externalMonsterId: 'goblin',
        displayName: 'Гоблин 2',
      },
    ];
    const [view] = deriveTacticalTokens({
      tokens,
      combatants,
      tokenCombatLinks: links,
      currentUserId: null,
    });
    expect(view.linkedCombatantId).toBe('cmb-goblin-2');
    expect(view.combatant?.id).toBe('cmb-goblin-2');
    expect(view.displayName).toBe('Гоблин 2');
    expect(view.currentHp).toBe(5);
    expect(view.maxHp).toBe(7);
  });
});
