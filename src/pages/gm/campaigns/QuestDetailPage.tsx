import { useMemo, useState, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { CodexID } from '@/components/homebrew/CodexID';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import { BackLink } from '@/components/campaigns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useT } from '@/i18n/I18nContext';
import {
  useQuest,
  useUpdateQuest,
  useAddQuestReward,
  useDeleteQuestReward,
  useCompleteQuest,
} from '@/hooks/useQuests';
import { useCampaignCharacters, useCampaignCurrencies } from '@/hooks/useCharacter';
import { useCampaignItemTemplates } from '@/hooks/useInventory';
import { cn } from '@/lib/utils';
import type { QuestStatus, QuestReward, CreateQuestRewardRequest } from '@/types';
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

type Translate = (key: string, vars?: Record<string, string | number>) => string;

/* ── reward presentation ─────────────────────────────────────── */

interface RewardView { glyph: string; name: string; value: string; typeLabel: string; }

function rewardView(reward: QuestReward, t: Translate): RewardView {
  if (reward.xpAmount != null && reward.xpAmount > 0) {
    return {
      glyph: 'sigil-2',
      name: t('camp2.questDetail.kindXp'),
      value: `${reward.xpAmount} ${t('camp2.questDetail.xpUnit')}`,
      typeLabel: t('camp2.questDetail.kindXp'),
    };
  }
  if (reward.currencyAmount != null || reward.currencyTypeId) {
    return {
      glyph: 'coin',
      name: reward.currencyTypeName || t('camp2.questDetail.kindCurrency'),
      value: reward.currencyAmount != null ? String(reward.currencyAmount) : '',
      typeLabel: t('camp2.questDetail.kindCurrency'),
    };
  }
  return {
    glyph: 'sword',
    name: reward.itemTemplateName || t('camp2.questDetail.reward'),
    value: reward.quantity != null ? `x${reward.quantity}` : '',
    typeLabel: t('camp2.questDetail.kindItem'),
  };
}

/* ── page ────────────────────────────────────────────────────── */

export default function QuestDetailPage() {
  const t = useT();
  const { campaignId, questId } = useParams<{ campaignId: string; questId: string }>();
  const backTo = `/campaigns/${campaignId}/quests`;
  const { data: quest, isLoading, error, refetch } = useQuest(campaignId!, questId!);
  const updateMutation = useUpdateQuest();
  const addRewardMutation = useAddQuestReward();
  const deleteRewardMutation = useDeleteQuestReward();
  const completeMutation = useCompleteQuest();

  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(campaignId!);
  const { data: itemTemplates, isLoading: itemsLoading } = useCampaignItemTemplates(campaignId);
  const { data: currencies } = useCampaignCurrencies(campaignId!);

  /* ── reward dialog state ─────────────────────────────────── */
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rItemSearch, setRItemSearch] = useState('');
  const [rItemId, setRItemId] = useState('');
  const [rQty, setRQty] = useState('1');
  const [rCurrencyId, setRCurrencyId] = useState('');
  const [rCurrencyAmount, setRCurrencyAmount] = useState('');
  const [rXp, setRXp] = useState('');

  /* ── complete dialog state ───────────────────────────────── */
  const [completeOpen, setCompleteOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [completeXp, setCompleteXp] = useState('');

  /* ── derived ─────────────────────────────────────────────── */
  const rewards: QuestReward[] = useMemo(() => quest?.rewards ?? [], [quest]);

  const totalXp = useMemo(
    () => rewards.reduce((sum, r) => sum + (r.xpAmount ?? 0), 0),
    [rewards],
  );
  const itemCount = useMemo(
    () => rewards.reduce((sum, r) => sum + (r.itemTemplateId ? (r.quantity ?? 1) : 0), 0),
    [rewards],
  );

  const filteredItems = useMemo(() => {
    const list = itemTemplates ?? [];
    const q = rItemSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) =>
      [it.name, it.itemTypeName, it.rarity].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [itemTemplates, rItemSearch]);

  /* ── handlers ────────────────────────────────────────────── */

  const toggleVisibility = () => {
    if (!quest) return;
    updateMutation.mutate({
      campaignId: campaignId!,
      questId: questId!,
      data: { isVisibleToPlayers: !quest.isVisibleToPlayers },
    });
  };

  const setStatus = (status: QuestStatus) => {
    updateMutation.mutate({ campaignId: campaignId!, questId: questId!, data: { status } });
  };

  const onStatusClick = (status: QuestStatus) => {
    if (status === 'COMPLETED') {
      if (quest?.status === 'COMPLETED') return;
      setRecipientId('');
      setCompleteXp('');
      setCompleteOpen(true);
      return;
    }
    setStatus(status);
  };

  const resetReward = () => {
    setRItemSearch('');
    setRItemId('');
    setRQty('1');
    setRCurrencyId('');
    setRCurrencyAmount('');
    setRXp('');
  };

  const canAddReward =
    !!rItemId ||
    (!!rCurrencyId && Number(rCurrencyAmount) > 0) ||
    Number(rXp) > 0;

  const handleAddReward = () => {
    if (!canAddReward) return;
    const data: CreateQuestRewardRequest = {};
    if (rItemId) {
      data.itemTemplateId = rItemId;
      data.quantity = Number(rQty) || 1;
    }
    if (rCurrencyId && Number(rCurrencyAmount) > 0) {
      data.currencyTypeId = rCurrencyId;
      data.currencyAmount = Number(rCurrencyAmount);
    }
    if (Number(rXp) > 0) {
      data.xpAmount = Number(rXp);
    }
    addRewardMutation.mutate(
      { campaignId: campaignId!, questId: questId!, data },
      { onSuccess: () => { setRewardOpen(false); resetReward(); } },
    );
  };

  const handleDeleteReward = (rewardId: string) => {
    deleteRewardMutation.mutate({ campaignId: campaignId!, questId: questId!, rewardId });
  };

  const handleComplete = () => {
    if (!recipientId) return;
    const data = completeXp.trim() !== ''
      ? { recipientCharacterId: recipientId, xpAmount: Number(completeXp) }
      : { recipientCharacterId: recipientId };
    completeMutation.mutate(
      { campaignId: campaignId!, questId: questId!, data },
      { onSuccess: () => setCompleteOpen(false) },
    );
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
          <PanelHeader
            title={t('camp2.questDetail.rewards')}
            glyph="coin"
            tone="gold"
            right={
              <button
                className="ao-btn ao-btn--sm"
                onClick={() => { resetReward(); setRewardOpen(true); }}
              >
                <Rune kind="plus" size={9} /> {t('camp2.questDetail.addReward')}
              </button>
            }
          />
          <div className={s.rewardsBody}>
            {rewards.length === 0 ? (
              <p className={cn('ao-italic', s.emptyText)}>
                {t('camp2.questDetail.noRewards')}
              </p>
            ) : (
              <div className={s.rewardList}>
                {rewards.map((reward) => {
                  const view = rewardView(reward, t);
                  return (
                    <div key={reward.id} className={s.rewardRow}>
                      <Rune kind={view.glyph} size={14} color="var(--gold)" />
                      <div className={s.rewardMain}>
                        <span className={s.rewardName}>{view.name}</span>
                        {view.value && (
                          <span className={cn('ao-codex', s.rewardQty)}>{view.value}</span>
                        )}
                      </div>
                      <span className={cn('ao-overline', s.rewardType)}>{view.typeLabel}</span>
                      <button
                        className={cn('ao-iconbtn', s.rewardDel)}
                        title={t('camp2.questDetail.removeReward')}
                        onClick={() => handleDeleteReward(reward.id)}
                        disabled={deleteRewardMutation.isPending}
                      >
                        <Rune kind="x" size={10} />
                      </button>
                    </div>
                  );
                })}
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
              const isComplete = status === 'COMPLETED';
              return (
                <button
                  key={status}
                  onClick={() => onStatusClick(status)}
                  disabled={updateMutation.isPending || (isComplete && quest.status === 'COMPLETED')}
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

      {/* ═══ Add reward dialog ═══ */}
      <Dialog
        open={rewardOpen}
        onOpenChange={(open) => { setRewardOpen(open); if (!open) resetReward(); }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>{t('camp2.questReward.dialogTitle')}</DialogTitle></DialogHeader>
          <div className={s.dialogCol}>
            {/* Item */}
            <div>
              <label className="ao-label">{t('camp2.questReward.item')}</label>
              <input
                className={cn('ao-input', s.mb8)}
                value={rItemSearch}
                onChange={(e) => setRItemSearch(e.target.value)}
                placeholder={t('camp2.questReward.itemSearch')}
                disabled={itemsLoading}
              />
              <select
                className="ao-input"
                value={rItemId}
                onChange={(e) => setRItemId(e.target.value)}
                disabled={itemsLoading}
              >
                <option value="">
                  {itemsLoading
                    ? t('camp2.questReward.loadingItems')
                    : (itemTemplates?.length ?? 0) === 0
                      ? t('camp2.questReward.noItems')
                      : t('camp2.questReward.chooseItem')}
                </option>
                {filteredItems.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}{it.itemTypeName ? ` · ${it.itemTypeName}` : ''} · {it.rarity}
                  </option>
                ))}
              </select>
            </div>

            {rItemId && (
              <div>
                <label className="ao-label">{t('camp2.questReward.quantity')}</label>
                <input
                  className="ao-input"
                  type="number"
                  min="1"
                  value={rQty}
                  onChange={(e) => setRQty(e.target.value)}
                />
              </div>
            )}

            {/* Currency */}
            <div className={s.grid2}>
              <div>
                <label className="ao-label">{t('camp2.questReward.currency')}</label>
                <select
                  className="ao-input"
                  value={rCurrencyId}
                  onChange={(e) => setRCurrencyId(e.target.value)}
                >
                  <option value="">{t('camp2.questReward.chooseCurrency')}</option>
                  {(currencies ?? []).map((cur) => (
                    <option key={cur.id} value={cur.id}>{cur.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ao-label">{t('camp2.questReward.currencyAmount')}</label>
                <input
                  className="ao-input"
                  type="number"
                  min="0"
                  step="any"
                  value={rCurrencyAmount}
                  onChange={(e) => setRCurrencyAmount(e.target.value)}
                  disabled={!rCurrencyId}
                />
              </div>
            </div>

            {/* XP */}
            <div>
              <label className="ao-label">{t('camp2.questReward.xp')}</label>
              <input
                className="ao-input"
                type="number"
                min="0"
                value={rXp}
                onChange={(e) => setRXp(e.target.value)}
                placeholder={t('camp2.questReward.xpPlaceholder')}
              />
            </div>

            <p className={cn('ao-italic', s.hintText)}>{t('camp2.questReward.hint')}</p>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setRewardOpen(false)}
              disabled={addRewardMutation.isPending}
            >
              {t('camp2.questReward.cancel')}
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleAddReward}
              disabled={!canAddReward || addRewardMutation.isPending}
            >
              {addRewardMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.questReward.add')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Complete quest dialog ═══ */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('camp2.questComplete.dialogTitle')}</DialogTitle></DialogHeader>
          <div className={s.dialogCol}>
            <p className={cn('ao-italic', s.introText)}>{t('camp2.questComplete.intro')}</p>

            <div>
              <label className="ao-label">{t('camp2.questComplete.recipient')}</label>
              {charsLoading ? (
                <p className={cn('ao-italic', s.recipientEmpty)}>{t('camp2.questComplete.loadingChars')}</p>
              ) : (characters?.length ?? 0) === 0 ? (
                <p className={cn('ao-italic', s.recipientEmpty)}>{t('camp2.questComplete.noChars')}</p>
              ) : (
                <div className={s.recipientList}>
                  {(characters ?? []).map((ch) => {
                    const isSel = ch.id === recipientId;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setRecipientId(ch.id)}
                        className={cn(s.recipient, isSel && s.selected)}
                      >
                        <Rune kind="cir-dot" size={14} color={isSel ? 'var(--gold)' : 'var(--ink-faint)'} />
                        <div className={s.recipientMain}>
                          <div className={s.recipientName}>{ch.name}</div>
                          <div className={s.recipientMeta}>
                            {t('camp2.questComplete.level', { level: ch.totalLevel })}
                            {ch.classLevels?.[0]?.className ? ` · ${ch.classLevels[0].className}` : ''}
                            {' · '}
                            {t('camp2.questComplete.ownerLabel', { owner: ch.ownerUsername })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="ao-label">{t('camp2.questComplete.xpOverride')}</label>
              <input
                className="ao-input"
                type="number"
                min="0"
                value={completeXp}
                onChange={(e) => setCompleteXp(e.target.value)}
                placeholder={String(totalXp)}
              />
              <p className={cn('ao-italic', s.xpHint)}>{t('camp2.questComplete.xpOverrideHint')}</p>
            </div>

            <p className={cn('ao-codex', s.summaryLine)}>
              {t('camp2.questComplete.summary', { items: itemCount, xp: completeXp.trim() !== '' ? Number(completeXp) : totalXp })}
            </p>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setCompleteOpen(false)}
              disabled={completeMutation.isPending}
            >
              {t('camp2.questComplete.cancel')}
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleComplete}
              disabled={!recipientId || completeMutation.isPending}
            >
              {completeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp2.questComplete.confirm')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
