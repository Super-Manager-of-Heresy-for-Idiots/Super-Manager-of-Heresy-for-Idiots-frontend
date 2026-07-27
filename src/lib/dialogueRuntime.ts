import type { DialogueNodeDto, DialogueOptionDto, NpcDialogueResponse } from '@/types';

/** Одна произнесённая реплика в журнале разговора. */
export interface DialogueTurn {
  speaker: 'npc' | 'player';
  text: string;
}

/** Состояние идущего разговора: журнал реплик + текущий узел дерева. */
export interface DialogueState {
  /** Узел, реплику которого NPC произнёс последней; null — разговор не начат. */
  nodeId: string | null;
  history: DialogueTurn[];
  /** true — разговор завершён, варианты ответа больше не показываются. */
  finished: boolean;
}

export const EMPTY_DIALOGUE_STATE: DialogueState = { nodeId: null, history: [], finished: false };

function findNode(dialogue: NpcDialogueResponse, nodeId: string | null): DialogueNodeDto | undefined {
  if (!nodeId) return undefined;
  return dialogue.nodes.find((n) => n.id === nodeId);
}

/** Узел, с которого начинается разговор: явный корень мастера либо первый узел дерева. */
export function resolveRootNodeId(dialogue: NpcDialogueResponse | undefined): string | null {
  if (!dialogue?.nodes?.length) return null;
  const explicit = dialogue.rootNodeId && findNode(dialogue, dialogue.rootNodeId);
  return explicit ? dialogue.rootNodeId! : dialogue.nodes[0].id;
}

/**
 * Начинает разговор: NPC произносит корневую реплику, игрок получает варианты ответа.
 * Так работает приветствие «подошёл к NPC» — как в RPG.
 */
export function startDialogue(dialogue: NpcDialogueResponse | undefined): DialogueState {
  const rootId = resolveRootNodeId(dialogue);
  const root = dialogue && findNode(dialogue, rootId);
  if (!root) return EMPTY_DIALOGUE_STATE;
  return { nodeId: root.id, history: [{ speaker: 'npc', text: root.npcText }], finished: false };
}

/** Текущий узел разговора — источник вариантов ответа игрока. */
export function currentNode(
  dialogue: NpcDialogueResponse | undefined,
  state: DialogueState,
): DialogueNodeDto | undefined {
  if (!dialogue) return undefined;
  return findNode(dialogue, state.nodeId);
}

/**
 * Варианты ответа игрока в текущем узле. Если мастер не задал ни одного,
 * подставляем «Уйти», чтобы игрок не оказался в тупике без выхода из разговора.
 */
export function availableOptions(
  dialogue: NpcDialogueResponse | undefined,
  state: DialogueState,
  farewellText: string,
): DialogueOptionDto[] {
  if (state.finished) return [];
  const node = currentNode(dialogue, state);
  if (!node) return [];
  const options = node.options?.filter((o) => o.text.trim().length > 0) ?? [];
  return options.length ? options : [{ text: farewellText, actionType: 'END' }];
}

/**
 * Применяет выбор игрока: его реплика попадает в журнал, затем NPC отвечает репликой
 * следующего узла. Варианты с действиями (лавка, квесты) разговор не обрывают — окно
 * лишь переключает вкладку, и игрок может вернуться к тем же вариантам.
 * @param dialogue дерево диалога, пришедшее с бэкенда
 * @param state текущее состояние разговора
 * @param option выбранный игроком вариант
 * @return новое состояние разговора
 */
export function chooseOption(
  dialogue: NpcDialogueResponse | undefined,
  state: DialogueState,
  option: DialogueOptionDto,
): DialogueState {
  const history: DialogueTurn[] = [...state.history, { speaker: 'player', text: option.text }];

  const next = dialogue && option.nextNodeId ? findNode(dialogue, option.nextNodeId) : undefined;
  if (next) {
    return {
      nodeId: next.id,
      history: [...history, { speaker: 'npc', text: next.npcText }],
      finished: false,
    };
  }

  // Действия оставляют разговор открытым: игрок вернётся к тем же вариантам после лавки/квестов.
  if (option.actionType === 'OPEN_SHOP' || option.actionType === 'OFFER_QUEST') {
    return { ...state, history };
  }

  return { ...state, history, finished: true };
}
