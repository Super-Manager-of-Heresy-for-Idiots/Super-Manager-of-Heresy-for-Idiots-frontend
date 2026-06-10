import { Fragment, useState } from 'react';
import {
  OrdoPanel as Panel,
  OrdoChip as Chip,
  OrdoField as Field,
  PanelHeader,
  ModalScene,
  EmptyVault,
  Rune,
} from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { Toggle } from '@/components/combat/primitives';
import { RarityBadge } from '@/components/items/RarityBadge';
import {
  GEN_RESULTS,
  RARITY_GLYPH,
  RARITY_ORDER,
  RARITY_LABEL_KEY,
  rarityHue,
  type GenResult,
} from '@/components/combat/data';

/* ── Loot card ───────────────────────────────────────────────── */

interface LootCardProps {
  item: GenResult;
  locked?: boolean;
  discarded?: boolean;
  onLock?: () => void;
  onDiscard?: () => void;
}

function LootCard({ item, locked = false, discarded = false, onLock, onDiscard }: LootCardProps) {
  const t = useT();
  const c = rarityHue(item.rarity);
  return (
    <div style={{ position: 'relative', border: `1px solid ${c}`, borderTop: `2px solid ${c}`, background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))', boxShadow: item.rarity === 'LEGENDARY' ? `0 0 22px ${c}33, var(--shadow-inset)` : 'var(--shadow-inset)', padding: 14, opacity: discarded ? 0.35 : 1, transition: 'all 200ms' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 52, height: 52, flexShrink: 0, border: `1px solid ${c}88`, background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 0 0 12px ${c}1a` }}>
          <Rune kind={item.kind === 'cur' ? 'coin' : RARITY_GLYPH[item.rarity]} size={24} color={c} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ao-h6" style={{ fontSize: 15, textDecoration: discarded ? 'line-through' : 'none' }}>{item.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <RarityBadge rarity={item.rarity} size="sm" />
            {item.qty && <span className="ao-codex">×{item.qty}</span>}
            {item.src && <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>{item.src}</span>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12, borderTop: '1px solid var(--hairline)', paddingTop: 10 }}>
        <button className="ao-btn ao-btn--sm" disabled={locked || discarded} style={{ opacity: locked || discarded ? 0.35 : 1, cursor: locked ? 'not-allowed' : 'pointer' }} title={locked ? t('combat.gen.rerollLockedTip') : t('combat.gen.rerollTip')}>
          <Rune kind="hex" size={10} /> {t('combat.gen.reroll')}
        </button>
        <button className="ao-btn ao-btn--sm" onClick={onLock} style={{ borderColor: locked ? 'var(--gold)' : 'var(--rule)', color: locked ? 'var(--gold-pale)' : 'var(--ink-quiet)' }} title={locked ? t('combat.gen.lockedTip') : t('combat.gen.lockTip')}>
          <Rune kind="lock" size={10} /> {locked ? t('combat.gen.locked') : t('combat.gen.lock')}
        </button>
        <span style={{ flex: 1 }} />
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={onDiscard} style={{ color: discarded ? 'var(--gold-pale)' : '#d8896a' }}>
          {discarded ? t('combat.gen.return') : <span><Rune kind="x" size={9} /> {t('combat.gen.discard')}</span>}
        </button>
      </div>
      {locked && (
        <span style={{ position: 'absolute', top: -9, right: 10, padding: '2px 8px', background: 'var(--abyss)', border: '1px solid var(--gold)', display: 'inline-flex', gap: 5, alignItems: 'center' }}>
          <Rune kind="lock" size={9} color="var(--gold-pale)" />
          <span className="ao-codex" style={{ color: 'var(--gold-pale)', fontSize: 9 }}>{t('combat.gen.protected')}</span>
        </span>
      )}
    </div>
  );
}

/* ── Distribute modal ────────────────────────────────────────── */

function DistributeLootModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const recipients = ['Каэлен Морн', 'Мира Тэн', 'Эзра Полынь', t('combat.dist.vault')];
  const rows = [
    { name: 'Зелье лечения ×2', rarity: 'COMMON', to: 'Мира Тэн' },
    { name: '140 золотых монет', rarity: 'COMMON', to: t('combat.dist.evenly'), cur: true },
    { name: 'Свиток огненного шара', rarity: 'UNCOMMON', to: 'Эзра Полынь' },
    { name: 'Меч из звёздной стали', rarity: 'RARE', to: 'Каэлен Морн' },
    { name: 'Корона Полой Луны', rarity: 'LEGENDARY', to: t('combat.dist.vault') },
  ];
  return (
    <ModalScene open={open} onOpenChange={onOpenChange} codexId="LOOT-DIST-031" overline={t('combat.dist.overline')} title={t('combat.dist.title')} sub={t('combat.dist.sub')} width={620} rune="sigil-2">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
            <Rune kind={r.cur ? 'coin' : 'square-rot'} size={14} color={rarityHue(r.rarity)} />
            <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-bright)' }}>{r.name}</span>
            <select className="ao-input" defaultValue={r.to} style={{ width: 190, padding: '7px 10px', fontSize: 12.5 }}>
              {r.cur && <option>{t('combat.dist.evenly')}</option>}
              {recipients.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
        ))}
        <div className="ao-italic" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>{t('combat.dist.note')}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }} onClick={() => onOpenChange(false)}>{t('combat.dist.cancel')}</button>
        <button className="ao-btn ao-btn--primary" style={{ flex: 2 }}><Rune kind="coin" size={12} /> {t('combat.dist.giveN')}</button>
      </div>
    </ModalScene>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

interface PageProps {
  empty?: boolean;
}

const HIST: [string, string][] = [
  ['combat.gen.histList.0t', 'combat.gen.histList.0d'],
  ['combat.gen.histList.1t', 'combat.gen.histList.1d'],
  ['combat.gen.histList.2t', 'combat.gen.histList.2d'],
];

