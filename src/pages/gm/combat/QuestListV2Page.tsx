import { useState } from 'react';
import { OrdoPanel as Panel, OrdoChip as Chip, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { ListToolbar, FilterPill, Pagination, RowMenu, Toggle } from '@/components/combat/primitives';
import { QuestStatusBadge } from '@/components/combat/kit';
import { QUESTS } from '@/components/combat/data';

export default function QuestListV2Page() {
  const t = useT();
  const [vis, setVis] = useState<Record<number, boolean>>(Object.fromEntries(QUESTS.map((q) => [q.id, q.vis])));
  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.lists.quests')}
        breadcrumb={t('combat.lists.questsBreadcrumb')}
        right={<button className="ao-btn ao-btn--primary"><Rune kind="plus" size={11} /> {t('combat.lists.newQuest')}</button>}
      />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <ListToolbar
          count={t('combat.lists.questCount')}
          sort={t('combat.lists.sortByUpdate')}
          filters={
            <div style={{ display: 'flex', gap: 6 }}>
              <FilterPill label={t('combat.lists.f.active')} active count={2} />
              <FilterPill label={t('combat.lists.f.done')} active count={1} />
              <FilterPill label={t('combat.lists.f.draft')} count={1} />
              <FilterPill label={t('combat.lists.f.failed')} active count={1} />
              <span style={{ width: 1, background: 'var(--rule)', margin: '0 4px' }} />
              <FilterPill label={t('combat.lists.f.visibleOnly')} />
            </div>
          }
        />
        <Panel padding={0} style={{ marginTop: 14, overflow: 'visible' }}>
          <table className="ao-table">
            <thead>
              <tr>
                <th>{t('combat.lists.col.quest')}</th>
                <th>{t('combat.lists.col.status')}</th>
                <th>{t('combat.lists.col.goals')}</th>
                <th>{t('combat.lists.col.updated')}</th>
                <th style={{ textAlign: 'center' }}>{t('combat.lists.col.visibility')}</th>
                <th style={{ width: 56 }}></th>
              </tr>
            </thead>
            <tbody>
              {QUESTS.map((q) => (
                <tr key={q.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Rune kind="scroll" size={14} color="var(--ink-quiet)" />
                      <span style={{ color: 'var(--ink-bright)', fontSize: 14 }}>{q.name}</span>
                      {!vis[q.id] && <Chip glyph="lock">{t('combat.lists.hidden')}</Chip>}
                    </div>
                  </td>
                  <td><QuestStatusBadge s={q.s} /></td>
                  <td className="ao-num">{q.obj}</td>
                  <td><span className="ao-codex">{q.upd}</span></td>
                  <td style={{ textAlign: 'center' }}>
                    <Toggle on={vis[q.id]} onChange={() => setVis((v) => ({ ...v, [q.id]: !v[q.id] }))} />
                  </td>
                  <td style={{ textAlign: 'right', overflow: 'visible' }}><RowMenu open={!!q.menu} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '14px 18px', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center' }}>
            <span className="ao-codex">{t('combat.lists.page', { p: 1, n: 3 })}</span>
            <span style={{ flex: 1 }} />
            <Pagination page={1} pages={3} />
          </div>
        </Panel>
      </div>
    </CombatBackdrop>
  );
}
