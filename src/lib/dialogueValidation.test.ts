import { describe, it, expect } from 'vitest';
import { findDeadEndNodeIds, findUnreachableNodeIds } from './dialogueValidation';
import type { DialogueNodeDto } from '@/types';

const nodes: DialogueNodeDto[] = [
  { id: 'a', npcText: 'Привет.', options: [{ text: 'Дальше', nextNodeId: 'b' }] },
  { id: 'b', npcText: 'И что?', options: [{ text: 'Пока', actionType: 'END' }] },
  { id: 'orphan', npcText: 'Меня не услышат.', options: [] },
];

describe('findUnreachableNodeIds', () => {
  it('finds nodes nobody links to', () => {
    expect(findUnreachableNodeIds(nodes, 'a')).toEqual(['orphan']);
  });

  it('treats the first node as root when the root reference is broken', () => {
    expect(findUnreachableNodeIds(nodes, 'missing')).toEqual(['orphan']);
  });

  it('handles cycles without hanging', () => {
    const cyclic: DialogueNodeDto[] = [
      { id: 'a', npcText: '1', options: [{ text: '→b', nextNodeId: 'b' }] },
      { id: 'b', npcText: '2', options: [{ text: '→a', nextNodeId: 'a' }] },
    ];
    expect(findUnreachableNodeIds(cyclic, 'a')).toEqual([]);
  });

  it('returns nothing for an empty tree', () => {
    expect(findUnreachableNodeIds([], undefined)).toEqual([]);
  });
});

describe('findDeadEndNodeIds', () => {
  it('flags nodes without usable replies', () => {
    expect(findDeadEndNodeIds(nodes)).toEqual(['orphan']);
  });

  it('treats blank option text as no reply', () => {
    expect(findDeadEndNodeIds([{ id: 'x', npcText: '…', options: [{ text: '   ' }] }])).toEqual(['x']);
  });
});
