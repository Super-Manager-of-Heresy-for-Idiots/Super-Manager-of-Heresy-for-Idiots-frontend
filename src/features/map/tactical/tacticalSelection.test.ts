/**
 * Frontend prompt 04 — target inspector & combat actions.
 *
 * These are pure-logic/contract tests (no @testing-library/react in this repo).
 * They lock the parts the prompt cares about: the selection model, the combat
 * request shapes (core battle API only — no map-service, no pixel coords), the
 * HP/turn read path through the derived view, and the "no dev-preview mocks"
 * guard. Component-only behaviours (DOM rendering of the inspector) are exercised
 * indirectly through the selection + derivation helpers the components consume.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { BattleCombatantResponse, CombatantTurnResponse } from '@/types';
import type { MapTokenDto } from '../types';
import {
  attackNamesFromTurn,
  buildAttackRequest,
  buildHpDeltaRequest,
  gridChebyshevDistance,
  resolveSelectedTarget,
} from './tacticalSelection';
import { deriveTacticalTokens, type TacticalTokenView, type TokenCombatLink } from './tacticalView';

const here = dirname(fileURLToPath(import.meta.url));

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

function viewFor(token: MapTokenDto, combatants: BattleCombatantResponse[], links: TokenCombatLink[]) {
  return deriveTacticalTokens({ tokens: [token], combatants, tokenCombatLinks: links, currentUserId: null })[0];
}

const goblinLink: TokenCombatLink = {
  tokenId: 'tok-gob',
  externalBattleId: 'bat-1',
  externalCombatantId: 'cmb-gob',
  combatantType: 'MONSTER',
  externalMonsterId: 'goblin',
  displayName: 'Гоблин',
};

/* 1. Clicking a linked token opens the token inspector with its combatant id. */
describe('resolveSelectedTarget — token selection', () => {
  it('resolves a linked token to TOKEN with the linked combatant id', () => {
    const view: TacticalTokenView = viewFor(
      token({ id: 'tok-gob', tokenType: 'MONSTER', name: '' }),
      [combatant({ id: 'cmb-gob', type: 'MONSTER', displayName: 'Гоблин' })],
      [goblinLink],
    );
    const target = resolveSelectedTarget({
      selectedTokenId: 'tok-gob',
      selectedCell: null,
      tokens: [view],
    });
    expect(target).toEqual({ kind: 'TOKEN', tokenId: 'tok-gob', combatantId: 'cmb-gob' });
  });

  it('resolves an unlinked token to TOKEN with combatantId = null (no attack target)', () => {
    const view = viewFor(token({ id: 'tok-rock', tokenType: 'OBJECT', name: 'Камень' }), [], []);
    const target = resolveSelectedTarget({
      selectedTokenId: 'tok-rock',
      selectedCell: null,
      tokens: [view],
    });
    expect(target).toEqual({ kind: 'TOKEN', tokenId: 'tok-rock', combatantId: null });
  });
});

/* 2. Player inspector shows only combatant info exposed by battle data. */
describe('player-visible combatant info', () => {
  it('derives HP/turn from the battle combatant, not from the map token', () => {
    const view = viewFor(
      token({ id: 'tok-gob', tokenType: 'MONSTER', name: '' }),
      [combatant({ id: 'cmb-gob', type: 'MONSTER', displayName: 'Гоблин', currentHp: 4, maxHp: 7, currentTurn: true })],
      [goblinLink],
    );
    expect(view.currentHp).toBe(4);
    expect(view.maxHp).toBe(7);
    expect(view.currentTurn).toBe(true);
  });

  it('leaves HP undefined when no combatant is linked (nothing to reveal)', () => {
    const view = viewFor(token({ id: 'tok-rock', tokenType: 'OBJECT', name: 'Камень' }), [], []);
    expect(view.currentHp).toBeUndefined();
    expect(view.maxHp).toBeUndefined();
    expect(view.combatant).toBeNull();
  });
});

/* 3. GM inspector has the ids needed for its detailed controls. */
describe('GM inspector source data', () => {
  it('exposes combatant id + token id + initiative/turn order via the view', () => {
    const view = viewFor(
      token({ id: 'tok-gob', tokenType: 'MONSTER', name: '' }),
      [combatant({ id: 'cmb-gob', type: 'MONSTER', displayName: 'Гоблин', initiative: 17, turnOrder: 2 })],
      [goblinLink],
    );
    expect(view.tokenId).toBe('tok-gob');
    expect(view.linkedCombatantId).toBe('cmb-gob');
    expect(view.combatant?.initiative).toBe(17);
    expect(view.combatant?.turnOrder).toBe(2);
  });
});

/* 4. Clicking an empty cell opens the cell inspector. */
describe('resolveSelectedTarget — cell selection', () => {
  it('resolves a selected cell to CELL when no token is selected', () => {
    const target = resolveSelectedTarget({
      selectedTokenId: null,
      selectedCell: { gridX: 6, gridY: 9 },
      tokens: [],
    });
    expect(target).toEqual({ kind: 'CELL', gridX: 6, gridY: 9 });
  });

  it('returns NONE with neither a token nor a cell', () => {
    expect(resolveSelectedTarget({ selectedTokenId: null, selectedCell: null, tokens: [] })).toEqual({
      kind: 'NONE',
    });
  });

  it('lets a selected token win over a selected cell', () => {
    const view = viewFor(token({ id: 'tok-gob', name: '' }), [], [goblinLink]);
    const target = resolveSelectedTarget({
      selectedTokenId: 'tok-gob',
      selectedCell: { gridX: 1, gridY: 1 },
      tokens: [view],
    });
    expect(target.kind).toBe('TOKEN');
  });
});

