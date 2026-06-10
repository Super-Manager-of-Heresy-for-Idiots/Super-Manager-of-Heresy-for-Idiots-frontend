import type { ReactNode } from 'react';
import { OrdoPanel as Panel, OrdoChip as Chip, OrdoField as Field, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { Toggle } from '@/components/combat/primitives';
import {
  CombatPortrait,
  CombatHPBar,
  HealthWordBadge,
  ACBadge,
  AttackResultCard,
  EncounterStatusBadge,
  LogEntry,
} from '@/components/combat/kit';
import { RarityBadge } from '@/components/items/RarityBadge';
import {
  GM_INITIAL,
  GEN_RESULTS,
  RARITY_GLYPH,
  rarityHue,
  type Participant,
} from '@/components/combat/data';

/* ── Device frame ────────────────────────────────────────────── */

function MobileFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      <div className="ao-overline">{label}</div>
      <div style={{ width: 390, height: 844, border: '1px solid var(--rule-strong)', background: 'var(--stone)', overflow: 'hidden', boxShadow: 'var(--shadow-high)', position: 'relative' }}>
        <div className="ao-grain" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ height: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid var(--hairline)' }}>
              <span className="ao-codex" style={{ fontSize: 10 }}>21:14</span>
              <span className="ao-codex" style={{ fontSize: 10 }}>▮▮▮</span>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Queue tile ──────────────────────────────────────────────── */

function MobileQueueTile({ p, active = false, view = 'gm', isSelf = false }: { p: Participant; active?: boolean; view?: 'gm' | 'player'; isSelf?: boolean }) {
  const t = useT();
  const down = p.cur <= 0;
  const hidden = view === 'player' && p.hidden;
  const showNum = view === 'gm' || isSelf;
  return (
    <div style={{ width: 108, flexShrink: 0, padding: '10px 8px', textAlign: 'center', position: 'relative', background: active ? 'linear-gradient(180deg, rgba(176,141,78,0.12), var(--panel))' : 'linear-gradient(180deg, var(--panel-raised), var(--panel))', border: `1px solid ${active ? 'var(--gold)' : 'var(--rule)'}`, boxShadow: active ? '0 0 14px rgba(176,141,78,0.2)' : 'var(--shadow-inset)', opacity: down ? 0.55 : 1 }}>
      {active && <span style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 3, background: 'linear-gradient(90deg, var(--gold-deep), var(--gold-pale), var(--gold-deep))' }} />}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
        <span className="ao-num" style={{ fontSize: 16, fontWeight: 600, color: active ? 'var(--gold-pale)' : 'var(--ink)' }}>{hidden ? '—' : p.init}</span>
        {!hidden && !down && <ACBadge value={p.ac} size="sm" />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
        <CombatPortrait kind={p.kind} size={40} dim={down} unknown={hidden} />
      </div>
      <div style={{ fontSize: 10.5, marginTop: 6, color: down ? 'var(--ink-faint)' : 'var(--ink-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: hidden ? 'italic' : 'normal' }}>
        {hidden ? t('combat.unknownCreature') : down ? '☠ ' + p.name : p.name}
      </div>
      <div style={{ marginTop: 5 }}>
        {down ? (
          <span className="ao-codex" style={{ fontSize: 8 }}>{t('combat.downShort')}</span>
        ) : hidden ? (
          <span className="ao-codex" style={{ fontSize: 8 }}>{t('combat.hidden')}</span>
        ) : showNum ? (
          <CombatHPBar cur={p.cur} max={p.max} temp={p.temp} showNumbers={false} />
        ) : (
          <HealthWordBadge cur={p.cur} max={p.max} size="sm" />
        )}
      </div>
      {showNum && !down && !hidden && <div className="ao-num" style={{ fontSize: 10, marginTop: 3, color: 'var(--ink-quiet)' }}>{p.cur}/{p.max}{p.temp ? ` +${p.temp}` : ''}</div>}
    </div>
  );
}

/* ── GM mobile ───────────────────────────────────────────────── */

function MobileCombatGM() {
  const t = useT();
  const order = [...GM_INITIAL].sort((a, b) => b.init - a.init);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--rule)' }}>
        <button className="ao-iconbtn" style={{ width: 34, height: 34 }}><Rune kind="arrow-l" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="ao-engraved" style={{ fontSize: 12 }}>{t('combat.mobile.ambush')}</div>
          <div className="ao-codex" style={{ fontSize: 9 }}>{t('combat.mobile.gmMeta')}</div>
        </div>
        <EncounterStatusBadge status="ACTIVE" round={2} />
      </div>
      <div className="ao-scroll" style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', borderBottom: '1px solid var(--rule)', background: 'rgba(0,0,0,0.2)' }}>
        {order.map((p, i) => <MobileQueueTile key={p.id} p={p} active={i === 0} view="gm" />)}
      </div>
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
          <Rune kind="sword" size={13} color="var(--gold-pale)" />
          <span style={{ fontSize: 12.5 }}>Каэлен Морн → <span style={{ color: '#d8896a' }}>Гоблин A</span></span>
          <span style={{ flex: 1 }} />
          <button className="ao-btn ao-btn--sm">{t('combat.mobile.changeTarget')}</button>
        </div>
        <AttackResultCard mode="HIT" roll={14} bonus={7} vsAC={13} dmg={9} compact />
        <button className="ao-btn ao-btn--danger ao-btn--block">{t('combat.mobile.applyDmg')}</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="ao-btn"><Rune kind="hex" size={12} /> {t('combat.mobile.attack')}</button>
          <button className="ao-btn"><Rune kind="plus" size={12} /> {t('combat.mobile.heal')}</button>
          <button className="ao-btn"><Rune kind="flame" size={12} /> {t('combat.mobile.conds')}</button>
          <button className="ao-btn"><Rune kind="scroll" size={12} /> {t('combat.mobile.note')}</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }}>{t('combat.mobile.pause')}</button>
          <button className="ao-btn ao-btn--ghost" style={{ flex: 1 }}>{t('combat.mobile.end')}</button>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 14, bottom: 18, zIndex: 10 }}>
        <button className="ao-btn ao-btn--primary" style={{ padding: '16px 22px', fontSize: 13, boxShadow: 'var(--shadow-high), 0 0 24px rgba(176,141,78,0.25)' }}>
          {t('combat.tracker.nextTurn')} <Rune kind="arrow-r" size={14} />
        </button>
      </div>
    </>
  );
}

