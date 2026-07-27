import { describe, it, expect } from 'vitest';
import {
  availableOptions,
  chooseOption,
  currentNode,
  resolveRootNodeId,
  startDialogue,
} from './dialogueRuntime';
import type { NpcDialogueResponse } from '@/types';

const tree: NpcDialogueResponse = {
  rootNodeId: 'greet',
  nodes: [
    {
      id: 'greet',
      npcText: 'Здравствуй, странник.',
      options: [
        { text: 'Чем торгуешь?', nextNodeId: 'wares' },
        { text: 'Прощай.', actionType: 'END' },
      ],
    },
    {
      id: 'wares',
      npcText: 'Клинки и зелья.',
      options: [
        { text: 'Покажи товар.', actionType: 'OPEN_SHOP' },
        { text: 'Вернёмся к началу.', nextNodeId: 'greet' },
      ],
    },
  ],
};

describe('resolveRootNodeId', () => {
  it('uses the GM-selected root node', () => {
    expect(resolveRootNodeId(tree)).toBe('greet');
  });

  it('falls back to the first node when the root reference is broken', () => {
    expect(resolveRootNodeId({ rootNodeId: 'missing', nodes: tree.nodes })).toBe('greet');
  });

  it('returns null for an empty tree', () => {
    expect(resolveRootNodeId({ nodes: [] })).toBeNull();
    expect(resolveRootNodeId(undefined)).toBeNull();
  });
});

describe('startDialogue', () => {
  it('greets the player with the root NPC line', () => {
    const state = startDialogue(tree);
    expect(state.nodeId).toBe('greet');
    expect(state.history).toEqual([{ speaker: 'npc', text: 'Здравствуй, странник.' }]);
    expect(state.finished).toBe(false);
  });

  it('stays empty when there is no dialogue', () => {
    expect(startDialogue(undefined).nodeId).toBeNull();
  });
});

describe('chooseOption', () => {
  it('walks to the linked node and appends both lines', () => {
    const state = chooseOption(tree, startDialogue(tree), tree.nodes[0].options[0]);
    expect(state.nodeId).toBe('wares');
    expect(state.history).toEqual([
      { speaker: 'npc', text: 'Здравствуй, странник.' },
      { speaker: 'player', text: 'Чем торгуешь?' },
      { speaker: 'npc', text: 'Клинки и зелья.' },
    ]);
    expect(currentNode(tree, state)?.id).toBe('wares');
  });

  it('lets the player keep choosing replies turn after turn', () => {
    let state = startDialogue(tree);
    state = chooseOption(tree, state, tree.nodes[0].options[0]);
    state = chooseOption(tree, state, tree.nodes[1].options[1]);
    expect(state.nodeId).toBe('greet');
    expect(availableOptions(tree, state, 'Уйти')).toHaveLength(2);
  });

  it('finishes the conversation on END', () => {
    const state = chooseOption(tree, startDialogue(tree), tree.nodes[0].options[1]);
    expect(state.finished).toBe(true);
    expect(availableOptions(tree, state, 'Уйти')).toEqual([]);
  });

  it('keeps the conversation open for shop and quest actions', () => {
    let state = chooseOption(tree, startDialogue(tree), tree.nodes[0].options[0]);
    state = chooseOption(tree, state, tree.nodes[1].options[0]);
    expect(state.finished).toBe(false);
    expect(state.nodeId).toBe('wares');
    expect(state.history.at(-1)).toEqual({ speaker: 'player', text: 'Покажи товар.' });
  });

  it('finishes when the linked node no longer exists', () => {
    const state = chooseOption(tree, startDialogue(tree), { text: 'Ушёл', nextNodeId: 'ghost' });
    expect(state.finished).toBe(true);
  });
});

describe('availableOptions', () => {
  it('offers a farewell when the GM left a node without replies', () => {
    const dangling: NpcDialogueResponse = {
      rootNodeId: 'a',
      nodes: [{ id: 'a', npcText: 'Молчит.', options: [] }],
    };
    const options = availableOptions(dangling, startDialogue(dangling), 'Уйти');
    expect(options).toEqual([{ text: 'Уйти', actionType: 'END' }]);
  });

  it('skips blank option texts', () => {
    const blanks: NpcDialogueResponse = {
      rootNodeId: 'a',
      nodes: [{ id: 'a', npcText: 'Да?', options: [{ text: '  ', actionType: 'END' }] }],
    };
    expect(availableOptions(blanks, startDialogue(blanks), 'Уйти')).toEqual([
      { text: 'Уйти', actionType: 'END' },
    ]);
  });
});
