import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  ModifierTag,
  EmptyVault,
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
        <BackLink to={backTo} label={t('camp2.back.character')} style={{ marginBottom: 12 }} />
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>
            {t('camp2.effect.charEffectsOverline')}
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            {t('camp2.effect.activeEffectsTitle')}
          </h3>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: 20,
          }}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="ao-panel ao-frame ao-breathe"
              style={{ padding: 24, minHeight: 320 }}
            >
              <span className="ao-frame-c" />
              <div
                className="ao-ph"
                style={{ width: '50%', height: 16, marginBottom: 16 }}
              />
              <div
                className="ao-ph"
                style={{ width: '80%', height: 14, marginBottom: 8 }}
              />
              <div
                className="ao-ph"
                style={{ width: '60%', height: 14 }}
              />
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
        <BackLink to={backTo} label={t('camp2.back.character')} style={{ marginBottom: 12 }} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p
            className="ao-italic"
            style={{ color: 'var(--ink-faint)', marginBottom: 16 }}
          >
            {t('camp2.effect.loadError')}
          </p>
          <button className="ao-btn" onClick={() => refetchEffects()}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  /* ---- render ---- */
  return (
    <div>
      <BackLink to={backTo} label={t('camp2.back.character')} style={{ marginBottom: 12 }} />
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>
            {t('camp2.effect.gmTools')}
          </p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>
            {t('camp2.effect.applyTitle')}
          </h3>
          {character && (
            <p
              className="ao-italic"
              style={{
                color: 'var(--ink-quiet)',
                fontSize: 13,
                marginTop: 4,
              }}
            >
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
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: canManageEffects ? '1fr 1.2fr' : '1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        {/* ════════════ Picker Panel ════════════ */}
        <OrdoPanel frame padding={0} style={{ display: canManageEffects ? undefined : 'none' }}>
          <PanelHeader
            title={t('camp2.effect.picker')}
            sub={t('camp2.effect.available', { count: filteredBd.length })}
            glyph="flame"
            tone="ember"
          />

          {/* Search */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--rule)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                border: '1px solid var(--rule)',
                background: 'var(--abyss)',
              }}
            >
              <Rune kind="search" size={14} color="var(--ink-faint)" />
              <input
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                }}
                placeholder={t('camp2.effect.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {bdLoading ? (
              <div
                style={{
                  padding: 24,
                  textAlign: 'center',
                }}
              >
                <Loader2
                  className="h-5 w-5 animate-spin"
                  style={{ color: 'var(--ink-faint)', margin: '0 auto' }}
                />
              </div>
            ) : filteredBd.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p
                  className="ao-italic"
                  style={{ color: 'var(--ink-faint)', fontSize: 13 }}
                >
                  {t('camp2.effect.noMatch')}
                </p>
              </div>
            ) : (
              filteredBd.map((bd) => {
                const isActive = selectedBdId === bd.id;
                return (
                  <div
                    key={bd.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--hairline)',
                      background: isActive
                        ? 'rgba(212,180,120,0.08)'
                        : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      setSelectedBdId(isActive ? null : bd.id)
                    }
                  >
                    <Rune
                      kind={bd.isBuff ? 'arrow-up' : 'minus'}
                      size={14}
                      color={bd.isBuff ? '#7a9866' : '#c9803a'}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          className="ao-h5"
                          style={{ fontSize: 12 }}
                        >
                          {bd.name}
                        </span>
                        <span
                          className="ao-overline"
                          style={{
                            fontSize: 8,
                            color: bd.isBuff
                              ? '#7a9866'
                              : '#c9803a',
                          }}
                        >
                          {bd.isBuff ? t('camp2.effect.buff') : t('camp2.effect.debuff')}
                        </span>
                      </div>
                      {bd.targetStatName &&
                        bd.modifierValue != null && (
                          <div
                            style={{
                              marginTop: 3,
                            }}
                          >
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
            <div
              style={{
                padding: '14px 16px',
                borderTop: '1px solid var(--rule)',
                background: 'var(--abyss)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <label
                  className="ao-label"
                  style={{ marginBottom: 0, fontSize: 11 }}
                >
                  {t('camp2.effect.durationRounds')}
                </label>
                <input
                  className="ao-input"
                  type="number"
                  min="0"
                  value={durationRounds}
                  onChange={(e) =>
                    setDurationRounds(e.target.value)
                  }
                  placeholder={t('camp2.effect.permanent')}
                  style={{
                    width: 100,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                />
              </div>
              <button
                className="ao-btn ao-btn--primary"
                style={{ width: '100%' }}
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
                    <span style={{ marginLeft: 6 }}>
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
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
              }}
            >
              <p
                className="ao-italic"
                style={{
                  color: 'var(--ink-faint)',
                  fontSize: 13,
                }}
              >
                {t('camp2.effect.noneActive')}
              </p>
            </div>
          ) : (
            <div>
              {/* Buffs section */}
              {buffCount > 0 && (
                <>
                  <div
                    style={{
                      padding: '6px 16px',
                      background: 'rgba(122,152,102,0.04)',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span
                      className="ao-overline"
                      style={{
                        fontSize: 9,
                        color: '#7a9866',
                      }}
                    >
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
                  <div
                    style={{
                      padding: '6px 16px',
                      background: 'rgba(201,128,58,0.04)',
                      borderBottom: '1px solid var(--hairline)',
                    }}
                  >
                    <span
                      className="ao-overline"
                      style={{
                        fontSize: 9,
                        color: '#c9803a',
                      }}
                    >
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
