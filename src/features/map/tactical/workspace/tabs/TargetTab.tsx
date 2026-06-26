/**
 * Player "Цель" tab — read-only info on the token selected on the map: name, type,
 * HP, position, distance from the player's active token, and status. The attack
 * itself is launched from the "Персонаж" tab, where this selection is pre-filled.
 */

import { useMemo } from 'react';
import { Bar } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleCombatantResponse } from '@/types';
import { useMapTransientStore } from '../../../state';
import { gridChebyshevDistance } from '../../tacticalSelection';
import type { TacticalTokenView } from '../../tacticalView';
import s from '../workspace.module.css';

interface TargetTabProps {
  tacticalTokens: TacticalTokenView[];
  activeCombatant: BattleCombatantResponse | null;
}

export function TargetTab({ tacticalTokens, activeCombatant }: TargetTabProps) {
  const t = useT();
  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const view = useMemo(
    () => (selectedTokenId ? tacticalTokens.find((tk) => tk.tokenId === selectedTokenId) ?? null : null),
    [selectedTokenId, tacticalTokens],
  );

  const distance = useMemo(() => {
    if (!view || !activeCombatant) return null;
    const origin = tacticalTokens.find((tk) => tk.linkedCombatantId === activeCombatant.id);
    if (!origin || origin.tokenId === view.tokenId) return null;
    return gridChebyshevDistance(origin, view);
  }, [view, activeCombatant, tacticalTokens]);

  if (!view) {
    return (
      <div className={s.tabPad}>
        <p className={cn('ao-overline', s.emberOverline)}>{t('tactical.target.overline')}</p>
        <p className={cn('ao-italic', s.tabSub)}>{t('tactical.target.empty')}</p>
      </div>
    );
  }

  const hpKnown = view.currentHp != null && view.maxHp != null;
  const down = view.currentHp != null && view.currentHp <= 0;

  return (
    <div className={s.tabPad}>
      <p className={cn('ao-overline', s.emberOverline)}>{t('tactical.target.overline')}</p>
      <h4 className={cn('ao-h4', s.tabTitle)}>{view.displayName}</h4>
      <p className={cn('ao-num', s.tabSubMono)}>{view.tokenType}</p>

      {hpKnown && (
        <div className={s.block}>
          <div className="ao-row ao-between">
            <span className={cn('ao-overline', s.fieldLabel)}>{t('tactical.inspect.hp')}</span>
            <span className="ao-num">
              {view.currentHp}/{view.maxHp}
            </span>
          </div>
          <Bar value={view.currentHp!} max={view.maxHp!} tone="ember" height={6} showNumbers={false} />
        </div>
      )}

      <dl className={s.kvGrid}>
        <dt>{t('tactical.inspect.position')}</dt>
        <dd>
          {view.gridX}, {view.gridY}
        </dd>
        {distance != null && (
          <>
            <dt>{t('tactical.inspect.distance')}</dt>
            <dd>
              {distance} {t('tactical.inspect.cells')}
            </dd>
          </>
        )}
        <dt>{t('tactical.target.status')}</dt>
        <dd>{down ? t('tactical.target.down') : t('tactical.target.active')}</dd>
      </dl>

      <p className={cn('ao-italic', s.hint)}>{t('tactical.target.selectHint')}</p>
    </div>
  );
}
