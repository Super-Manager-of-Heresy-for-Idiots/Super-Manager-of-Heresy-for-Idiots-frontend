import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoChip,
  ModifierTag,
} from '@/components/ordo';
import { EffectRow } from '@/components/gm/EffectRow';
import { BackLink } from '@/components/campaigns';
import {
  useCharacterEffects,
  useApplyEffect,
  useRemoveEffect,
} from '@/hooks/useEffects';
import { useCharacter } from '@/hooks/useCharacter';
import { useBuffsDebuffs } from '@/hooks/useAdmin';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import s from './ApplyEffectPage.module.css';

/* ================================================================== */
/*  ApplyEffectPage                                                   */
/* ================================================================== */
export default function ApplyEffectPage() {
  const t = useT();
  const { campaignId, characterId } = useParams<{
    campaignId: string;
    characterId: string;
  }>();
  const { user } = useAuthStore();
  const canManageEffects = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';

  const {
    data: character,
    isLoading: charLoading,
    error: charError,
  } = useCharacter(campaignId!, characterId!);

  const {
    data: effects,
    isLoading: effectsLoading,
    error: effectsError,
    refetch: refetchEffects,
  } = useCharacterEffects(campaignId!, characterId!);

  const { data: buffsDebuffs, isLoading: bdLoading } = useBuffsDebuffs(undefined, canManageEffects);

  const applyMutation = useApplyEffect();
  const removeMutation = useRemoveEffect();

  /* ---- local state ---- */
  const [searchTerm, setSearchTerm] = useState('');
  const [durationRounds, setDurationRounds] = useState('');
  const [selectedBdId, setSelectedBdId] = useState<string | null>(null);

  /* ---- filter picker list ---- */
  const filteredBd = useMemo(() => {
    if (!buffsDebuffs) return [];
    const q = searchTerm.toLowerCase();
    return buffsDebuffs.filter(
      (bd) =>
        bd.name.toLowerCase().includes(q) ||
        (bd.description ?? '').toLowerCase().includes(q),
    );
  }, [buffsDebuffs, searchTerm]);

  /* ---- derived counts ---- */
  const buffCount =
    effects?.filter((e) => e.isBuff).length ?? 0;
  const debuffCount =
    effects?.filter((e) => !e.isBuff).length ?? 0;

  /* ---- handlers ---- */
  const handleApply = () => {
    if (!campaignId || !characterId || !selectedBdId) return;
    const rounds = Number(durationRounds);
    applyMutation.mutate(
      {
        campaignId,
        characterId,
        data: {
          buffDebuffId: selectedBdId,
          remainingRounds: rounds > 0 ? rounds : undefined,
        },
      },
      {
        onSuccess: () => {
          setSelectedBdId(null);
          setDurationRounds('');
        },
      },
    );
  };

  const handleRemove = (effectId: string) => {
    if (!campaignId || !characterId) return;
    removeMutation.mutate({ campaignId, characterId, effectId });
  };

  /* ---- loading ---- */
  const isLoading = charLoading || effectsLoading;
  const backTo = `/campaigns/${campaignId}/characters/${characterId}`;
  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />
        <div className={s.headerBlock}>
          <p className={cn('ao-overline', s.overlineGold)}>
            {t('camp2.effect.charEffectsOverline')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>
            {t('camp2.effect.activeEffectsTitle')}
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
  if (charError || effectsError) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />
        <div className={s.errorBlock}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('camp2.effect.loadError')}
          </p>
          {isRetryableError(charError) && isRetryableError(effectsError) && (
            <button className="ao-btn" onClick={() => refetchEffects()}>
              {t('common.retry')}
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.character')} className={s.backLink} />
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>
            {t('camp2.effect.gmTools')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>
            {t('camp2.effect.applyTitle')}
          </h3>
          {character && (
            <p className={cn('ao-italic', s.subtitle)}>
              {t('camp2.effect.effectsFor')}{' '}
              <strong>{character.name}</strong>
            </p>
          )}
        </div>
        {canManageEffects && (
          <OrdoChip tone="arcane" glyph="sigil-1">
            {t('camp2.effect.gmChip')}
          </OrdoChip>
        )}
      </div>

      {/* Main Grid: Picker + Active Ledger */}
      <div className={cn('ao-rgrid', s.mainGrid, !canManageEffects && s.single)}>
        {/* ════════════ Picker Panel ════════════ */}
        <OrdoPanel frame padding={0} className={canManageEffects ? undefined : s.hidden}>
          <PanelHeader
            title={t('camp2.effect.picker')}
            sub={t('camp2.effect.available', { count: filteredBd.length })}
            glyph="flame"
            tone="ember"
          />

          {/* Search */}
          <div className={s.searchWrap}>
            <div className={s.searchBox}>
              <Rune kind="search" size={14} color="var(--ink-faint)" />
              <input
                className={s.searchInput}
                placeholder={t('camp2.effect.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div className={s.list}>
            {bdLoading ? (
              <div className={s.loadingBox}>
                <Loader2 className={cn('h-5 w-5 animate-spin', s.spinnerInk)} />
              </div>
            ) : filteredBd.length === 0 ? (
              <div className={s.emptyBox}>
                <p className={cn('ao-italic', s.emptyText)}>
                  {t('camp2.effect.noMatch')}
                </p>
              </div>
            ) : (
              filteredBd.map((bd) => {
                const isActive = selectedBdId === bd.id;
                return (
                  <div
                    key={bd.id}
                    className={cn(s.bdRow, isActive && s.active)}
                    onClick={() =>
                      setSelectedBdId(isActive ? null : bd.id)
                    }
                  >
                    <Rune
                      kind={bd.isBuff ? 'arrow-up' : 'minus'}
                      size={14}
                      color={bd.isBuff ? '#7a9866' : '#c9803a'}
                    />
                    <div className={s.bdMain}>
                      <div className={s.bdNameRow}>
                        <span className={cn('ao-h5', s.bdName)}>
                          {bd.name}
                        </span>
                        <span className={cn('ao-overline', s.bdTag, bd.isBuff ? s.tagBuff : s.tagDebuff)}>
                          {bd.isBuff ? t('camp2.effect.buff') : t('camp2.effect.debuff')}
                        </span>
                      </div>
                      {bd.targetStatName &&
                        bd.modifierValue != null && (
                          <div className={s.modTagWrap}>
                            <ModifierTag
                              stat={bd.targetStatName}
                              value={bd.modifierValue}
                              size="sm"
                            />
                          </div>
                        )}
                    </div>
                    {isActive && (
                      <Rune
                        kind="check"
                        size={14}
                        color="var(--gold)"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Duration + Apply */}
          {selectedBdId && (
            <div className={s.applyBar}>
              <div className={s.durationRow}>
                <label className={cn('ao-label', s.durationLabel)}>
                  {t('camp2.effect.durationRounds')}
                </label>
                <input
                  className={cn('ao-input', s.durationInput)}
                  type="number"
                  min="0"
                  value={durationRounds}
                  onChange={(e) =>
                    setDurationRounds(e.target.value)
                  }
                  placeholder={t('camp2.effect.permanent')}
                />
              </div>
              <button
                className={cn('ao-btn ao-btn--primary', s.applyBtn)}
                onClick={handleApply}
                disabled={applyMutation.isPending}
              >
                {applyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rune
                      kind="flame"
                      size={14}
                      color="currentColor"
                    />
                    <span className={s.ml6}>
                      {t('camp2.effect.impose')}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </OrdoPanel>

        {/* ════════════ Active Effects Ledger ════════════ */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.effect.activeEffects')}
            sub={t('camp2.effect.buffsDebuffsCount', { buffs: buffCount, debuffs: debuffCount })}
            glyph="sigil-2"
          />

          {/* Effect Rows */}
          {!effects || effects.length === 0 ? (
            <div className={s.ledgerEmpty}>
              <p className={cn('ao-italic', s.emptyText)}>
                {t('camp2.effect.noneActive')}
              </p>
            </div>
          ) : (
            <div>
              {/* Buffs section */}
              {buffCount > 0 && (
                <>
                  <div className={cn(s.sectionHead, s.sectionHeadBuff)}>
                    <span className={cn('ao-overline', s.sectionLabel, s.tagBuff)}>
                      {t('camp2.effect.boons', { count: buffCount })}
                    </span>
                  </div>
                  {effects
                    .filter((e) => e.isBuff)
                    .map((effect) => (
                      <EffectRow
                        key={effect.id}
                        effect={effect}
                        onRemove={canManageEffects ? () => handleRemove(effect.id) : undefined}
                      />
                    ))}
                </>
              )}

              {/* Debuffs section */}
              {debuffCount > 0 && (
                <>
                  <div className={cn(s.sectionHead, s.sectionHeadDebuff)}>
                    <span className={cn('ao-overline', s.sectionLabel, s.tagDebuff)}>
                      {t('camp2.effect.banes', { count: debuffCount })}
                    </span>
                  </div>
                  {effects
                    .filter((e) => !e.isBuff)
                    .map((effect) => (
                      <EffectRow
                        key={effect.id}
                        effect={effect}
                        onRemove={canManageEffects ? () => handleRemove(effect.id) : undefined}
                      />
                    ))}
                </>
              )}
            </div>
          )}
        </OrdoPanel>
      </div>
    </div>
  );
}
