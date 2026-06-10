import { useState } from 'react';
import { OrdoPanel as Panel, PanelHeader, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { ListToolbar, FilterPill, Pagination, RowMenu, Toggle } from '@/components/combat/primitives';
import { AttitudeBadge } from '@/components/combat/kit';
import { NPC_GROUPS } from '@/components/combat/data';

export default function NPCListV2Page() {
  const t = useT();
  const [grouped, setGrouped] = useState(true);
  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.lists.npc')}
        breadcrumb={t('combat.lists.questsBreadcrumb')}
        right={<button className="ao-btn ao-btn--primary"><Rune kind="plus" size={11} /> {t('combat.lists.newNpc')}</button>}
      />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <ListToolbar
          count={t('combat.lists.npcCount')}
          sort={t('combat.lists.sortByName')}
          filters={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <FilterPill label={t('combat.lists.f.friendly')} active count={2} />
              <FilterPill label={t('combat.lists.f.neutral')} active count={2} />
              <FilterPill label={t('combat.lists.f.hostile')} active count={1} />
              <span style={{ width: 1, background: 'var(--rule)', margin: '0 4px', alignSelf: 'stretch' }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span className="ao-codex">{t('combat.lists.byFaction')}</span>
                <Toggle on={grouped} onChange={setGrouped} />
              </span>
            </div>
          }
        />
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NPC_GROUPS.map((g) => (
            <Panel key={g.faction} padding={0}>
              {grouped && <PanelHeader title={g.faction} glyph="sigil-3" right={<span className="ao-codex">{g.npcs.length}</span>} />}
              <table className="ao-table">
                {!grouped && g.faction === 'Орден Пепла' && (
                  <thead>
                    <tr>
                      <th>{t('combat.lists.col.npc')}</th>
                      <th>{t('combat.lists.col.attitude')}</th>
                      <th>{t('combat.lists.col.statblock')}</th>
                      <th style={{ textAlign: 'center' }}>{t('combat.lists.col.visibility')}</th>
                      <th></th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {g.npcs.map((n) => (
                    <tr key={n.n}>
                      <td style={{ width: '34%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Rune kind="helm" size={14} color="var(--ink-quiet)" />
                          <span style={{ color: 'var(--ink-bright)', fontSize: 14 }}>{n.n}</span>
                        </div>
                      </td>
                      <td><AttitudeBadge kind={n.a} /></td>
                      <td>
                        {n.stat ? (
                          <span className="ao-chip ao-chip--gold"><Rune kind="check" size={8} /> {t('combat.lists.ready')}</span>
                        ) : (
                          <span className="ao-chip"><Rune kind="minus" size={8} /> {t('combat.lists.noStat')}</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', width: 110 }}><Toggle on={n.vis} onChange={() => {}} /></td>
                      <td style={{ textAlign: 'right', width: 56 }}><RowMenu /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ))}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="ao-codex">{t('combat.lists.page', { p: 1, n: 2 })}</span>
            <span style={{ flex: 1 }} />
            <Pagination page={1} pages={2} />
          </div>
        </div>
      </div>
    </CombatBackdrop>
  );
}