/* ── Player mobile (own turn) ────────────────────────────────── */

function MobileCombatPlayer() {
  const t = useT();
  const order = [...GM_INITIAL].sort((a, b) => b.init - a.init);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--rule)' }}>
        <button className="ao-iconbtn" style={{ width: 34, height: 34 }}><Rune kind="arrow-l" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="ao-engraved" style={{ fontSize: 12 }}>{t('combat.mobile.ambush')}</div>
          <div className="ao-codex" style={{ fontSize: 9 }}>{t('combat.mobile.playerMeta')}</div>
        </div>
        <span className="cb-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', border: '1px solid var(--gold)', background: 'rgba(176,141,78,0.1)' }}>
          <Rune kind="sword" size={10} color="var(--gold-pale)" />
          <span className="ao-engraved" style={{ fontSize: 10, color: 'var(--gold-pale)' }}>{t('combat.mobile.yourTurn')}</span>
        </span>
      </div>
      <div className="ao-scroll" style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', borderBottom: '1px solid var(--rule)', background: 'rgba(0,0,0,0.2)' }}>
        {order.map((p) => <MobileQueueTile key={p.id} p={p} active={p.id === 'mira'} view="player" isSelf={p.id === 'mira'} />)}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div className="cb-pulse" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px', border: '1px solid var(--gold)', borderLeft: '3px solid var(--gold)', background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))' }}>
          <Rune kind="sword" size={16} color="var(--gold-pale)" />
          <div style={{ flex: 1 }}>
            <div className="ao-engraved" style={{ fontSize: 12, color: 'var(--gold-pale)' }}>{t('combat.mobile.yourTurnBang')}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-quiet)', marginTop: 2 }}>{t('combat.mobile.actionMoveAvail')}</div>
          </div>
          <Rune kind="x" size={11} color="var(--ink-faint)" />
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ borderTop: '1px solid var(--brass)', background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))', boxShadow: '0 -10px 40px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px' }}>
          <span style={{ width: 44, height: 3, background: 'var(--bronze)', display: 'block' }} />
        </div>
        <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="ao-overline">{t('combat.mobile.yourActions')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {([['Парные кинжалы', '+6 · 1d4+3', true], ['Короткий лук', '+6 · 1d6+3', false]] as [string, string, boolean][]).map(([n, d, sel]) => (
              <button key={n} style={{ flex: 1, padding: '10px 10px', textAlign: 'left', cursor: 'pointer', background: sel ? 'rgba(176,141,78,0.1)' : 'var(--abyss)', border: `1px solid ${sel ? 'var(--brass)' : 'var(--rule)'}` }}>
                <div style={{ fontSize: 12.5, color: sel ? 'var(--ink-bright)' : 'var(--ink)' }}>{n}</div>
                <div className="ao-codex" style={{ fontSize: 9, marginTop: 2 }}>{d}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
            <span className="ao-codex">{t('combat.target')}</span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-bright)' }}>Гоблин-разведчик A</span>
            <span style={{ flex: 1 }} />
            <HealthWordBadge cur={7} max={12} size="sm" />
          </div>
          <button className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block" style={{ minHeight: 48 }}>
            <Rune kind="hex" size={14} /> {t('combat.mobile.rollAttack')}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ao-btn" style={{ flex: 1, minHeight: 44 }}><Rune kind="plus" size={11} /> {t('combat.mobile.healSelf')}</button>
            <button className="ao-btn" style={{ flex: 1, minHeight: 44 }}>{t('combat.mobile.endTurn')} <Rune kind="arrow-r" size={11} /></button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Player mobile (waiting) ─────────────────────────────────── */

function MobileCombatPlayerWaiting() {
  const t = useT();
  const order = [...GM_INITIAL].sort((a, b) => b.init - a.init);
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--rule)' }}>
        <button className="ao-iconbtn" style={{ width: 34, height: 34 }}><Rune kind="arrow-l" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="ao-engraved" style={{ fontSize: 12 }}>{t('combat.mobile.ambush')}</div>
          <div className="ao-codex" style={{ fontSize: 9 }}>{t('combat.mobile.playerMeta')}</div>
        </div>
        <EncounterStatusBadge status="ACTIVE" round={2} />
      </div>
      <div className="ao-scroll" style={{ display: 'flex', gap: 8, padding: '12px 14px', overflowX: 'auto', borderBottom: '1px solid var(--rule)', background: 'rgba(0,0,0,0.2)' }}>
        {order.map((p) => <MobileQueueTile key={p.id} p={p} active={p.id === 'ogr'} view="player" isSelf={p.id === 'mira'} />)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
        <CombatPortrait kind="mon" size={64} />
        <div className="ao-h5">{t('combat.mobile.actingNow')}<br />Огр-крушитель</div>
        <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)' }}>{t('combat.mobile.turnsAway')}</div>
      </div>
      <div style={{ borderTop: '1px solid var(--rule)', background: 'rgba(0,0,0,0.25)' }}>
        <LogEntry type="heal" text="Брат Алдрик лечит вас на 6 ОЗ." time="02:55" />
        <LogEntry type="note" text="Огр ломает повозку, перегораживая тракт." time="02:40" />
      </div>
    </>
  );
}

/* ── Loot generator mobile ───────────────────────────────────── */

function MobileLootGenerator() {
  const t = useT();
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--rule)' }}>
        <button className="ao-iconbtn" style={{ width: 34, height: 34 }}><Rune kind="arrow-l" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="ao-engraved" style={{ fontSize: 12 }}>{t('combat.gen.title')}</div>
          <div className="ao-codex" style={{ fontSize: 9 }}>{t('combat.mobile.genBreadcrumb')}</div>
        </div>
        <Chip tone="gold" glyph="coin">1 240 зм</Chip>
      </div>
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Panel padding={14} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <label className="ao-label" style={{ margin: 0 }}>{t('combat.gen.cr')}</label>
            <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 15 }}>8</span>
          </div>
          <input type="range" min="0" max="20" defaultValue={8} className="cb-range" style={{ width: '100%' }} readOnly />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Field label={t('combat.gen.partyLevel')}><input className="ao-input" defaultValue="5" style={{ minHeight: 44 }} /></Field>
            <Field label={t('combat.gen.rolls')}><input className="ao-input" defaultValue="5" style={{ minHeight: 44 }} /></Field>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13 }}>{t('combat.gen.noDupes')}</span>
            <Toggle on onChange={() => {}} />
          </div>
          <button className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block" style={{ minHeight: 52 }}>
            <Rune kind="hex" size={15} /> {t('combat.mobile.generate')}
          </button>
        </Panel>
        <div className="ao-overline">{t('combat.mobile.resultsN')}</div>
        {GEN_RESULTS.map((it) => {
          const c = rarityHue(it.rarity);
          return (
            <div key={it.id} style={{ border: `1px solid ${c}`, borderLeft: `3px solid ${c}`, background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))', padding: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Rune kind={it.kind === 'cur' ? 'coin' : RARITY_GLYPH[it.rarity]} size={18} color={c} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-bright)' }}>{it.name}{it.qty && it.qty > 1 ? ` ×${it.qty}` : ''}</div>
                  <div style={{ marginTop: 4 }}><RarityBadge rarity={it.rarity} size="sm" /></div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="ao-iconbtn" style={{ width: 40, height: 40 }}><Rune kind="hex" size={15} /></button>
                  <button className="ao-iconbtn" style={{ width: 40, height: 40, color: it.id === 'g4' ? 'var(--gold-pale)' : 'var(--ink-quiet)', borderColor: it.id === 'g4' ? 'var(--brass)' : 'var(--rule)' }}><Rune kind="lock" size={15} /></button>
                  <button className="ao-iconbtn" style={{ width: 40, height: 40, color: '#d8896a' }}><Rune kind="x" size={13} /></button>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height: 64 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderTop: '1px solid var(--brass)', background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))' }}>
        <button className="ao-btn" style={{ minHeight: 48 }}>{t('combat.mobile.toQuest')}</button>
        <button className="ao-btn ao-btn--primary" style={{ flex: 1, minHeight: 48 }}><Rune kind="coin" size={13} /> {t('combat.mobile.giveAll')}</button>
      </div>
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function MobilePreviewPage() {
  const t = useT();
  return (
    <CombatBackdrop>
      <CombatTopBar title={t('combat.mobile.title')} breadcrumb={t('combat.preview.overline')} />
      <div className="ao-scroll" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}>
          <MobileFrame label={t('combat.mobile.gm')}><MobileCombatGM /></MobileFrame>
          <MobileFrame label={t('combat.mobile.player')}><MobileCombatPlayer /></MobileFrame>
          <MobileFrame label={t('combat.mobile.wait')}><MobileCombatPlayerWaiting /></MobileFrame>
          <MobileFrame label={t('combat.mobile.gen')}><MobileLootGenerator /></MobileFrame>
        </div>
      </div>
    </CombatBackdrop>
  );
}
