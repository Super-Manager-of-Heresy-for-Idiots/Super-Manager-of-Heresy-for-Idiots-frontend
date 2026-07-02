import { useMemo, useState } from 'react';
import { EmptyVault, OrdoPanel, Rune } from '@/components/ordo';
import { useCampaignContext } from '@/components/layout/CampaignLayout';
import { useAuthStore } from '@/store/authStore';
import { useCampaignBattles, useCreateBattle } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { isCampaignGmOrAdmin } from '@/lib/campaignAccess';
import { cn } from '@/lib/utils';
import { BattleAssembly } from './BattleAssembly';
import { BattleActive } from './BattleActive';
import s from './BattlePanel.module.css';

interface BattlePanelProps {
  campaignId: string;
}

/**
 * Battle tab orchestrator. Picks the view from role + battle state:
 *  - ACTIVE battle      → live tracker (both roles).
 *  - ASSEMBLING + GM    → assembly wizard.
 *  - otherwise          → neutral empty state (+ "start" for the GM).
 *
 * The actual battle data is realtime: WS events on the campaign topic
 * invalidate ['campaigns', id, 'battles'] (see useWebSocket).
 */
export function BattlePanel({ campaignId }: BattlePanelProps) {
  const t = useT();
  const { campaign } = useCampaignContext();
  const { user } = useAuthStore();
  const isGm = isCampaignGmOrAdmin(user, campaign);

  const { data: battles, isLoading } = useCampaignBattles(campaignId);
  const createBattle = useCreateBattle();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const { active, assembling } = useMemo(() => {
    const list = battles ?? [];
    return {
      active: list.find((b) => b.status === 'ACTIVE'),
      assembling: list.find((b) => b.status === 'ASSEMBLING'),
    };
  }, [battles]);

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.skTitle)} />
        <div className={cn('ao-ph', s.skLine)} />
      </div>
    );
  }

  if (active) {
    return <BattleActive battle={active} campaignId={campaignId} isGm={isGm} />;
  }

  if (isGm && assembling) {
    return <BattleAssembly battle={assembling} campaignId={campaignId} />;
  }

  // ── neutral empty state ──────────────────────────────────────
  const startCreate = () => {
    setName(t('battle.create.defaultName'));
    setCreating(true);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createBattle.mutate(
      { campaignId, data: { name: trimmed } },
      { onSuccess: () => setCreating(false) },
    );
  };

  return (
    <div className={s.empty}>
      <EmptyVault
        glyph="sword"
        title={isGm ? t('battle.empty.gm.title') : t('battle.empty.player.title')}
        body={isGm ? t('battle.empty.gm.body') : t('battle.empty.player.body')}
        action={
          isGm && !creating ? (
            <button className="ao-btn ao-btn--primary" onClick={startCreate}>
              <Rune kind="sword" size={14} color="currentColor" />
              <span className={s.ml6}>{t('battle.start')}</span>
            </button>
          ) : undefined
        }
      />

      {isGm && creating && (
        <OrdoPanel frame className={s.createForm}>
          <label className={cn('ao-label', s.field)} htmlFor="battle-name">
            {t('battle.create.namePlaceholder')}
          </label>
          <input
            id="battle-name"
            className="ao-input"
            value={name}
            autoFocus
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          <div className={s.createRow}>
            <button
              className="ao-btn ao-btn--primary"
              disabled={!name.trim() || createBattle.isPending}
              onClick={submit}
            >
              {t('battle.create.confirm')}
            </button>
            <button className="ao-btn ao-btn--ghost" onClick={() => setCreating(false)}>
              {t('battle.create.cancel')}
            </button>
          </div>
        </OrdoPanel>
      )}
    </div>
  );
}
