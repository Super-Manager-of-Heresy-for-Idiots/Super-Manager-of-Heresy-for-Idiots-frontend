import { useEffect, useMemo, useState } from 'react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useCampaignMonsters, usePublicMonsters } from '@/hooks/useBestiary';
import {
  useAddBattleMonster,
  useRemoveCombatant,
  useOverrideBattleXp,
  useStartBattle,
  useEndBattle,
} from '@/hooks/useBattles';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useT, useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { BattleTacticalMapButton } from '@/features/map/tactical';
import type { BattleResponse, MonsterSummaryResponse } from '@/types';
import s from './BattleAssembly.module.css';

interface BattleAssemblyProps {
  battle: BattleResponse;
  campaignId: string;
}

/**
 * GM assembly wizard (battle.status === 'ASSEMBLING').
 *  - LEFT  : encounter stats + manual XP override + the assembled enemy group.
 *  - RIGHT : searchable bestiary (campaign monsters, then the public list).
 * On mobile the two sides collapse into a single column with a tab switch.
 */
export function BattleAssembly({ battle, campaignId }: BattleAssemblyProps) {
  const t = useT();
  const { lang } = useI18n();
  const isMobile = useIsMobile();

  const [section, setSection] = useState<'group' | 'bestiary'>('bestiary');
  const [search, setSearch] = useState('');
  const [xpDraft, setXpDraft] = useState('');

  const { data: campaignMonsters } = useCampaignMonsters(campaignId);
  const { data: publicMonsters } = usePublicMonsters();

  const addMonster = useAddBattleMonster();
  const removeCombatant = useRemoveCombatant();
  const overrideXp = useOverrideBattleXp();
  const startBattle = useStartBattle();
  const endBattle = useEndBattle();

  const displayedXp = battle.overrideXp ?? battle.totalXp;
  const hasOverride = battle.overrideXp != null;

  // Mirror the live XP into the editable field whenever the server value moves.
  useEffect(() => {
    setXpDraft(String(displayedXp));
  }, [displayedXp]);

  const mName = (m: MonsterSummaryResponse) =>
    lang === 'en' ? m.nameEngloc || m.nameRusloc : m.nameRusloc;

  const group = useMemo(
    () =>
      battle.combatants
        .filter((c) => c.type === 'MONSTER')
        .sort(
          (a, b) =>
            a.displayName.localeCompare(b.displayName) || a.instanceIndex - b.instanceIndex,
        ),
    [battle.combatants],
  );

  const countByMonster = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of battle.combatants) {
      if (c.type === 'MONSTER' && c.monsterId) {
        map.set(c.monsterId, (map.get(c.monsterId) ?? 0) + 1);
      }
    }
    return map;
  }, [battle.combatants]);

  const filterMonsters = (list: MonsterSummaryResponse[]) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (m) =>
        m.nameRusloc.toLowerCase().includes(q) ||
        (m.nameEngloc ?? '').toLowerCase().includes(q),
    );
  };

  const campaignList = filterMonsters(campaignMonsters ?? []);
  const publicList = filterMonsters(publicMonsters ?? []);

  const commitXp = () => {
    const n = parseInt(xpDraft, 10);
    if (!Number.isFinite(n) || n < 0) {
      setXpDraft(String(displayedXp));
      return;
    }
    if (n === displayedXp) return;
    overrideXp.mutate({ campaignId, battleId: battle.id, data: { overrideXp: n } });
  };

  const resetXp = () =>
    overrideXp.mutate({ campaignId, battleId: battle.id, data: { overrideXp: null } });

  const addOne = (monsterId: string) =>
    addMonster.mutate({
      campaignId,
      battleId: battle.id,
      data: { monsters: [{ monsterId, count: 1 }] },
    });

  const remove = (combatantId: string) =>
    removeCombatant.mutate({ campaignId, battleId: battle.id, combatantId });

  const start = () => {
    if (group.length === 0) return;
    startBattle.mutate({ campaignId, battleId: battle.id });
  };

  const cancel = () => endBattle.mutate({ campaignId, battleId: battle.id });

  /* ── panels ──────────────────────────────────────────────── */

  const statsPanel = (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('battle.assembly.title')} glyph="sword" sub={battle.name} />
      <div className={s.body}>
        <div className={s.statRow}>
          <div className={s.stat}>
            <div className={cn(s.statVal, s.valArcane)}>{battle.averageDanger.toFixed(1)}</div>
            <div className={s.statLbl}>{t('battle.stats.avgDanger')}</div>
          </div>
          <div className={s.stat}>
            <div className={cn(s.statVal, s.valGold)}>{displayedXp.toLocaleString()}</div>
            <div className={s.statLbl}>{t('battle.stats.totalXp')}</div>
          </div>
          <div className={s.stat}>
            <div className={s.statVal}>{battle.monsterCount}</div>
            <div className={s.statLbl}>{t('battle.stats.monsters')}</div>
          </div>
        </div>

        <div className={s.xpWrap}>
          <label className="ao-label" htmlFor="battle-xp">
            {t('battle.stats.xpOverride')}
          </label>
          <div className={s.xpRow}>
            <input
              id="battle-xp"
              className={cn('ao-input', s.xpField)}
              inputMode="numeric"
              value={xpDraft}
              onChange={(e) => setXpDraft(e.target.value.replace(/[^0-9]/g, ''))}
              onBlur={commitXp}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitXp();
              }}
            />
            {hasOverride ? (
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={resetXp}
                disabled={overrideXp.isPending}
              >
                {t('battle.stats.resetXp')}
              </button>
            ) : (
              <span className="ao-chip">{t('battle.stats.xpAuto')}</span>
            )}
          </div>
          <div className={s.xpHint}>{t('battle.stats.xpEditHint')}</div>
        </div>
      </div>
    </OrdoPanel>
  );

  const groupPanel = (
    <OrdoPanel frame padding={0}>
      <PanelHeader
        title={t('battle.assembly.groupTitle')}
        glyph="helm"
        right={<span className={s.count}>{group.length}</span>}
      />
      {group.length === 0 ? (
        <div className={s.muted}>{t('battle.assembly.empty')}</div>
      ) : (
        <div>
          {group.map((c) => (
            <div key={c.id} className={s.row}>
              <Rune kind="flame" size={16} color="var(--ember)" />
              <div className={s.rowMain}>
                <div className={s.rowName}>{c.displayName}</div>
                {c.maxHp != null && (
                  <div className={s.rowMeta}>
                    {t('battle.tracker.hp')} {c.maxHp}
                  </div>
                )}
              </div>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => remove(c.id)}
                disabled={removeCombatant.isPending}
                title={t('battle.assembly.remove')}
              >
                <Rune kind="x" size={10} color="currentColor" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={s.startWrap}>
        <button
          className="ao-btn ao-btn--primary ao-btn--block"
          onClick={start}
          disabled={group.length === 0 || startBattle.isPending}
        >
          <Rune kind="sword" size={14} color="currentColor" />
          <span className={s.ml6}>{t('battle.assembly.confirmStart')}</span>
        </button>
        {group.length === 0 && (
          <div className={cn(s.muted, s.mt12)}>{t('battle.assembly.needMonsters')}</div>
        )}
        <BattleTacticalMapButton
          campaignId={campaignId}
          battleId={battle.id}
          battleName={battle.name}
          block
          className={s.mt12}
        />
        <button
          className={cn('ao-btn ao-btn--ghost ao-btn--block', s.mt12)}
          onClick={cancel}
          disabled={endBattle.isPending}
        >
          {t('battle.assembly.cancelBattle')}
        </button>
      </div>
    </OrdoPanel>
  );

  const renderMonsterRow = (m: MonsterSummaryResponse) => {
    const count = countByMonster.get(m.id) ?? 0;
    return (
      <div key={m.id} className={s.row}>
        <div className={s.rowMain}>
          <div className={s.rowName}>{mName(m)}</div>
          <div className={s.rowMeta}>
            {t('battle.stats.cr')} {m.crRating}
          </div>
        </div>
        {count > 0 && <span className={s.count}>&times;{count}</span>}
        <button
          className="ao-btn ao-btn--ghost ao-btn--sm"
          onClick={() => addOne(m.id)}
          disabled={addMonster.isPending}
        >
          <Rune kind="plus" size={10} color="currentColor" />
          <span className={s.ml6}>{t('battle.assembly.add')}</span>
        </button>
      </div>
    );
  };

  const bestiaryPanel = (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('battle.assembly.monstersTitle')} glyph="book" tone="arcane" />
      <div className={s.search}>
        <input
          className="ao-input"
          placeholder={t('battle.assembly.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className={cn('ao-scroll', s.list)}>
        {campaignList.length === 0 && publicList.length === 0 ? (
          <div className={s.muted}>{t('battle.assembly.noMonsters')}</div>
        ) : (
          <>
            {campaignList.length > 0 && (
              <>
                <div className={cn('ao-overline', s.subHdr)}>
                  {t('battle.assembly.campaignMonsters')}
                </div>
                {campaignList.map(renderMonsterRow)}
              </>
            )}
            {publicList.length > 0 && (
              <>
                <div className={cn('ao-overline', s.subHdr)}>
                  {t('battle.assembly.publicMonsters')}
                </div>
                {publicList.map(renderMonsterRow)}
              </>
            )}
          </>
        )}
      </div>
    </OrdoPanel>
  );

  /* ── layout ──────────────────────────────────────────────── */

  if (isMobile) {
    return (
      <div className={s.single}>
        <div className={cn('ao-tabs', s.tabs)} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={section === 'bestiary'}
            className={cn('ao-tab', section === 'bestiary' && 'is-active')}
            onClick={() => setSection('bestiary')}
          >
            {t('battle.section.bestiary')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={section === 'group'}
            className={cn('ao-tab', section === 'group' && 'is-active')}
            onClick={() => setSection('group')}
          >
            {t('battle.section.group')}
          </button>
        </div>
        {section === 'bestiary' ? (
          bestiaryPanel
        ) : (
          <div className={s.stack}>
            {statsPanel}
            {groupPanel}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={s.cols}>
      <div className={s.stack}>
        {statsPanel}
        {groupPanel}
      </div>
      {bestiaryPanel}
    </div>
  );
}
