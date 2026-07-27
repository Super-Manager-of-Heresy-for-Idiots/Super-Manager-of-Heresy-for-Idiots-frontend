import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { QuestStatusBadge } from '@/components/narrative';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useLinkQuestNpc, useUnlinkQuestNpc, useCampaignQuests } from '@/hooks/useQuests';
import { useCampaignNpcs } from '@/hooks/useNpcs';
import type { NpcQuestRef, QuestNpcRef } from '@/types';
import s from './QuestNpcLinks.module.css';

/**
 * Панель «Квестодатели» в карточке квеста: список NPC, которые выдают этот квест,
 * с возможностью привязать нового и отвязать существующего. Привязка — та же таблица
 * quest_npcs, что читает NPC при взаимодействии с игроком, поэтому квест сразу
 * появляется во вкладке «Квесты» окна NPC.
 */
export function QuestGiversPanel({
  campaignId,
  questId,
  linkedNpcs,
}: {
  campaignId: string;
  questId: string;
  linkedNpcs: QuestNpcRef[];
}) {
  const t = useT();
  const { data: npcs = [] } = useCampaignNpcs(campaignId);
  const link = useLinkQuestNpc();
  const unlink = useUnlinkQuestNpc();
  const [npcId, setNpcId] = useState('');

  const linkedIds = new Set(linkedNpcs.map((n) => n.id));
  const available = npcs.filter((n) => !linkedIds.has(n.id));

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader
        title={t('camp2.questNpc.givers')}
        glyph="cir-dot"
        tone="gold"
        sub={t('camp2.questNpc.giversSub')}
      />
      <div className={s.body}>
        {linkedNpcs.length === 0 ? (
          <p className={cn('ao-italic', s.empty)}>{t('camp2.questNpc.noGivers')}</p>
        ) : (
          <ul className={s.list}>
            {linkedNpcs.map((npc) => (
              <li key={npc.id} className={s.row}>
                <Rune kind="cir-dot" size={12} color="var(--brass)" />
                <span className={s.name}>{npc.name}</span>
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  aria-label={t('camp2.questNpc.unlink')}
                  title={t('camp2.questNpc.unlink')}
                  disabled={unlink.isPending}
                  onClick={() => unlink.mutate({ campaignId, questId, npcId: npc.id })}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={s.addRow}>
          <select
            className={cn('ao-input', s.addSelect)}
            value={npcId}
            onChange={(e) => setNpcId(e.target.value)}
          >
            <option value="">
              {available.length ? t('camp2.questNpc.chooseNpc') : t('camp2.questNpc.noNpcsLeft')}
            </option>
            {available.map((npc) => (
              <option key={npc.id} value={npc.id}>
                {npc.name}
              </option>
            ))}
          </select>
          <button
            className="ao-btn ao-btn--primary ao-btn--sm"
            disabled={!npcId || link.isPending}
            onClick={() =>
              link.mutate({ campaignId, questId, npcId }, { onSuccess: () => setNpcId('') })
            }
          >
            {link.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('camp2.questNpc.link')}
          </button>
        </div>
      </div>
    </OrdoPanel>
  );
}

/**
 * Панель «Связанные квесты» в карточке NPC — зеркало {@link QuestGiversPanel}:
 * показывает, что NPC выдаёт, и позволяет добавить/убрать квест не покидая страницу.
 */
export function NpcQuestsPanel({
  campaignId,
  npcId,
  linkedQuests,
}: {
  campaignId: string;
  npcId: string;
  linkedQuests: NpcQuestRef[];
}) {
  const t = useT();
  const { data: quests = [] } = useCampaignQuests(campaignId);
  const link = useLinkQuestNpc();
  const unlink = useUnlinkQuestNpc();
  const [questId, setQuestId] = useState('');

  const linkedIds = new Set(linkedQuests.map((q) => q.id));
  const available = quests.filter((q) => !linkedIds.has(q.id));

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader
        title={t('camp2.npcDetail.linkedQuests')}
        glyph="scroll"
        tone="gold"
        sub={t('camp2.questNpc.npcQuestsSub')}
      />
      <div className={s.body}>
        {linkedQuests.length === 0 ? (
          <p className={cn('ao-italic', s.empty)}>{t('camp2.npcDetail.noLinkedQuests')}</p>
        ) : (
          <ul className={s.list}>
            {linkedQuests.map((quest) => (
              <li key={quest.id} className={s.row}>
                <Rune kind="scroll" size={12} color="var(--brass)" />
                <span className={s.name}>{quest.name}</span>
                {quest.status && <QuestStatusBadge status={quest.status} />}
                <button
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  aria-label={t('camp2.questNpc.unlink')}
                  title={t('camp2.questNpc.unlink')}
                  disabled={unlink.isPending}
                  onClick={() => unlink.mutate({ campaignId, questId: quest.id, npcId })}
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className={s.addRow}>
          <select
            className={cn('ao-input', s.addSelect)}
            value={questId}
            onChange={(e) => setQuestId(e.target.value)}
          >
            <option value="">
              {available.length ? t('camp2.questNpc.chooseQuest') : t('camp2.questNpc.noQuestsLeft')}
            </option>
            {available.map((quest) => (
              <option key={quest.id} value={quest.id}>
                {quest.title}
              </option>
            ))}
          </select>
          <button
            className="ao-btn ao-btn--primary ao-btn--sm"
            disabled={!questId || link.isPending}
            onClick={() =>
              link.mutate({ campaignId, questId, npcId }, { onSuccess: () => setQuestId('') })
            }
          >
            {link.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('camp2.questNpc.link')}
          </button>
        </div>
      </div>
    </OrdoPanel>
  );
}
