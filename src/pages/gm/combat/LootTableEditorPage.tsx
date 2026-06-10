import { useState } from 'react';
import { OrdoPanel as Panel, OrdoChip as Chip, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { DieButton } from '@/components/combat/primitives';
import { RarityBadge } from '@/components/items/RarityBadge';
import {
  LOOT_INITIAL,
  LOOT_KIND_KEY,
  RARITY_ORDER,
  diceRange,
  rarityHue,
  type LootRow,
} from '@/components/combat/data';

export default function LootTableEditorPage() {
  const t = useT();
  const [rows, setRows] = useState<LootRow[]>(LOOT_INITIAL);
  const [testResult, setTestResult] = useState<LootRow | null>(null);
  const total = rows.reduce((s, r) => s + r.weight, 0);

  const setWeight = (id: string, w: number) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, weight: Math.max(0, w) } : r)));
  const testRoll = () => {
    let roll = Math.random() * total;
    let pick = rows[0];
    for (const r of rows) {
      roll -= r.weight;
      if (roll <= 0) {
        pick = r;
        break;
      }
    }
    setTestResult(pick);
  };

  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.loot.tableTitle')}
        breadcrumb={t('combat.loot.tableBreadcrumb')}
        right={
          <div style={{ display: 'flex', gap: 10 }}>
            <Chip tone="gold" glyph="lock">{t('combat.loot.gmOnly')}</Chip>
            <button className="ao-btn ao-btn--primary"><Rune kind="plus" size={11} /> {t('combat.loot.addRow')}</button>
          </div>
        }
      />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        <Panel padding={0}>
          <table className="ao-table">
            <thead>
              <tr>
                <th style={{ width: 34 }}></th>
                <th style={{ width: 150 }}>{t('combat.loot.col.type')}</th>
                <th>{t('combat.loot.col.content')}</th>
                <th style={{ width: 90 }}>{t('combat.loot.col.weight')}</th>
                <th style={{ width: 86 }}>{t('combat.loot.col.pct')}</th>
                <th style={{ width: 130 }}>{t('combat.loot.col.qty')}</th>
                <th style={{ width: 150 }}>{t('combat.loot.col.rarity')}</th>
                <th style={{ width: 90 }}>{t('combat.loot.col.cr')}</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pct = total ? (r.weight / total) * 100 : 0;
                const range = r.kind === 'cur' ? diceRange(r.content) : null;
                return (
                  <tr key={r.id} className="cb-loot-row">
                    <td style={{ cursor: 'grab', color: 'var(--ink-ghost)', textAlign: 'center' }} title={t('combat.loot.dragRow')}>
                      <Rune kind="menu" size={13} />
                    </td>
                    <td>
                      <select className="ao-input" defaultValue={r.kind} style={{ padding: '6px 8px', fontSize: 12 }}>
                        {(Object.keys(LOOT_KIND_KEY) as (keyof typeof LOOT_KIND_KEY)[]).map((k) => (
                          <option key={k} value={k}>{t(LOOT_KIND_KEY[k])}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {r.kind === 'item' && (
                        <button style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 10px', background: 'var(--abyss)', border: '1px solid var(--rule)', color: 'var(--ink-bright)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                          <Rune kind="square-rot" size={12} color={rarityHue(r.rarity)} />
                          <span style={{ flex: 1 }}>{r.content}</span>
                          <Rune kind="chev-d" size={10} color="var(--ink-faint)" />
                        </button>
                      )}
                      {r.kind === 'cur' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input className="ao-input" defaultValue={r.content} style={{ width: 110, padding: '6px 10px', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
                          <span className="ao-codex" style={{ color: 'var(--gold-pale)' }}>{range ? `${range.lo}–${range.hi} ${t('combat.loot.gold')}` : t('combat.loot.badFormula')}</span>
                        </div>
                      )}
                      {r.kind === 'nest' && (
                        <select className="ao-input" style={{ padding: '6px 8px', fontSize: 12 }}>
                          <option>{r.content.replace('Таблица: ', '')}</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <input className="ao-input" type="number" value={r.weight} onChange={(e) => setWeight(r.id, +e.target.value || 0)} style={{ width: 64, padding: '6px 8px', textAlign: 'center' }} />
                    </td>
                    <td>
                      <span className="ao-num cb-flash" key={pct.toFixed(1)} style={{ fontSize: 14, fontWeight: 600, color: pct >= 20 ? 'var(--gold-pale)' : 'var(--ink)' }}>{pct.toFixed(1)}%</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <input className="ao-input" defaultValue={r.qmin} style={{ width: 42, padding: '6px 4px', textAlign: 'center' }} />
                        <span className="ao-codex">–</span>
                        <input className="ao-input" defaultValue={r.qmax} style={{ width: 42, padding: '6px 4px', textAlign: 'center' }} />
                      </div>
                    </td>
                    <td><RarityBadge rarity={r.rarity} size="sm" /></td>
                    <td><input className="ao-input" defaultValue={r.cr} style={{ width: 64, padding: '6px 6px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11 }} /></td>
                    <td><button className="ao-iconbtn" title={t('combat.loot.deleteRow')} style={{ color: '#d8896a', borderColor: 'transparent' }}><Rune kind="x" size={12} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderTop: '1px solid var(--rule)', background: 'rgba(0,0,0,0.25)', flexWrap: 'wrap' }}>
            <span className="ao-codex">{t('combat.loot.totalWeight')} <span style={{ color: 'var(--ink-bright)' }}>{total}</span> · {t('combat.loot.records', { n: rows.length })}</span>
            <span style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', border: '1px solid var(--rule-strong)', background: 'var(--abyss)' }}>
              <span className="ao-overline">{t('combat.loot.testRoll')}</span>
              <DieButton onClick={testRoll} size={26} label="🎲" title={t('combat.loot.testRollTitle')} />
              {testResult ? (
                <span className="cb-flash" key={testResult.id + Math.random()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Rune kind="square-rot" size={11} color={rarityHue(testResult.rarity)} />
                  <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{testResult.content}</span>
                  <RarityBadge rarity={testResult.rarity} size="sm" />
                </span>
              ) : (
                <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{t('combat.loot.testHint')}</span>
              )}
            </div>
          </div>
        </Panel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="ao-overline">{t('combat.loot.rarityScale')}</span>
          {RARITY_ORDER.map((k) => <RarityBadge key={k} rarity={k} size="sm" />)}
          <span className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{t('combat.loot.rarityNote')}</span>
        </div>
      </div>
    </CombatBackdrop>
  );
}
