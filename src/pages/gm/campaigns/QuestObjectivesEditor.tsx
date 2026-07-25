import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { cn } from '@/lib/utils';
import {
  useQuestObjectives,
  useAddQuestObjective,
  useDeleteQuestObjective,
} from '@/hooks/useQuests';
import { useCampaignItemTemplates } from '@/hooks/useInventory';
import type { ObjectiveType } from '@/types';

import s from './QuestObjectivesEditor.module.css';

interface Props {
  campaignId: string;
  questId: string;
}

const TYPE_LABELS: Record<ObjectiveType, string> = {
  KILL_MONSTER: 'Убить',
  COLLECT_ITEM: 'Собрать предмет',
  TALK_TO_NPC: 'Поговорить с NPC',
  VISIT_LOCATION: 'Посетить локацию',
  CUSTOM: 'Произвольная',
};

/**
 * ГМ-редактор опциональных целей квеста (WORLD_PLAN Этап 3). Настройка целей необязательна:
 * квест без целей сдаётся без ограничений. Для COLLECT_ITEM цель привязывается к шаблону
 * предмета и проверяется автоматически по инвентарю; остальные типы мастер отмечает вручную.
 */
export function QuestObjectivesEditor({ campaignId, questId }: Props) {
  const { data: objectives, isLoading } = useQuestObjectives(campaignId, questId);
  const { data: templates = [] } = useCampaignItemTemplates(campaignId);
  const add = useAddQuestObjective();
  const remove = useDeleteQuestObjective();

  const [type, setType] = useState<ObjectiveType>('CUSTOM');
  const [label, setLabel] = useState('');
  const [count, setCount] = useState('1');
  const [itemId, setItemId] = useState('');

  const isCollect = type === 'COLLECT_ITEM';

  const handleAdd = () => {
    const requiredCount = Math.max(1, parseInt(count, 10) || 1);
    const chosen = templates.find((tpl) => tpl.id === itemId);
    const targetLabel = isCollect ? chosen?.name || label.trim() : label.trim();
    if (!targetLabel && !(isCollect && itemId)) return;
    add.mutate(
      {
        campaignId,
        questId,
        data: {
          objectiveType: type,
          targetRef: isCollect && itemId ? itemId : undefined,
          targetLabel: targetLabel || undefined,
          requiredCount,
        },
      },
      {
        onSuccess: () => {
          setLabel('');
          setCount('1');
          setItemId('');
        },
      },
    );
  };

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title="Цели квеста" glyph="scroll" tone="gold" sub="Необязательно — по желанию мастера" />
      <div className={s.body}>
        {isLoading ? (
          <p className={cn('ao-italic', s.empty)}>Загрузка…</p>
        ) : !objectives?.length ? (
          <p className={cn('ao-italic', s.empty)}>Целей нет — квест сдаётся без ограничений.</p>
        ) : (
          <ul className={s.list}>
            {objectives.map((o) => (
              <li key={o.id} className={s.row}>
                <div className={s.main}>
                  <div className={s.label}>{o.targetLabel || TYPE_LABELS[o.objectiveType]}</div>
                  <div className={s.meta}>
                    {TYPE_LABELS[o.objectiveType]} · x{o.requiredCount ?? 1}
                  </div>
                </div>
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  onClick={() => remove.mutate({ campaignId, questId, objectiveId: o.id })}
                  disabled={remove.isPending}
                  aria-label="Удалить цель"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={s.addForm}>
          <select
            className="ao-input"
            value={type}
            onChange={(e) => setType(e.target.value as ObjectiveType)}
          >
            {(Object.keys(TYPE_LABELS) as ObjectiveType[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABELS[k]}
              </option>
            ))}
          </select>

          {isCollect ? (
            <select className="ao-input" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">Выберите предмет…</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="ao-input"
              placeholder="Описание цели"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          )}

          <div className={s.addRow}>
            <input
              className={cn('ao-input', s.countInput)}
              type="number"
              min="1"
              placeholder="Кол-во"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
            <button
              className="ao-btn ao-btn--primary ao-btn--sm"
              onClick={handleAdd}
              disabled={add.isPending || (isCollect ? !itemId : !label.trim())}
            >
              {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Добавить цель'}
            </button>
          </div>
        </div>
      </div>
    </OrdoPanel>
  );
}
