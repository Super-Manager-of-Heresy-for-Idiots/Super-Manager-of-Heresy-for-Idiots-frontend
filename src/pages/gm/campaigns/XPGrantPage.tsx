import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  Bar,
  EmptyVault,
} from '@/components/ordo';
import { BackLink, CharStatusBadge } from '@/components/campaigns';
import { useCampaignCharacters } from '@/hooks/useCharacter';
import { useGrantXp } from '@/hooks/useXp';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CharacterV2Response, XpTarget } from '@/types';
import s from './XPGrantPage.module.css';

/* ── D&D 5e-style XP thresholds (level -> cumulative XP needed) ── */
const XP_THRESHOLDS: Record<number, number> = {
  1: 0,     2: 300,    3: 900,    4: 2700,   5: 6500,
  6: 14000, 7: 23000,  8: 34000,  9: 48000,  10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000,
  16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000,
};

function xpForNextLevel(currentLevel: number): number {
  return XP_THRESHOLDS[currentLevel + 1] ?? Infinity;
}

type TargetMode = 'ALL' | 'SELECTED' | 'SINGLE';

/* ================================================================== */
/*  XPGrantPage                                                       */
/* ================================================================== */
export default function XPGrantPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: characters, isLoading, error, refetch } = useCampaignCharacters(campaignId!);
  const grantMutation = useGrantXp();

  const [targetMode, setTargetMode] = useState<TargetMode>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [xpAmount, setXpAmount] = useState('');

  const amount = Number(xpAmount) || 0;

  /* ---- resolve who receives XP ---- */
  const activeCharacters = useMemo(
    () => (characters ?? []).filter((c) => c.status === 'ACTIVE'),
    [characters],
  );

  const recipients = useMemo<CharacterV2Response[]>(() => {
    if (targetMode === 'ALL') return activeCharacters;
    return activeCharacters.filter((c) => selectedIds.has(c.id));
  }, [targetMode, activeCharacters, selectedIds]);

  /* ---- threshold preview ---- */
  const levelUps = useMemo(() => {
    if (amount <= 0) return [];
    return recipients.filter((c) => {
      const threshold = xpForNextLevel(c.totalLevel);
      return c.experience + amount >= threshold;
    });
  }, [recipients, amount]);

  /* ---- selection helpers ---- */
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds(new Set(activeCharacters.map((c) => c.id)));
  const selectNone = () => setSelectedIds(new Set());

  /* ---- grant handler ---- */
  const handleGrant = () => {
    if (!campaignId || amount <= 0 || recipients.length === 0) return;

    const target: XpTarget =
      targetMode === 'ALL' ? 'ALL' : targetMode === 'SELECTED' ? 'SELECTED' : 'SINGLE';

    grantMutation.mutate(
      {
        campaignId,
        data: {
          amount,
          target,
          characterIds: recipients.map((c) => c.id),
        },
      },
      {
        onSuccess: () => {
          setXpAmount('');
        },
      },
    );
  };

  /* ---- loading ---- */
  if (isLoading) {
    return (
      <div>
        <BackLink to={`/campaigns/${campaignId}`} label={t('camp2.back.campaign')} className={s.backLink} />
        <div className={s.headerBlock}>
          <p className={cn('ao-overline', s.overlineGold)}>
            {t('camp2.xp.gmTools')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>
            {t('camp2.xp.title')}
          </h3>
        </div>
        <div className={cn('ao-rgrid', s.skelGrid)}>
          {[0, 1].map((i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW50H16)} />
              <div className={cn('ao-ph', s.phW80H14)} />
              <div className={cn('ao-ph', s.phW60H14)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- error ---- */
  if (error) {
    return (
      <div>
        <BackLink to={`/campaigns/${campaignId}`} label={t('camp2.back.campaign')} className={s.backLink} />
        <div className={s.errorBlock}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('camp2.xp.loadError')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  if (!activeCharacters.length) {
    return (
      <div>
        <BackLink to={`/campaigns/${campaignId}`} label={t('camp2.back.campaign')} className={s.backLink} />
        <div className={s.headerBlock}>
          <p className={cn('ao-overline', s.overlineGold)}>
            {t('camp2.xp.gmTools')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>
            {t('camp2.xp.title')}
          </h3>
        </div>
        <EmptyVault
          glyph="sigil-3"
          overline={t('camp2.xp.empty.overline')}
          title={t('camp2.xp.empty.title')}
          body={t('camp2.xp.empty.body')}
        />
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div>
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp2.back.campaign')} className={s.backLink} />

      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>
            {t('camp2.xp.gmTools')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>
            {t('camp2.xp.title')}
          </h3>
          <p className={cn('ao-italic', s.subtitle)}>
            {t('camp2.xp.subtitle')}
          </p>
        </div>
        <OrdoChip tone="arcane" glyph="sigil-1">
          {t('camp2.xp.gmChip')}
        </OrdoChip>
      </div>

      {/* Main Grid: Recipients + Grant Panel */}
      <div className={cn('ao-rgrid', s.mainGrid)}>
        {/* ════════════ Recipients Panel ════════════ */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.xp.recipients')}
            sub={t('camp2.xp.recipientsSub', { selected: recipients.length, total: activeCharacters.length })}
            glyph="helm"
            right={
              targetMode === 'SELECTED' ? (
                <div className={s.headerActions}>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={selectAll}
                  >
                    {t('camp2.xp.all')}
                  </button>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={selectNone}
                  >
                    {t('camp2.xp.none')}
                  </button>
                </div>
              ) : undefined
            }
          />

          {/* Segmented Tabs */}
          <div className={s.tabs}>
            {(['ALL', 'SELECTED', 'SINGLE'] as TargetMode[]).map((mode) => {
              const active = targetMode === mode;
              return (
                <button
                  key={mode}
                  className={cn(s.tab, active && s.active)}
                  onClick={() => {
                    setTargetMode(mode);
                    if (mode === 'ALL') selectAll();
                    if (mode === 'SINGLE') selectNone();
                  }}
                >
                  {t(`camp2.xp.mode.${mode}`)}
                </button>
              );
            })}
          </div>

          {/* Character list */}
          <div className={s.charList}>
            {activeCharacters.map((ch) => {
              const isSelected =
                targetMode === 'ALL' || selectedIds.has(ch.id);
              const nextLevelXp = xpForNextLevel(ch.totalLevel);
              const xpProgress =
                nextLevelXp === Infinity ? 100 : (ch.experience / nextLevelXp) * 100;

              return (
                <div
                  key={ch.id}
                  className={cn(s.charRow, isSelected && s.selected, targetMode !== 'ALL' && s.clickable)}
                  onClick={() => {
                    if (targetMode === 'ALL') return;
                    if (targetMode === 'SINGLE') {
                      setSelectedIds(new Set([ch.id]));
                    } else {
                      toggleSelection(ch.id);
                    }
                  }}
                >
                  {/* Checkbox (only for SELECTED/SINGLE) */}
                  {targetMode !== 'ALL' && (
                    <div className={cn(s.cbox, isSelected && s.selected)}>
                      {isSelected && (
                        <Rune
                          kind="check"
                          size={12}
                          color="var(--gold)"
                        />
                      )}
                    </div>
                  )}

                  {/* Character info */}
                  <div className={s.charMain}>
                    <div className={s.charNameRow}>
                      <span className={cn('ao-h5', s.charName)}>
                        {ch.name}
                      </span>
                      <CharStatusBadge status={ch.status ?? 'ACTIVE'} />
                      <span className={cn('ao-codex', s.charLvl)}>
                        {t('camp2.xp.lvl')} {ch.totalLevel}
                      </span>
                    </div>

                    {/* HP bar */}
                    <div className={s.hpBarWrap}>
                      <Bar
                        value={ch.currentHp ?? 0}
                        max={ch.maxHp ?? 1}
                        tone="ember"
                        height={5}
                      />
                    </div>

                    {/* XP progress bar */}
                    <Bar
                      value={ch.experience}
                      max={nextLevelXp === Infinity ? ch.experience : nextLevelXp}
                      tone="arcane"
                      height={4}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </OrdoPanel>

        {/* ════════════ Grant Panel ════════════ */}
        <div className={s.grantCol}>
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('camp2.xp.grantXp')}
              glyph="flame"
              tone="ember"
            />

            <div className={s.grantBody}>
              {/* XP Input */}
              <div className={s.inputGroup}>
                <label className={cn('ao-label', s.inputLabel)}>
                  {t('camp2.xp.amountLabel')}
                </label>
                <input
                  className={cn('ao-input', s.xpInput)}
                  type="number"
                  min="0"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              {/* Quick-add buttons */}
              <div className={s.quickAdd}>
                {[250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    className={cn('ao-btn ao-btn--ghost', s.quickBtn)}
                    onClick={() =>
                      setXpAmount((prev) =>
                        String((Number(prev) || 0) + val),
                      )
                    }
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>

              <OrdoDivider glyph="diamond" />

              {/* Grant button */}
              <button
                className={cn('ao-btn ao-btn--primary', s.grantBtn)}
                onClick={handleGrant}
                disabled={
                  amount <= 0 ||
                  recipients.length === 0 ||
                  grantMutation.isPending
                }
              >
                {grantMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rune
                      kind="flame"
                      size={14}
                      color="currentColor"
                    />
                    <span className={s.ml8}>
                      {t('camp2.xp.grantTo', { count: recipients.length })}
                    </span>
                  </>
                )}
              </button>
            </div>
          </OrdoPanel>

          {/* ════════════ Threshold Preview ════════════ */}
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('camp2.xp.thresholdPreview')}
              sub={
                amount > 0
                  ? t('camp2.xp.willLevelUp', { count: levelUps.length })
                  : t('camp2.xp.enterToPreview')
              }
              glyph="arrow-up"
              tone="arcane"
            />

            <div>
              {amount <= 0 || recipients.length === 0 ? (
                <div className={s.previewEmpty}>
                  <p className={cn('ao-italic', s.previewEmptyText)}>
                    {t('camp2.xp.specifyAmount')}
                  </p>
                </div>
              ) : levelUps.length === 0 ? (
                <div className={s.previewEmpty}>
                  <p className={cn('ao-italic', s.previewEmptyText)}>
                    {t('camp2.xp.noneCross')}
                  </p>
                </div>
              ) : (
                <div>
                  {levelUps.map((ch) => {
                    const nextXp = xpForNextLevel(ch.totalLevel);
                    return (
                      <div key={ch.id} className={s.levelUpRow}>
                        <Rune
                          kind="arrow-up"
                          size={14}
                          color="#7a9866"
                        />
                        <div className={s.levelUpMain}>
                          <span className={cn('ao-h5', s.levelUpName)}>
                            {ch.name}
                          </span>
                        </div>
                        <span className={cn('ao-codex', s.lvlGreen)}>
                          {t('camp2.xp.lvl')} {ch.totalLevel} {'\u2192'}{' '}
                          {ch.totalLevel + 1}
                        </span>
                        <span className={cn('ao-codex', s.levelUpXp)}>
                          ({ch.experience.toLocaleString()} +{' '}
                          {amount.toLocaleString()} /{' '}
                          {nextXp === Infinity
                            ? t('camp2.xp.max')
                            : nextXp.toLocaleString()}
                          )
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </OrdoPanel>
        </div>
      </div>
    </div>
  );
}
