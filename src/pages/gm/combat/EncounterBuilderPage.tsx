import { useState } from 'react';
import { OrdoChip as Chip, OrdoField as Field, PanelHeader, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { Tabs, Stepper, DieButton, VisibilityEye, DisabledWithTip } from '@/components/combat/primitives';
import { CombatPortrait, EncounterStatusBadge } from '@/components/combat/kit';
import { EB_PARTY, EB_NPCS, EB_ROSTER, type RosterRow } from '@/components/combat/data';

export default function EncounterBuilderPage() {
  const t = useT();
  const [tab, setTab] = useState('party');
  const [checked, setChecked] = useState<Record<string, boolean>>({ kael: true, mira: true, tor: false, ezra: true });
  const [roster, setRoster] = useState<RosterRow[]>(EB_ROSTER);
  const missing = roster.filter((r) => r.init == null).length;
  const ready = missing === 0;

  const rollOne = (id: string) =>
    setRoster((rs) => rs.map((r) => (r.id === id ? { ...r, init: 1 + Math.floor(Math.random() * 20) + r.ib } : r)));
  const rollAll = () =>
    setRoster((rs) => rs.map((r) => (r.init == null ? { ...r, init: 1 + Math.floor(Math.random() * 20) + r.ib } : r)));

  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.eb.title')} breadcrumb={t('combat.eb.breadcrumb')} right={<EncounterStatusBadge status="DRAFT" />} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left: add participants */}
        <div className="ao-scroll" style={{ width: 420, flexShrink: 0, borderRight: '1px solid var(--rule)', overflow: 'auto', background: 'rgba(0,0,0,0.18)' }}>
          <PanelHeader title={t('combat.eb.addParticipants')} glyph="plus" sub={t('combat.eb.addSub')} />
          <Tabs
            active={tab}
            onChange={setTab}
            items={[
              { id: 'party', label: t('combat.eb.tab.party') },
              { id: 'npc', label: t('combat.eb.tab.npc') },
              { id: 'mon', label: t('combat.eb.tab.mon') },
            ]}
          />
          {tab === 'party' && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EB_PARTY.map((p) => (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: checked[p.id] ? 'linear-gradient(90deg, rgba(176,141,78,0.08), var(--panel))' : 'var(--panel)',
                    border: `1px solid ${checked[p.id] ? 'var(--brass)' : 'var(--rule)'}`,
                    cursor: 'pointer',
                    transition: 'all 150ms',
                  }}
                >
                  <span
                    onClick={() => setChecked((c) => ({ ...c, [p.id]: !c[p.id] }))}
                    style={{ width: 18, height: 18, flexShrink: 0, border: `1px solid ${checked[p.id] ? 'var(--gold)' : 'var(--rule-strong)'}`, background: checked[p.id] ? 'var(--gold)' : 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {checked[p.id] && <Rune kind="check" size={11} color="var(--abyss)" />}
                  </span>
                  <CombatPortrait kind="pc" size={36} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, color: 'var(--ink-bright)' }}>{p.name}</span>
                    <span className="ao-codex" style={{ display: 'block', marginTop: 2 }}>{p.sub}</span>
                  </span>
                  <span className="ao-codex">{t('combat.eb.hpAc', { hp: p.hp, ac: p.ac })}</span>
                </label>
              ))}
              <button className="ao-btn ao-btn--block" style={{ marginTop: 4 }}>{t('combat.eb.addChecked')}</button>
            </div>
          )}
          {tab === 'npc' && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>
                  <Rune kind="search" size={13} />
                </span>
                <input className="ao-input" placeholder={t('combat.eb.searchNpc')} style={{ paddingLeft: 32 }} />
              </div>
              {EB_NPCS.map((n) => (
                <div
                  key={n.id}
                  className={n.ok ? '' : 'cb-tipwrap'}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--panel)', border: '1px solid var(--rule)', opacity: n.ok ? 1 : 0.45, cursor: n.ok ? 'pointer' : 'not-allowed' }}
                >
                  <CombatPortrait kind="npc" size={36} dim={!n.ok} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13.5, color: n.ok ? 'var(--ink-bright)' : 'var(--ink-faint)' }}>{n.name}</span>
                    <span className="ao-codex" style={{ display: 'block', marginTop: 2, color: n.ok ? 'var(--ink-quiet)' : '#d8896a' }}>{n.sub}</span>
                  </span>
                  {n.ok ? (
                    <button className="ao-btn ao-btn--sm"><Rune kind="plus" size={10} /> {t('combat.eb.addToRoster')}</button>
                  ) : (
                    <Rune kind="lock" size={14} color="var(--ink-faint)" />
                  )}
                  {!n.ok && (
                    <span className="cb-tip ao-tooltip" style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 20, width: 260, zIndex: 9, padding: '8px 10px', background: 'var(--panel-raised)', border: '1px solid var(--brass)', boxShadow: 'var(--shadow-mid)' }}>
                      <span style={{ display: 'flex', gap: 8 }}>
                        <Rune kind="tri-inv" size={12} color="var(--gold-pale)" />
                        <span style={{ fontSize: 12 }}>{t('combat.eb.npcNoStatTip')}</span>
                      </span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {tab === 'mon' && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label={t('combat.eb.monName')}><input className="ao-input" placeholder={t('combat.eb.monNamePh')} /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Field label={t('combat.eb.hp')}><input className="ao-input" defaultValue="59" /></Field>
                <Field label={t('combat.eb.ac')}><input className="ao-input" defaultValue="11" /></Field>
                <Field label={t('combat.eb.initBonus')}><input className="ao-input" defaultValue="-1" /></Field>
              </div>
              <Field label={t('combat.eb.qty')} hint={t('combat.eb.qtyHint')}>
                <Stepper value={1} big />
              </Field>
              <button className="ao-btn ao-btn--primary ao-btn--block"><Rune kind="plus" size={11} /> {t('combat.eb.addMonster')}</button>
            </div>
          )}
        </div>

        {/* Right: roster */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <PanelHeader title={t('combat.eb.roster')} glyph="sword" sub={t('combat.eb.rosterSub')} right={<span className="ao-codex">{t('combat.eb.participants', { n: roster.length })}</span>} />
          <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
            <table className="ao-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>{t('combat.eb.col.participant')}</th>
                  <th>{t('combat.eb.col.hp')}</th>
                  <th>{t('combat.eb.col.ac')}</th>
                  <th>{t('combat.eb.col.bonus')}</th>
                  <th style={{ width: 170 }}>{t('combat.eb.col.init')}</th>
                  <th style={{ textAlign: 'center' }}>{t('combat.eb.col.visibility')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CombatPortrait kind={r.kind} size={32} />
                        <span style={{ color: 'var(--ink-bright)' }}>{r.name}</span>
                        {r.kind === 'mon' && <Chip tone="ember">{t('combat.eb.monster')}</Chip>}
                      </div>
                    </td>
                    <td><input className="ao-input" defaultValue={r.hp} style={{ width: 64, padding: '6px 8px', textAlign: 'center' }} /></td>
                    <td><input className="ao-input" defaultValue={r.ac} style={{ width: 56, padding: '6px 8px', textAlign: 'center' }} /></td>
                    <td><span className="ao-num" style={{ color: r.ib >= 0 ? '#7a9866' : '#d8896a' }}>{r.ib >= 0 ? `+${r.ib}` : r.ib}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input className="ao-input" value={r.init == null ? '' : r.init} placeholder="—" readOnly style={{ width: 60, padding: '6px 8px', textAlign: 'center', borderColor: r.init == null ? 'rgba(179,70,26,0.5)' : 'var(--rule)' }} />
                        <DieButton onClick={() => rollOne(r.id)} title={t('combat.eb.rollOneTitle', { bonus: r.ib >= 0 ? `+${r.ib}` : r.ib })} />
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <VisibilityEye visible={r.vis} onToggle={() => setRoster((rs) => rs.map((x) => (x.id === r.id ? { ...x, vis: !x.vis } : x)))} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="ao-iconbtn" style={{ color: '#d8896a', borderColor: 'rgba(179,70,26,0.35)' }}><Rune kind="x" size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {missing > 0 && (
              <div style={{ margin: '14px 16px', display: 'flex', gap: 10, alignItems: 'center', padding: '10px 14px', border: '1px solid rgba(179,70,26,0.4)', background: 'rgba(179,70,26,0.06)' }}>
                <Rune kind="tri-inv" size={13} color="#d8896a" />
                <span style={{ fontSize: 13, color: '#d8896a' }}>{t('combat.eb.missingInit', { n: missing })}</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--rule)', background: 'linear-gradient(180deg, var(--panel), var(--stone))' }}>
            <button className="ao-btn" onClick={rollAll}><Rune kind="hex" size={12} /> {t('combat.eb.rollAll')}</button>
            <span className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{t('combat.eb.rollAllHint')}</span>
            <span style={{ flex: 1 }} />
            {ready ? (
              <button className="ao-btn ao-btn--primary ao-btn--lg"><Rune kind="sword" size={13} /> {t('combat.eb.startCombat')}</button>
            ) : (
              <DisabledWithTip primary lg label={t('combat.eb.startCombat')} tip={t('combat.eb.startTip', { n: missing })} />
            )}
          </div>
        </div>
      </div>
    </CombatBackdrop>
  );
}
