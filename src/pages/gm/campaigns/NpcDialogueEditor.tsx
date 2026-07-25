import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { cn } from '@/lib/utils';
import { useNpcDialogue, usePutNpcDialogue, useDeleteNpcDialogue } from '@/hooks/useWorld';
import { useCampaignQuests } from '@/hooks/useQuests';
import type { DialogueNodeDto, DialogueOptionDto } from '@/types';

import s from './NpcDialogueEditor.module.css';

interface Props {
  campaignId: string;
  npcId: string;
}

function newId(): string {
  return (globalThis.crypto?.randomUUID?.() ?? String(Date.now())).slice(0, 8);
}

/**
 * ГМ-редактор опционального диалога NPC (WORLD_PLAN Этап 4). Мастер сам решает, будет ли у NPC
 * диалог: без узлов диалога нет, взаимодействие идёт как раньше. Дерево сохраняется целиком.
 */
export function NpcDialogueEditor({ campaignId, npcId }: Props) {
  const { data: dialogue, isLoading } = useNpcDialogue(campaignId, npcId);
  const { data: quests = [] } = useCampaignQuests(campaignId);
  const put = usePutNpcDialogue();
  const del = useDeleteNpcDialogue();

  const [nodes, setNodes] = useState<DialogueNodeDto[]>([]);
  const [rootNodeId, setRootNodeId] = useState<string>('');

  useEffect(() => {
    setNodes(dialogue?.nodes ?? []);
    setRootNodeId(dialogue?.rootNodeId ?? dialogue?.nodes?.[0]?.id ?? '');
  }, [dialogue]);

  const patchNode = (id: string, patch: Partial<DialogueNodeDto>) =>
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const addNode = () => {
    const id = newId();
    setNodes((prev) => [...prev, { id, npcText: '', options: [] }]);
    if (!rootNodeId) setRootNodeId(id);
  };

  const removeNode = (id: string) => {
    setNodes((prev) =>
      prev
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          options: n.options.map((o) => (o.nextNodeId === id ? { ...o, nextNodeId: undefined } : o)),
        })),
    );
    if (rootNodeId === id) setRootNodeId((prevRoot) => (prevRoot === id ? '' : prevRoot));
  };

  const patchOption = (nodeId: string, idx: number, patch: Partial<DialogueOptionDto>) =>
    setNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? { ...n, options: n.options.map((o, i) => (i === idx ? { ...o, ...patch } : o)) }
          : n,
      ),
    );

  const addOption = (nodeId: string) =>
    patchNode(nodeId, {
      options: [
        ...(nodes.find((n) => n.id === nodeId)?.options ?? []),
        { text: '', actionType: 'END' },
      ],
    });

  const removeOption = (nodeId: string, idx: number) =>
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, options: n.options.filter((_, i) => i !== idx) } : n)),
    );

  const handleSave = () => {
    const kept = nodes
      .map((n) => ({ ...n, npcText: n.npcText.trim() }))
      .filter((n) => n.npcText.length > 0);
    const keptIds = new Set(kept.map((n) => n.id));
    // Узлы без текста отбрасываются, поэтому ссылки на них надо превратить в «Завершить»,
    // иначе бэкенд отклонит дерево (option points to unknown node).
    const cleaned = kept.map((n) => ({
      ...n,
      options: n.options
        .map((o) => (o.nextNodeId && !keptIds.has(o.nextNodeId)
          ? { ...o, nextNodeId: undefined, actionType: 'END' as const }
          : o))
        .filter((o) => o.text.trim().length > 0),
    }));
    put.mutate({
      campaignId,
      npcId,
      data: {
        rootNodeId: keptIds.has(rootNodeId) ? rootNodeId : cleaned[0]?.id,
        nodes: cleaned,
      },
    });
  };

  const optionTargetValue = (o: DialogueOptionDto): string =>
    o.nextNodeId ? `node:${o.nextNodeId}` : o.actionType ? `action:${o.actionType}` : '';

  const onTargetChange = (nodeId: string, idx: number, value: string) => {
    if (value.startsWith('node:')) {
      patchOption(nodeId, idx, { nextNodeId: value.slice(5), actionType: undefined, questId: undefined });
    } else if (value.startsWith('action:')) {
      const action = value.slice(7) as DialogueOptionDto['actionType'];
      patchOption(nodeId, idx, { actionType: action, nextNodeId: undefined, questId: undefined });
    }
  };

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title="Диалог NPC" glyph="scroll" tone="gold" sub="Необязательно — по желанию мастера" />
      <div className={s.body}>
        {isLoading ? (
          <p className={cn('ao-italic', s.empty)}>Загрузка…</p>
        ) : nodes.length === 0 ? (
          <p className={cn('ao-italic', s.empty)}>Диалога нет — взаимодействие идёт как обычно.</p>
        ) : (
          nodes.map((node) => (
            <div key={node.id} className={s.node}>
              <div className={s.nodeHead}>
                <span className={s.nodeId}>{node.id}</span>
                <label className={s.rootLabel}>
                  <input
                    type="radio"
                    name={`root-${npcId}`}
                    checked={rootNodeId === node.id}
                    onChange={() => setRootNodeId(node.id)}
                  />
                  начальный
                </label>
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  onClick={() => removeNode(node.id)}
                  aria-label="Удалить узел"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <textarea
                className="ao-input"
                rows={2}
                placeholder="Реплика NPC"
                value={node.npcText}
                onChange={(e) => patchNode(node.id, { npcText: e.target.value })}
              />

              <span className={s.optionsTitle}>Варианты ответа</span>
              {node.options.map((opt, idx) => (
                <div key={idx} className={s.option}>
                  <input
                    className={cn('ao-input', s.optionText)}
                    placeholder="Текст варианта"
                    value={opt.text}
                    onChange={(e) => patchOption(node.id, idx, { text: e.target.value })}
                  />
                  <select
                    className={cn('ao-input', s.select)}
                    value={optionTargetValue(opt)}
                    onChange={(e) => onTargetChange(node.id, idx, e.target.value)}
                  >
                    <optgroup label="Действие">
                      <option value="action:END">Завершить</option>
                      <option value="action:OPEN_SHOP">Открыть лавку</option>
                      <option value="action:OFFER_QUEST">К квестам</option>
                    </optgroup>
                    <optgroup label="Перейти к узлу">
                      {nodes
                        .filter((n) => n.id !== node.id)
                        .map((n) => (
                          <option key={n.id} value={`node:${n.id}`}>
                            {n.npcText ? n.npcText.slice(0, 24) : n.id}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  {opt.actionType === 'OFFER_QUEST' && (
                    <select
                      className={cn('ao-input', s.select)}
                      value={opt.questId ?? ''}
                      onChange={(e) => patchOption(node.id, idx, { questId: e.target.value || undefined })}
                    >
                      <option value="">Любой квест</option>
                      {quests.map((q) => (
                        <option key={q.id} value={q.id}>
                          {q.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    className="ao-btn ao-btn--sm ao-btn--danger"
                    onClick={() => removeOption(node.id, idx)}
                    aria-label="Удалить вариант"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button className="ao-btn ao-btn--sm" onClick={() => addOption(node.id)}>
                <Plus size={12} />
                <span>Вариант</span>
              </button>
            </div>
          ))
        )}

        <div className={s.footer}>
          <button className="ao-btn ao-btn--sm" onClick={addNode}>
            <Plus size={13} />
            <span>Узел</span>
          </button>
          <div className={s.spacer} />
          {nodes.length > 0 && (
            <button
              className="ao-btn ao-btn--sm ao-btn--danger"
              onClick={() => del.mutate({ campaignId, npcId })}
              disabled={del.isPending}
            >
              Удалить диалог
            </button>
          )}
          <button
            className="ao-btn ao-btn--sm ao-btn--primary"
            onClick={handleSave}
            disabled={put.isPending || nodes.length === 0}
          >
            {put.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
          </button>
        </div>
      </div>
    </OrdoPanel>
  );
}
