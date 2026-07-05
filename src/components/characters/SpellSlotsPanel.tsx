import { OrdoInterfaceIcon, OrdoPanel, PanelHeader, Rune, spellLevelIcon } from '@/components/ordo';
import { useSpellSlots, useSpellSlotActions } from '@/hooks/useSpellSlots';
import { useT } from '@/i18n/I18nContext';
import { isRetryableError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import s from './SpellSlotsPanel.module.css';

interface SpellSlotsPanelProps {
  characterId: string;
  /** Owner / GM / admin (and the character is alive). Gates expend/restore controls. */
  canManage?: boolean;
  /** Skip the fetch entirely (e.g. while the host tab is not visible). */
  enabled?: boolean;
  className?: string;
}

/**
 * Per-level spell slot tracker. Maxima are derived server-side from class
 * progression, so a non-caster simply receives an empty level list and this
 * panel renders nothing. Filled pips = available, hollow pips = expended.
 */
export function SpellSlotsPanel({
  characterId,
  canManage = false,
  enabled = true,
  className,
}: SpellSlotsPanelProps) {
  const t = useT();
  const { data, isLoading, error, refetch } = useSpellSlots(characterId, enabled);
  const { expend, restoreAll, restoreHalf } = useSpellSlotActions(characterId);

  const levels = data?.levels ?? [];
  const busy = expend.isPending || restoreAll.isPending || restoreHalf.isPending;
  const totalExpended = levels.reduce((sum, lvl) => sum + lvl.expended, 0);

  if (isLoading) return null;

  if (error) {
    return (
      <OrdoPanel frame padding={0} className={className}>
        <PanelHeader title={t('camp.slots.title')} icon="spell-slot" tone="arcane" />
        <div className={s.notice}>
          <span className="ao-italic">{t('camp.slots.error')}</span>
          {isRetryableError(error) && (
            <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => refetch()}>
              {t('camp.retry')}
            </button>
          )}
        </div>
      </OrdoPanel>
    );
  }

  // Non-caster: the backend serves no levels — nothing to track.
  if (levels.length === 0) return null;

  return (
    <OrdoPanel frame padding={0} className={className}>
      <PanelHeader
        title={t('camp.slots.title')}
        sub={t('camp.slots.sub')}
        icon="spell-slot"
        tone="arcane"
        right={
          canManage ? (
            <div className="ao-row ao-gap-6">
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                disabled={busy || totalExpended === 0}
                onClick={() => restoreHalf.mutate()}
              >
                {t('camp.slots.restoreHalf')}
              </button>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                disabled={busy || totalExpended === 0}
                onClick={() => restoreAll.mutate()}
              >
                {t('camp.slots.restoreAll')}
              </button>
            </div>
          ) : undefined
        }
      />

      <div className={s.rows}>
        {levels.map((lvl) => (
          <div key={lvl.spellLevel} className={s.row}>
            <span className={cn('ao-overline', s.level)}>
              <OrdoInterfaceIcon icon={spellLevelIcon(lvl.spellLevel)} size={12} />
              {t('camp.slots.level', { level: lvl.spellLevel })}
            </span>

            <div className={s.pips}>
              {Array.from({ length: lvl.max }).map((_, i) => {
                const filled = i < lvl.available;
                return (
                  <OrdoInterfaceIcon
                    key={i}
                    icon={filled ? 'spell-slot-available' : 'spell-slot-used'}
                    size={14}
                    style={{ color: filled ? 'var(--gold-pale)' : 'var(--ink-ghost)' }}
                  />
                );
              })}
            </div>

            <span className={cn('ao-num', s.count)}>
              {lvl.available}
              <span className={s.countMax}> / {lvl.max}</span>
            </span>

            {canManage && (
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                disabled={busy || lvl.available === 0}
                onClick={() => expend.mutate(lvl.spellLevel)}
              >
                <Rune kind="minus" size={10} /> {t('camp.slots.expend')}
              </button>
            )}
          </div>
        ))}
      </div>
    </OrdoPanel>
  );
}
