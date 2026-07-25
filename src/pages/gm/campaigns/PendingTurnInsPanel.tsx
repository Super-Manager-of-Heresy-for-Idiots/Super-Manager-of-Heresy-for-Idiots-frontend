import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import { usePendingTurnIns, useConfirmTurnIn } from '@/hooks/useWorld';

import s from './PendingTurnInsPanel.module.css';

interface Props {
  campaignId: string;
}

/**
 * ГМ-панель сдач квестов, ожидающих подтверждения (READY_FOR_TURN_IN). Подтверждение
 * выдаёт награду персонажу и завершает запись журнала. Панель скрыта, когда очередь пуста.
 */
export function PendingTurnInsPanel({ campaignId }: Props) {
  const t = useT();
  const { data, isLoading } = usePendingTurnIns(campaignId);
  const confirm = useConfirmTurnIn();

  if (isLoading || !data?.length) {
    return null;
  }

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('camp2.questMgr.pending.title')} glyph="scroll" tone="gold" />
      <div className={s.body}>
        {data.map((entry) => (
          <div key={entry.id} className={s.row}>
            <div className={s.main}>
              <div className={s.title}>{entry.title}</div>
              {entry.characterName && <div className={s.who}>{entry.characterName}</div>}
            </div>
            <button
              className="ao-btn ao-btn--primary ao-btn--sm"
              disabled={confirm.isPending || !entry.characterId}
              onClick={() =>
                entry.characterId &&
                confirm.mutate({ campaignId, characterId: entry.characterId, questId: entry.questId })
              }
            >
              {confirm.isPending ? (
                <Loader2 className={cn('h-4 w-4 animate-spin')} />
              ) : (
                t('camp2.questMgr.pending.confirm')
              )}
            </button>
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}
