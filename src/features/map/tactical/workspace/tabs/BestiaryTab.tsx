/**
 * GM "Бестиарий" tab — searchable monster picker (campaign monsters first, then
 * the public list). Adding a monster mutates the ASSEMBLING battle through the
 * core API; counts reflect how many of each are already in the group.
 */

import { useMemo, useState } from 'react';
import { Rune } from '@/components/ordo';
import { useCampaignMonsters, usePublicMonsters } from '@/hooks/useBestiary';
import { useAddBattleMonster } from '@/hooks/useBattles';
import { useI18n, useT } from '@/i18n/I18nContext';
import { localizedName } from '@/lib/localized';
import { cn } from '@/lib/utils';
import type { BattleResponse, MonsterSummaryResponse } from '@/types';
import s from '../workspace.module.css';

interface BestiaryTabProps {
  campaignId: string;
  battle: BattleResponse;
}

export function BestiaryTab({ campaignId, battle }: BestiaryTabProps) {
  const t = useT();
  const { lang } = useI18n();
  const [search, setSearch] = useState('');

  const { data: campaignMonsters } = useCampaignMonsters(campaignId);
  const { data: publicMonsters } = usePublicMonsters();
  const addMonster = useAddBattleMonster();

  const mName = (m: MonsterSummaryResponse) =>
    localizedName(m, lang);

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
        m.nameRusloc.toLowerCase().includes(q) || (m.nameEngloc ?? '').toLowerCase().includes(q),
    );
  };

  const campaignList = filterMonsters(campaignMonsters ?? []);
  const publicList = filterMonsters(publicMonsters ?? []);

  const addOne = (monsterId: string) =>
    addMonster.mutate({
      campaignId,
      battleId: battle.id,
      data: { monsters: [{ monsterId, count: 1 }] },
    });

  const renderRow = (m: MonsterSummaryResponse) => {
    const count = countByMonster.get(m.id) ?? 0;
    return (
      <div key={m.id} className={s.listRow}>
        <div className={s.listMain}>
          <div className={s.listName}>{mName(m)}</div>
          <div className={s.listMeta}>
            {t('battle.stats.cr')} {m.crRating}
          </div>
        </div>
        {count > 0 && <span className={s.countTag}>&times;{count}</span>}
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

  return (
    <div className={s.tabPad}>
      <div className={cn('ao-row ao-gap-8', s.tabHead)}>
        <Rune kind="book" size={16} color="var(--arcane)" />
        <span className={cn('ao-overline', s.arcaneOverline)}>{t('battle.assembly.monstersTitle')}</span>
      </div>
      <input
        className={cn('ao-input', s.searchField)}
        placeholder={t('battle.assembly.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className={cn('ao-scroll', s.list)}>
        {campaignList.length === 0 && publicList.length === 0 ? (
          <div className={s.muted}>{t('battle.assembly.noMonsters')}</div>
        ) : (
          <>
            {campaignList.length > 0 && (
              <>
                <div className={cn('ao-overline', s.subHdr)}>{t('battle.assembly.campaignMonsters')}</div>
                {campaignList.map(renderRow)}
              </>
            )}
            {publicList.length > 0 && (
              <>
                <div className={cn('ao-overline', s.subHdr)}>{t('battle.assembly.publicMonsters')}</div>
                {publicList.map(renderRow)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
