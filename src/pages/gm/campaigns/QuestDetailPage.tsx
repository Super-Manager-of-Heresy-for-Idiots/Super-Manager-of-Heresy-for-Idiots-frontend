import type { CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { useQuest, useUpdateQuest } from '@/hooks/useQuests';
import { cn } from '@/lib/utils';
import type { QuestStatus, QuestReward } from '@/types';
import s from './QuestDetailPage.module.css';

/* ── constants ───────────────────────────────────────────────── */

const QUEST_STATUSES: QuestStatus[] = ['ACTIVE', 'COMPLETED', 'FAILED', 'HIDDEN', 'ARCHIVED'];

const STATUS_BUTTON_COLORS: Record<QuestStatus, string> = {
  ACTIVE:    '#d4b478',
  COMPLETED: '#6db86a',
  FAILED:    '#c87a3a',
  HIDDEN:    'var(--ink-ghost)',
  ARCHIVED:  'var(--ink-faint)',
};

/* ── reward icon helper ──────────────────────────────────────── */

function rewardGlyph(type: string): string {
  switch (type) {
    case 'ITEM': return 'sword';
    case 'GOLD': return 'coin';
    case 'XP':   return 'sigil-2';
    default:     return 'diamond';
  }
}

/* ── page ────────────────────────────────────────────────────── */

export default function QuestDetailPage() {
  const t = useT();
  const { campaignId, questId } = useParams<{ campaignId: string; questId: string }>();
  const backTo = `/campaigns/${campaignId}/quests`;
  const { data: quest, isLoading, error, refetch } = useQuest(campaignId!, questId!);
  const updateMutation = useUpdateQuest();

  const toggleVisibility = () => {
    if (!quest) return;
    updateMutation.mutate({
      campaignId: campaignId!,
      questId: questId!,
      data: { isVisibleToPlayers: !quest.isVisibleToPlayers },
    });
  };

  const setStatus = (status: QuestStatus) => {
    updateMutation.mutate({
      campaignId: campaignId!,
      questId: questId!,
      data: { status },
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.quests')} className={s.backLink} />
        <div className={s.skelSplit}>
        <div className={s.skelColWide}>
          <div className={cn('ao-panel ao-frame ao-breathe', s.skelLg)}>
            <span className="ao-frame-c" />
            <div className={cn('ao-ph', s.phW30H14)} />
            <div className={cn('ao-ph', s.phW50H24)} />
            <div className={cn('ao-ph', s.phW80H14)} />
            <div className={cn('ao-ph', s.phW60H14)} />
          </div>
        </div>
        <div className={s.skelColNarrow}>
          <div className={cn('ao-panel ao-frame ao-breathe', s.skelMd)}>
            <span className="ao-frame-c" />
            <div className={cn('ao-ph', s.phW60H14mb)} />
            <div className={cn('ao-ph', s.phW40H14)} />
          </div>
        </div>
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !quest) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.quests')} className={s.backLink} />
        <div className={s.errorBlock}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('camp2.questDetail.notFound')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        </div>
      </div>
    );
  }

  /* ── linked entities ─────────────────────────────────────── */

  const rewards: QuestReward[] = quest.rewards ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.quests')} className={s.backLink} />
      <div className={s.split}>
      {/* ═══ Left column ═══ */}
      <div className={s.colWide}>
        {/* Identity block */}
        <OrdoPanel frame padding={20}>
          <div className={s.idRow}>
            <CodexID>{quest.id.slice(0, 8).toUpperCase()}</CodexID>
            <QuestStatusBadge status={quest.status} />
            <VisibilityToggle visible={quest.isVisibleToPlayers} onToggle={toggleVisibility} />
          </div>

          <h3 className={cn('ao-h3', s.questTitle)}>
            {quest.title}
          </h3>

          {quest.description && (
            <p className={s.questDesc}>
              {quest.description}
            </p>
          )}
        </OrdoPanel>

        {/* Rewards panel */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.questDetail.rewards')} glyph="coin" tone="gold" />
          <div className={s.rewardsBody}>
            {rewards.length === 0 ? (
              <p className={cn('ao-italic', s.emptyText)}>
                {t('camp2.questDetail.noRewards')}
              </p>
            ) : (
              <div className={s.rewardList}>
                {rewards.map((reward, idx) => (
                  <div key={idx} className={s.rewardRow}>
                    <Rune kind={rewardGlyph(reward.type ?? '')} size={14} color="var(--gold)" />
                    <div className={s.rewardMain}>
                      <span className={s.rewardName}>
                        {reward.itemTemplateName || reward.type || t('camp2.questDetail.reward')}
                      </span>
                      {reward.quantity != null && (
                        <span className={cn('ao-codex', s.rewardQty)}>
                          x{reward.quantity}
                        </span>
                      )}
                    </div>
                    <span className={cn('ao-overline', s.rewardType)}>
                      {reward.type ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </OrdoPanel>
      </div>

      {/* ═══ Right column ═══ */}
      <div className={s.colNarrow}>
        {/* Status setter */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.questDetail.setStatus')} glyph="diamond-fill" tone="gold" />
          <div className={s.statusBody}>
            {QUEST_STATUSES.map((status) => {
              const isActive = quest.status === status;
              const c = STATUS_BUTTON_COLORS[status];
              return (
                <button
                  key={status}
                  onClick={() => setStatus(status)}
                  disabled={updateMutation.isPending}
                  className={cn(s.statusBtn, isActive && s.active)}
                  style={{ '--status-c': c } as CSSProperties}
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <span className={s.pip} />
                  )}
                  {t(`camp2.questStatus.${status}`)}
                </button>
              );
            })}
          </div>
        </OrdoPanel>
      </div>
      </div>
    </div>
  );
}
