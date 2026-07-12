/**
 * Surprise & readied actions (Phase 3.7). Surprise: the GM marks which combatants are caught off guard
 * — they can't act on round 1 (the server rejects their action/reaction slots) and the flag clears after
 * their first turn. Ready: the acting combatant spends its action to prepare a described action; when its
 * trigger occurs the GM/owner fires it, spending the reaction. Reuses the action-economy + reaction slots.
 */

import { useState } from 'react';
import { useSetSurprised, useReadyAction, useTriggerReady } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse } from '@/types';
import s from './workspace.module.css';

type Combatant = BattleResponse['combatants'][number];

export function SurpriseReadyPanel({
  campaignId,
  battle,
  current,
}: {
  campaignId: string;
  battle: BattleResponse;
  current?: Combatant | null;
}) {
  const t = useT();
  const setSurprised = useSetSurprised();
  const readyAction = useReadyAction();
  const triggerReady = useTriggerReady();
  const [desc, setDesc] = useState('');
  const [surpriseId, setSurpriseId] = useState('');

  const selected = battle.combatants.find((c) => c.id === surpriseId);

  const declare = () => {
    if (!current || !desc.trim()) return;
    readyAction.mutate(
      { campaignId, battleId: battle.id, combatantId: current.id, description: desc.trim() },
      { onSuccess: () => setDesc('') },
    );
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.ready.title')}</div>

      {/* Ready: the current combatant prepares / fires an action */}
      {current ? (
        current.readiedAction ? (
          <div className={cn('ao-col ao-gap-4', s.mt8)}>
            <div className={s.hint}>
              {current.displayName}: {current.readiedAction}
            </div>
            <button
              type="button"
              className="ao-btn ao-btn--sm ao-btn--primary"
              disabled={triggerReady.isPending}
              onClick={() => triggerReady.mutate({ campaignId, battleId: battle.id, combatantId: current.id })}
            >
              {t('tactical.ready.trigger')}
            </button>
          </div>
        ) : (
          <div className={cn('ao-col ao-gap-4', s.mt8)}>
            <input
              className={cn('ao-input', s.condSelect)}
              value={desc}
              placeholder={t('tactical.ready.placeholder')}
              onChange={(e) => setDesc(e.target.value)}
            />
            <button
              type="button"
              className="ao-btn ao-btn--sm ao-btn--primary"
              disabled={!desc.trim() || readyAction.isPending}
              onClick={declare}
            >
              {t('tactical.ready.declare')}
            </button>
          </div>
        )
      ) : (
        <div className={s.hint}>{t('tactical.ready.noCurrent')}</div>
      )}

      {/* Surprise: GM marks a combatant caught off guard */}
      <div className={cn('ao-overline', s.fieldLabel, s.mt12)}>{t('tactical.surprise.title')}</div>
      <div className={cn('ao-col ao-gap-4', s.mt8)}>
        <select
          className={cn('ao-input', s.condSelect)}
          value={surpriseId}
          onChange={(e) => setSurpriseId(e.target.value)}
        >
          <option value="">{t('tactical.surprise.pick')}</option>
          {battle.combatants.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
              {c.surprised ? ` · ${t('tactical.surprise.badge')}` : ''}
            </option>
          ))}
        </select>
        {selected && (
          <button
            type="button"
            className="ao-btn ao-btn--sm ao-btn--ghost"
            disabled={setSurprised.isPending}
            onClick={() =>
              setSurprised.mutate({
                campaignId,
                battleId: battle.id,
                combatantId: selected.id,
                surprised: !selected.surprised,
              })
            }
          >
            {selected.surprised ? t('tactical.surprise.clear') : t('tactical.surprise.set')}
          </button>
        )}
      </div>
    </div>
  );
}
