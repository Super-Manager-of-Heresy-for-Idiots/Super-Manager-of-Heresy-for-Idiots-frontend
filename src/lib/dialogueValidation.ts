import type { DialogueNodeDto } from '@/types';

/** Узлы, до которых игрок не доберётся из корня — мастер о них, скорее всего, забыл. */
export function findUnreachableNodeIds(
  nodes: DialogueNodeDto[],
  rootNodeId: string | undefined,
): string[] {
  if (!nodes.length) return [];
  const root = nodes.some((n) => n.id === rootNodeId) ? rootNodeId! : nodes[0].id;
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const reachable = new Set<string>();
  const queue = [root];
  while (queue.length) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    for (const option of byId.get(id)?.options ?? []) {
      if (option.nextNodeId && byId.has(option.nextNodeId)) queue.push(option.nextNodeId);
    }
  }

  return nodes.filter((n) => !reachable.has(n.id)).map((n) => n.id);
}

/**
 * Узлы без единого варианта ответа: игрок услышит реплику и не сможет ничего сказать.
 * Ровно эта ситуация выглядит как «выбрать можно только начальный вариант».
 */
export function findDeadEndNodeIds(nodes: DialogueNodeDto[]): string[] {
  return nodes
    .filter((n) => !(n.options ?? []).some((o) => o.text.trim().length > 0))
    .map((n) => n.id);
}