/* 5. Attack selected + target click uses the target combatant id. */
describe('buildAttackRequest — target combatant id', () => {
  it('uses the linked combatant id as targetCombatantId', () => {
    const view = viewFor(
      token({ id: 'tok-gob', name: '' }),
      [combatant({ id: 'cmb-gob', type: 'MONSTER' })],
      [goblinLink],
    );
    const target = resolveSelectedTarget({ selectedTokenId: 'tok-gob', selectedCell: null, tokens: [view] });
    const combatantId = target.kind === 'TOKEN' ? target.combatantId : null;
    const req = buildAttackRequest(combatantId!, 'Укус', 14);
    expect(req).toEqual({ targetCombatantId: 'cmb-gob', attackName: 'Укус', d20: 14 });
  });
});

/* 6. Attack call carries core-battle fields only — never token/grid/pixel coords. */
describe('buildAttackRequest — core battle API only', () => {
  it('never includes a token id, grid coord or pixel coord', () => {
    const req = buildAttackRequest('cmb-gob', 'Укус', 14);
    expect(Object.keys(req).sort()).toEqual(['attackName', 'd20', 'targetCombatantId']);
    const serialized = JSON.stringify(req);
    expect(serialized).not.toContain('tokenId');
    expect(serialized).not.toContain('gridX');
    expect(serialized).not.toContain('screen');
  });
});

/* 7. HP adjust uses the core battle delta shape. */
describe('buildHpDeltaRequest — core battle API', () => {
  it('builds a signed delta (negative damages, positive heals)', () => {
    expect(buildHpDeltaRequest(-5)).toEqual({ delta: -5 });
    expect(buildHpDeltaRequest(8)).toEqual({ delta: 8 });
  });
});

/* 8. A battle refetch (new combatant HP) updates the derived inspector HP. */
describe('battle refetch updates inspector HP', () => {
  it('recomputes HP from the latest combatant snapshot', () => {
    const tok = token({ id: 'tok-gob', name: '' });
    const before = viewFor(tok, [combatant({ id: 'cmb-gob', type: 'MONSTER', currentHp: 7, maxHp: 7 })], [goblinLink]);
    const after = viewFor(tok, [combatant({ id: 'cmb-gob', type: 'MONSTER', currentHp: 2, maxHp: 7 })], [goblinLink]);
    expect(before.currentHp).toBe(7);
    expect(after.currentHp).toBe(2);
  });
});

/* 9. Moving the token (new grid coords) does not change derived battle HP. */
describe('map movement does not mutate battle HP', () => {
  it('keeps HP identical when only the token position changes', () => {
    const combatants = [combatant({ id: 'cmb-gob', type: 'MONSTER', currentHp: 6, maxHp: 7 })];
    const atStart = viewFor(token({ id: 'tok-gob', name: '', gridX: 0, gridY: 0 }), combatants, [goblinLink]);
    const afterMove = viewFor(token({ id: 'tok-gob', name: '', gridX: 5, gridY: 3 }), combatants, [goblinLink]);
    expect(afterMove.gridX).toBe(5);
    expect(afterMove.gridY).toBe(3);
    expect(afterMove.currentHp).toBe(atStart.currentHp);
    expect(afterMove.maxHp).toBe(atStart.maxHp);
  });
});

/* 10. No dev combat-preview mocks are imported by the tactical feature. */
describe('no dev preview mocks imported', () => {
  it('never imports combat-preview from any tactical source file', () => {
    const files = readdirSync(here).filter((f) => f.endsWith('.tsx') || (f.endsWith('.ts') && !f.endsWith('.test.ts')));
    for (const file of files) {
      const src = readFileSync(join(here, file), 'utf8');
      expect(src, `${file} must not import combat-preview mocks`).not.toMatch(/combat-preview/i);
    }
  });
});

/* Distance read-out + attack-name derivation (inspector supporting helpers). */
describe('gridChebyshevDistance', () => {
  it('uses king-move (max of axis deltas)', () => {
    expect(gridChebyshevDistance({ gridX: 0, gridY: 0 }, { gridX: 3, gridY: 1 })).toBe(3);
    expect(gridChebyshevDistance({ gridX: 2, gridY: 5 }, { gridX: 2, gridY: 5 })).toBe(0);
  });
});

describe('attackNamesFromTurn', () => {
  it('returns [] with no turn detail', () => {
    expect(attackNamesFromTurn(null)).toEqual([]);
    expect(attackNamesFromTurn(undefined)).toEqual([]);
  });

  it('reads character attack names', () => {
    const turn = {
      combatant: combatant({ id: 'cmb-hero' }),
      character: {
        attacks: [
          { name: 'Длинный меч', attackBonus: '+5', damage: '1d8+3', damageType: 'рубящий' },
          { name: 'Кинжал', attackBonus: '+5', damage: '1d4+3', damageType: 'колющий' },
        ],
      },
    } as unknown as CombatantTurnResponse;
    expect(attackNamesFromTurn(turn)).toEqual(['Длинный меч', 'Кинжал']);
  });

  it('reads attack-typed monster feature names and de-dups', () => {
    const turn = {
      combatant: combatant({ id: 'cmb-gob', type: 'MONSTER' }),
      monster: {
        features: [
          { nameRusloc: 'Укус', attackType: 'MELEE' },
          { nameRusloc: 'Многосущностность', attackType: null },
          { nameRusloc: 'Укус', attackType: 'MELEE' },
        ],
      },
    } as unknown as CombatantTurnResponse;
    expect(attackNamesFromTurn(turn)).toEqual(['Укус']);
  });
});
