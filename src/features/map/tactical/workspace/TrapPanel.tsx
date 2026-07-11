/**
 * GM traps (Phase 3.2): place a hidden trap on the selected cell (save DC / ability / damage), then
 * trigger it on a target — the core resolves the save + damage (reusing the save/mitigation primitives)
 * and logs it. Traps are session elements hidden from players; the GM manages them here. Placement uses
 * the map's selected cell (click an empty cell first). On-enter auto-trigger is a follow-up.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTriggerTrap } from '@/hooks/useBattles';
import { useMapSessionStore, useMapTransientStore } from '../../state';
import { mapSessionApi } from '../../api';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import s from './workspace.module.css';

const ABILITIES = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'] as const;

export function TrapPanel({
  campaignId,
  sessionId,
  battle,
}: {
  campaignId: string;
  sessionId: string;
  battle: BattleResponse;
}) {
  const t = useT();
  const triggerTrap = useTriggerTrap();
  const mapElements = useMapSessionStore((st) => st.mapElements);
  const selectedCell = useMapTransientStore((st) => st.selectedCell);
  const [damageStr, setDamageStr] = useState('');
  const [dcStr, setDcStr] = useState('');
  const [ability, setAbility] = useState<(typeof ABILITIES)[number]>('DEXTERITY');
  const [half, setHalf] = useState(true);
  const [label, setLabel] = useState('');
  const [targetId, setTargetId] = useState('');
  const [busy, setBusy] = useState(false);

  const traps = mapElements.filter(
    (el) => el.mapSessionId != null && (el.properties as Record<string, unknown>)?.trap === true,
  );
  const alive = battle.combatants.filter((c) => c.currentHp == null || c.currentHp > 0);
  const prop = (el: (typeof traps)[number], key: string) => (el.properties as Record<string, unknown>)?.[key];

  const create = () => {
    if (!selectedCell || busy) return;
    setBusy(true);
    mapSessionApi
      .createTrap(sessionId, {
        gridX: selectedCell.gridX,
        gridY: selectedCell.gridY,
        damage: parseInt(damageStr, 10) || 0,
        saveDc: parseInt(dcStr, 10) || undefined,
        saveAbility: dcStr ? ability : undefined,
        halfOnSave: half,
        triggerType: 'MANUAL',
        hidden: true,
        label: label || undefined,
      })
      .then(() => {
        setDamageStr('');
        setDcStr('');
        setLabel('');
      })
      .catch(() => toast.error(t('tactical.trap.failed')))
      .finally(() => setBusy(false));
  };

  const trigger = (el: (typeof traps)[number]) => {
    if (!targetId) return;
    triggerTrap.mutate({
      campaignId,
      battleId: battle.id,
      data: {
        targetCombatantId: targetId,
        amount: Number(prop(el, 'damage')) || 0,
        saveDc: prop(el, 'saveDc') != null ? Number(prop(el, 'saveDc')) : undefined,
        saveAbility: (prop(el, 'saveAbility') as string) || undefined,
        halfOnSave: prop(el, 'halfOnSave') === true,
        label: (prop(el, 'label') as string) || undefined,
      },
    });
  };

  const remove = (elementId: string) => {
    setBusy(true);
    mapSessionApi
      .deleteTrap(sessionId, elementId)
      .catch(() => toast.error(t('tactical.trap.failed')))
      .finally(() => setBusy(false));
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.trap.title')}</div>
      <div className={s.hint}>
        {selectedCell ? t('tactical.trap.cell', { x: selectedCell.gridX, y: selectedCell.gridY }) : t('tactical.trap.pickCell')}
      </div>
      <div className={cn('ao-col ao-gap-4', s.mt8)}>
        <div className="ao-row ao-gap-4 ao-wrap">
          <input
            className={cn('ao-input', s.numField)}
            inputMode="numeric"
            value={damageStr}
            placeholder={t('tactical.trap.damage')}
            onChange={(e) => setDamageStr(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <input
            className={cn('ao-input', s.numField)}
            inputMode="numeric"
            value={dcStr}
            placeholder={t('tactical.trap.dc')}
            onChange={(e) => setDcStr(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <select className={cn('ao-input', s.sizeSelect)} value={ability} onChange={(e) => setAbility(e.target.value as typeof ability)}>
            {ABILITIES.map((a) => (
              <option key={a} value={a}>
                {t(`tactical.trap.ability.${a}`)}
              </option>
            ))}
          </select>
        </div>
        <label className="ao-row ao-gap-8">
          <input type="checkbox" checked={half} onChange={(e) => setHalf(e.target.checked)} />
          <span className={s.hint}>{t('tactical.trap.half')}</span>
        </label>
        <input
          className={cn('ao-input', s.condSelect)}
          value={label}
          placeholder={t('tactical.trap.label')}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button type="button" className="ao-btn ao-btn--sm ao-btn--primary" disabled={!selectedCell || busy} onClick={create}>
          {t('tactical.trap.create')}
        </button>
      </div>

      {traps.length > 0 && (
        <div className={cn('ao-col ao-gap-4', s.mt12)}>
          <select className={cn('ao-input', s.condSelect)} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">{t('tactical.trap.pickTarget')}</option>
            {alive.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
          {traps.map((el) => (
            <div key={el.id} className="ao-row ao-between ao-gap-8">
              <span className={s.optName}>
                {(prop(el, 'label') as string) || t('tactical.trap.title')} · {String(prop(el, 'damage') ?? 0)}
              </span>
              <div className="ao-row ao-gap-4">
                <button
                  type="button"
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  disabled={!targetId || triggerTrap.isPending}
                  onClick={() => trigger(el)}
                >
                  {t('tactical.trap.trigger')}
                </button>
                <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" disabled={busy} onClick={() => remove(el.id)}>
                  {t('tactical.trap.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