export default function LootGeneratorPage({ empty = false }: PageProps) {
  const t = useT();
  const [mode, setMode] = useState('smart');
  const [cr, setCr] = useState(8);
  const [locked, setLocked] = useState<Record<string, boolean>>({ g4: true });
  const [discarded, setDiscarded] = useState<Record<string, boolean>>({});
  const [histOpen, setHistOpen] = useState(false);
  const [results, setResults] = useState<GenResult[]>(empty ? [] : GEN_RESULTS);
  const [distOpen, setDistOpen] = useState(false);

  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.gen.title')} breadcrumb={t('combat.gen.breadcrumb')} right={<Chip tone="gold" glyph="coin">{t('combat.gen.vault')}</Chip>} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Parameters */}
        <div className="ao-scroll" style={{ width: 380, flexShrink: 0, borderRight: '1px solid var(--rule)', overflow: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(0,0,0,0.18)' }}>
          <div>
            <label className="ao-label">{t('combat.gen.source')}</label>
            <div style={{ display: 'flex', border: '1px solid var(--rule-strong)' }}>
              {([['table', t('combat.gen.byTable')], ['smart', t('combat.gen.smart')]] as [string, string][]).map(([id, l], i) => (
                <button key={id} onClick={() => setMode(id)} style={{ flex: 1, padding: '10px 8px', background: mode === id ? 'var(--panel-raised)' : 'transparent', border: 'none', borderLeft: i ? '1px solid var(--rule)' : 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: mode === id ? 'var(--gold-pale)' : 'var(--ink-faint)' }}>{l}</button>
              ))}
            </div>
          </div>
          {mode === 'table' ? (
            <Field label={t('combat.gen.lootTable')}>
              <select className="ao-input"><option>Сокровища тракта</option><option>Реликвии Ордена</option></select>
            </Field>
          ) : (
            <Fragment>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="ao-label">{t('combat.gen.cr')}</label>
                  <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 16 }}>{cr}</span>
                </div>
                <input type="range" min="0" max="20" value={cr} onChange={(e) => setCr(+e.target.value)} className="cb-range" style={{ width: '100%' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="ao-codex">{t('combat.gen.crLow')}</span>
                  <span className="ao-codex">{t('combat.gen.crHigh')}</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Field label={t('combat.gen.partyLevel')}><input className="ao-input" defaultValue="5" /></Field>
                <Field label={t('combat.gen.rolls')}><input className="ao-input" defaultValue="5" /></Field>
              </div>
              <Field label={t('combat.gen.rarityCap')}>
                <select className="ao-input" defaultValue="LEGENDARY">
                  {RARITY_ORDER.map((k) => <option key={k} value={k}>{t(RARITY_LABEL_KEY[k])}</option>)}
                </select>
              </Field>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--ink)' }}>{t('combat.gen.noDupes')}</div>
                  <div className="ao-codex" style={{ marginTop: 2 }}>{t('combat.gen.noDupesHint')}</div>
                </div>
                <Toggle on onChange={() => {}} />
              </div>
            </Fragment>
          )}
          <button className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block" onClick={() => setResults(GEN_RESULTS)} style={{ padding: '18px 24px', fontSize: 14 }}>
            <Rune kind="hex" size={16} /> {t('combat.gen.generate')}
          </button>
          <div style={{ border: '1px solid var(--rule)', background: 'var(--panel)' }}>
            <button onClick={() => setHistOpen((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-quiet)' }}>
              <Rune kind="book" size={12} />
              <span className="ao-overline" style={{ color: 'currentColor' }}>{t('combat.gen.history')}</span>
              <span style={{ flex: 1 }} />
              <span style={{ display: 'inline-flex', transform: histOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}>
                <Rune kind="chev-d" size={11} />
              </span>
            </button>
            {histOpen && (
              <div style={{ borderTop: '1px solid var(--hairline)' }}>
                {HIST.map(([tk, dk]) => (
                  <div key={tk} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--hairline)' }}>
                    <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{t(tk)}</span>
                    <span className="ao-codex">{t(dk)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <PanelHeader
            title={t('combat.gen.results')}
            glyph="coin"
            sub={results.length ? t('combat.gen.resultsSub', { n: results.length, locked: Object.values(locked).filter(Boolean).length, discarded: Object.values(discarded).filter(Boolean).length }) : t('combat.gen.notYet')}
            right={results.length ? <button className="ao-btn ao-btn--sm"><Rune kind="hex" size={10} /> {t('combat.gen.rerollAll')}</button> : undefined}
          />
          <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 18 }}>
            {results.length === 0 ? (
              <EmptyVault
                glyph="sigil-2"
                overline={t('combat.gen.emptyOverline')}
                title={t('combat.gen.emptyTitle')}
                body={t('combat.gen.emptyBody')}
                action={<button className="ao-btn ao-btn--primary" onClick={() => setResults(GEN_RESULTS)}><Rune kind="hex" size={12} /> {t('combat.tiles.generate')}</button>}
              />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {results.map((it) => (
                  <LootCard
                    key={it.id}
                    item={it}
                    locked={!!locked[it.id]}
                    discarded={!!discarded[it.id]}
                    onLock={() => setLocked((s) => ({ ...s, [it.id]: !s[it.id] }))}
                    onDiscard={() => setDiscarded((s) => ({ ...s, [it.id]: !s[it.id] }))}
                  />
                ))}
              </div>
            )}
          </div>
          {results.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--rule)', background: 'linear-gradient(180deg, var(--panel), var(--stone))' }}>
              <button className="ao-btn ao-btn--ghost">{t('combat.gen.cancel')}</button>
              <span style={{ flex: 1 }} />
              <button className="ao-btn"><Rune kind="scroll" size={11} /> {t('combat.gen.toQuest')}</button>
              <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={() => setDistOpen(true)}><Rune kind="coin" size={13} /> {t('combat.gen.giveAll')}</button>
            </div>
          )}
        </div>
      </div>
      <DistributeLootModal open={distOpen} onOpenChange={setDistOpen} />
    </CombatBackdrop>
  );
}
