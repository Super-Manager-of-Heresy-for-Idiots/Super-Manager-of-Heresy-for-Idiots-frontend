/**
 * Right column of the unified workspace: a tabbed tool dock. Tabs are role- and
 * phase-aware (GM: Ход [active] · Осмотр · Бестиарий [assembling] · Сводка;
 * player: Персонаж · Цель). Selecting a token/cell on the map auto-focuses the
 * inspect/target tab. The "Осмотр" tab reuses the existing inspector panel.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleCombatantResponse, BattleResponse } from '@/types';
import { useMapTransientStore } from '../../state';
import { TacticalInspectorPanel } from '../TacticalInspectorPanel';
import type { TacticalTokenView } from '../tacticalView';
import type { MovementConfig } from './movement';
import { TurnTab } from './tabs/TurnTab';
import { BestiaryTab } from './tabs/BestiaryTab';
import { SummaryTab } from './tabs/SummaryTab';
import { CharacterTab } from './tabs/CharacterTab';
import { TargetTab } from './tabs/TargetTab';
import { LogTab } from './tabs/LogTab';
import s from './workspace.module.css';

type TabKey = 'turn' | 'inspect' | 'bestiary' | 'summary' | 'character' | 'target' | 'log';

interface RightDockProps {
  campaignId: string;
  battle: BattleResponse;
  isGm: boolean;
  currentUserId: string | null;
  tacticalTokens: TacticalTokenView[];
  activeCombatant: BattleCombatantResponse | null;
  movement: MovementConfig | null;
}

export function RightDock({
  campaignId,
  battle,
  isGm,
  currentUserId,
  tacticalTokens,
  activeCombatant,
  movement,
}: RightDockProps) {
  const t = useT();
  const isActive = battle.status === 'ACTIVE';
  const isAssembling = battle.status === 'ASSEMBLING';

  const tabs = useMemo<{ key: TabKey; label: string }[]>(() => {
    if (isGm) {
      const list: { key: TabKey; label: string }[] = [];
      if (isActive) list.push({ key: 'turn', label: t('tactical.tab.turn') });
      list.push({ key: 'inspect', label: t('tactical.tab.inspect') });
      if (isAssembling) list.push({ key: 'bestiary', label: t('tactical.tab.bestiary') });
      list.push({ key: 'summary', label: t('tactical.tab.summary') });
      if (!isAssembling) list.push({ key: 'log', label: t('tactical.tab.log') });
      return list;
    }
    const list: { key: TabKey; label: string }[] = [
      { key: 'character', label: t('tactical.tab.character') },
      { key: 'target', label: t('tactical.tab.target') },
    ];
    if (!isAssembling) list.push({ key: 'log', label: t('tactical.tab.log') });
    return list;
  }, [isGm, isActive, isAssembling, t]);

  const defaultTab: TabKey = isGm ? (isActive ? 'turn' : isAssembling ? 'bestiary' : 'summary') : 'character';
  const [tab, setTab] = useState<TabKey>(defaultTab);

  // Keep the active tab valid as the available set changes with the battle phase.
  useEffect(() => {
    if (!tabs.some((x) => x.key === tab)) setTab(tabs[0]?.key ?? defaultTab);
  }, [tabs, tab, defaultTab]);

  // Focus the inspect/target tab when something is selected on the map.
  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const selectedCell = useMapTransientStore((st) => st.selectedCell);
  const lastSel = useRef<string | null>(null);
  useEffect(() => {
    const key = selectedTokenId
      ? `t:${selectedTokenId}`
      : selectedCell
        ? `c:${selectedCell.gridX},${selectedCell.gridY}`
        : null;
    if (key && key !== lastSel.current) {
      setTab(isGm ? 'inspect' : 'target');
    }
    lastSel.current = key;
  }, [selectedTokenId, selectedCell, isGm]);

  return (
    <div className={s.dock}>
      <div className={cn('ao-tabs', s.dockTabs)} role="tablist">
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={tab === x.key}
            className={cn('ao-tab', tab === x.key && 'is-active')}
            onClick={() => setTab(x.key)}
          >
            {x.label}
          </button>
        ))}
      </div>

      <div className={cn('ao-scroll', s.dockBody)}>
        {tab === 'turn' && <TurnTab campaignId={campaignId} battle={battle} movement={movement} />}
        {tab === 'inspect' && (
          <TacticalInspectorPanel
            campaignId={campaignId}
            battleId={battle.id}
            isGm={isGm}
            tacticalTokens={tacticalTokens}
            activeCombatant={activeCombatant}
          />
        )}
        {tab === 'bestiary' && <BestiaryTab campaignId={campaignId} battle={battle} />}
        {tab === 'summary' && <SummaryTab campaignId={campaignId} battle={battle} />}
        {tab === 'character' && (
          <CharacterTab
            campaignId={campaignId}
            battle={battle}
            currentUserId={currentUserId}
            tacticalTokens={tacticalTokens}
            movement={movement}
          />
        )}
        {tab === 'target' && (
          <TargetTab tacticalTokens={tacticalTokens} activeCombatant={activeCombatant} />
        )}
        {tab === 'log' && <LogTab campaignId={campaignId} battleId={battle.id} />}
      </div>
    </div>
  );
}
