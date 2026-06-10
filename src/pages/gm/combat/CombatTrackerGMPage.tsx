import { useState } from 'react';
import {
  OrdoPanel as Panel,
  OrdoChip as Chip,
  OrdoDivider as Divider,
  PanelHeader,
  Rune,
} from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { Tabs, Toggle, Stepper, AdvSegment, DisabledWithTip } from '@/components/combat/primitives';
import {
  ParticipantCard,
  CombatHPBar,
  ACBadge,
  CombatPortrait,
  AttackResultCard,
  LogEntry,
  RoundDivider,
  EncounterStatusBadge,
  StateBanner,
} from '@/components/combat/kit';
import {
  GM_INITIAL,
  GM_ATTACKS,
  GM_INITIAL_LOG,
  CONDITIONS,
  type Participant,
  type LogItem,
} from '@/components/combat/data';
import { OrdoField } from '@/components/ordo';

/* ── Combat control bar (round + turn controls) ──────────────── */

interface ControlBarProps {
  round: number;
  paused: boolean;
  onPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  prevDisabled: boolean;
}

function CombatControlBar({ round, paused, onPause, onPrev, onNext, prevDisabled }: ControlBarProps) {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--rule)', background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))', flexWrap: 'wrap' }}>
      <div className="ao-frame" style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 18px', background: 'var(--abyss)', border: '1px solid var(--rule-strong)' }}>
        <span className="ao-frame-c" />
        <span className="ao-overline" style={{ color: 'var(--gold)' }}>{t('combat.tracker.round')}</span>
        <span className="ao-num" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink-bright)', lineHeight: 1 }}>{round}</span>
      </div>
      <EncounterStatusBadge status={paused ? 'PAUSED' : 'ACTIVE'} round={round} />
      <span style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button className="ao-btn" onClick={onPause}>
          <Rune kind={paused ? 'chev-r' : 'minus'} size={11} /> {paused ? t('combat.tracker.resume') : t('combat.tracker.pause')}
        </button>
        {prevDisabled ? (
          <DisabledWithTip label={t('combat.tracker.prevTurn')} tip={t('combat.tracker.prevTip')} />
        ) : (
          <button className="ao-btn" onClick={onPrev}>{t('combat.tracker.prevTurn')}</button>
        )}
        <button className="ao-btn ao-btn--primary ao-btn--lg" onClick={onNext} style={{ minWidth: 220 }}>
          {t('combat.tracker.nextTurn')} <Rune kind="arrow-r" size={14} />
        </button>
        <button className="ao-btn ao-btn--danger">{t('combat.tracker.endCombat')}</button>
      </div>
    </div>
  );
}

/* ── GM tracker page ─────────────────────────────────────────── */

interface PageProps {
  initialPaused?: boolean;
}

const DMG_TYPES: [string, string][] = [
  ['slashing', 'combat.dmgType.slashing'],
  ['piercing', 'combat.dmgType.piercing'],
  ['bludgeon', 'combat.dmgType.bludgeon'],
  ['fire', 'combat.dmgType.fire'],
  ['cold', 'combat.dmgType.cold'],
  ['poison', 'combat.dmgType.poison'],
  ['necrotic', 'combat.dmgType.necrotic'],
  ['radiant', 'combat.dmgType.radiant'],
];

export default function CombatTrackerGMPage({ initialPaused = false }: PageProps) {
  const t = useT();
  const [ps, setPs] = useState<Participant[]>(GM_INITIAL);
  const [activeId, setActiveId] = useState('kael');
  const [round, setRound] = useState(2);
  const [paused, setPaused] = useState(initialPaused);
  const [tab, setTab] = useState('attack');
  const [targetId, setTargetId] = useState('gob1');
  const [attackId, setAttackId] = useState('a1');
  const [adv, setAdv] = useState('norm');
  const [autoRoll, setAutoRoll] = useState(true);
  const [result, setResult] = useState<{ mode: 'HIT' | 'MISS' | 'CRIT'; roll: number; bonus: number; vsAC: number; dmg: number | null }>(
    { mode: 'HIT', roll: 14, bonus: 7, vsAC: 13, dmg: 9 },
  );
  const [dmgVal, setDmgVal] = useState(5);
  const [logOpen, setLogOpen] = useState(true);
  const [log, setLog] = useState<LogItem[]>(GM_INITIAL_LOG);
  const [logFlash, setLogFlash] = useState(false);

  const order = [...ps].sort((a, b) => b.init - a.init);
  const active = ps.find((p) => p.id === activeId) || ps[0];
  const target = ps.find((p) => p.id === targetId) || ps[1];
  const attack = GM_ATTACKS.find((a) => a.id === attackId)!;

  const pushLog = (entry: LogItem) => {
    setLog((l) => [...l, { time: '0' + round + ':' + String(Math.floor(Math.random() * 50) + 10), ...entry }]);
    setLogFlash(true);
    setTimeout(() => setLogFlash(false), 500);
  };

  const nextTurn = () => {
    const i = order.findIndex((p) => p.id === activeId);
    let j = i;
    let hops = 0;
    do {
      j = (j + 1) % order.length;
      hops++;
    } while (order[j].cur <= 0 && hops < order.length);
    if (j <= i) {
      setRound((r) => r + 1);
      pushLog({ type: 'round', n: round + 1 });
    }
    setActiveId(order[j].id);
    pushLog({ type: 'turn', text: t('combat.tracker.turnMovesTo', { name: order[j].name }) });
  };

  const prevTurn = () => {
    const i = order.findIndex((p) => p.id === activeId);
    let j = i;
    let hops = 0;
    do {
      j = (j - 1 + order.length) % order.length;
      hops++;
    } while (order[j].cur <= 0 && hops < order.length);
    setActiveId(order[j].id);
  };

  const rollAttack = () => {
    const roll = autoRoll ? 1 + Math.floor(Math.random() * 20) : 14;
    const mode: 'HIT' | 'MISS' | 'CRIT' = roll === 20 ? 'CRIT' : roll + attack.bonus >= target.ac && roll !== 1 ? 'HIT' : 'MISS';
    const base = 3 + Math.floor(Math.random() * 8);
    const dmg = mode === 'CRIT' ? base * 2 : mode === 'HIT' ? base : null;
    setResult({ mode, roll, bonus: attack.bonus, vsAC: target.ac, dmg });
    const dmgSuffix = dmg ? t('combat.atkLogDmgSuffix', { n: dmg }) : '';
    const textKey = mode === 'CRIT' ? 'combat.atkLogCrit' : mode === 'HIT' ? 'combat.atkLogHit' : 'combat.atkLogMiss';
    const advNote = adv !== 'norm' ? ` · ${adv === 'adv' ? t('combat.adv.adv') : t('combat.adv.dis')}` : '';
    pushLog({
      type: 'attack',
      text: t(textKey, { actor: active.name, target: target.name, attack: attack.name, dmg: dmgSuffix }),
      detail: `${t('combat.d20')}: ${roll} + ${attack.bonus} = ${roll + attack.bonus} ${t('combat.atk.against')} ${target.ac}${advNote}`,
    });
  };

  const applyHP = (delta: number, kindKey: string) => {
    setPs((arr) => arr.map((p) => (p.id === targetId ? { ...p, cur: Math.max(0, Math.min(p.max, p.cur + delta)) } : p)));
    const after = Math.max(0, Math.min(target.max, target.cur + delta));
    pushLog({
      type: delta < 0 ? 'attack' : 'heal',
      text: t('combat.applyHit', { name: target.name, kind: t(kindKey), n: Math.abs(delta), after, max: target.max }),
    });
    if (after === 0) pushLog({ type: 'down', text: t('combat.downLog', { name: target.name }) });
  };

  const toggleCond = (cid: string) => {
    setPs((arr) =>
      arr.map((p) => {
        if (p.id !== targetId) return p;
        const has = p.conds.includes(cid);
        pushLog({
          type: 'cond',
          text: t(has ? 'combat.condUnset' : 'combat.condSet', { cond: t(CONDITIONS[cid].labelKey), name: p.name }),
        });
        return { ...p, conds: has ? p.conds.filter((c) => c !== cid) : [...p.conds, cid] };
      }),
    );
  };

  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.tracker.title')}
        breadcrumb={t('combat.tracker.breadcrumb')}
        right={<Chip tone="gold" glyph="helm">{t('combat.tracker.gmChip')}</Chip>}
      />
      {paused && <StateBanner kind="paused" />}
      <CombatControlBar round={round} paused={paused} onPause={() => setPaused((v) => !v)} onPrev={prevTurn} onNext={nextTurn} prevDisabled={round === 1} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, opacity: paused ? 0.55 : 1, filter: paused ? 'saturate(0.6)' : 'none', transition: 'all 300ms' }}>
        {/* Initiative queue */}
        <div className="ao-scroll" style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--rule)', overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px 4px' }}>
            <span className="ao-overline">{t('combat.tracker.queue')}</span>
            <span className="ao-codex">{t('combat.inFormation', { n: order.filter((p) => p.cur > 0).length })}</span>
          </div>
          {order.map((p) => (
            <ParticipantCard key={p.id} p={p} active={p.id === activeId} targeted={p.id === targetId && p.id !== activeId} view="gm" onClick={() => setTargetId(p.id)} />
          ))}
        </div>

        {/* Action panel */}
        <div className="ao-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: 18 }}>
          <Panel padding={0} frame>
            <span className="ao-frame-c" />
            <PanelHeader
              title={t('combat.tracker.actionPanel')}
              glyph="sword"
              sub={t('combat.tracker.actingTarget', { actor: active.name, target: target.name })}
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ao-codex">{t('combat.target')}</span>
                  <span className="ao-chip ao-chip--ember">{target.name}</span>
                </div>
              }
            />
            <Tabs
              active={tab}
              onChange={setTab}
              items={[
                { id: 'attack', label: t('combat.tab.attack') },
                { id: 'hp', label: t('combat.tab.hp') },
                { id: 'cond', label: t('combat.tab.cond') },
                { id: 'note', label: t('combat.tab.note') },
              ]}
            />

            {tab === 'attack' && (
              <div className="ao-rgrid" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="ao-label">{t('combat.label.attack')}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {GM_ATTACKS.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setAttackId(a.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            background: attackId === a.id ? 'linear-gradient(90deg, rgba(176,141,78,0.10), var(--panel))' : 'var(--abyss)',
                            border: `1px solid ${attackId === a.id ? 'var(--brass)' : 'var(--rule)'}`,
                            transition: 'all 150ms',
                          }}
                        >
                          <Rune kind="sword" size={14} color={attackId === a.id ? 'var(--gold-pale)' : 'var(--ink-faint)'} />
                          <span style={{ flex: 1, color: attackId === a.id ? 'var(--ink-bright)' : 'var(--ink)', fontSize: 13.5 }}>{a.name}</span>
                          <span className="ao-codex">+{a.bonus} · {a.dice} {a.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="ao-label">{t('combat.label.roll')}</label>
                    <AdvSegment value={adv} onChange={setAdv} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--ink)' }}>{t('combat.autoRoll')}</div>
                      <div className="ao-codex" style={{ marginTop: 2 }}>{autoRoll ? t('combat.autoRollOn') : t('combat.autoRollOff')}</div>
                    </div>
                    <Toggle on={autoRoll} onChange={setAutoRoll} />
                  </div>
                  {!autoRoll && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      <OrdoField label={t('combat.field.d20')}>
                        <input className="ao-input" defaultValue="14" style={{ width: 110 }} />
                      </OrdoField>
                      <OrdoField label={t('combat.field.dmg')}>
                        <input className="ao-input" defaultValue="9" style={{ width: 110 }} />
                      </OrdoField>
                    </div>
                  )}
                  <button className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block" onClick={rollAttack}>
                    <Rune kind="hex" size={14} /> {t('combat.rollAttack')}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label className="ao-label">{t('combat.label.result')}</label>
                  <AttackResultCard mode={result.mode} roll={result.roll} bonus={result.bonus} vsAC={result.vsAC} dmg={result.dmg} dmgType={attack.type === 'светлый' ? 'radiant' : attack.type === 'колющий' ? 'piercing' : 'slashing'} />
                  {result.mode !== 'MISS' && result.dmg != null ? (
                    <button className="ao-btn ao-btn--danger ao-btn--block" onClick={() => applyHP(-(result.dmg as number), 'combat.kind.damage')}>
                      {t('combat.applyDamage', { dmg: result.dmg, target: target.name })}
                    </button>
                  ) : (
                    <div className="ao-italic" style={{ fontSize: 13, textAlign: 'center', color: 'var(--ink-faint)' }}>{t('combat.missNoDamage')}</div>
                  )}
                  <Divider>{t('combat.target')}</Divider>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
                    <CombatPortrait kind={target.kind} size={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ao-h6" style={{ fontSize: 14 }}>{target.name}</div>
                      <div style={{ marginTop: 4 }}><CombatHPBar cur={target.cur} max={target.max} temp={target.temp} /></div>
                    </div>
                    <ACBadge value={target.ac} />
                  </div>
                </div>
              </div>
            )}

            {tab === 'hp' && (
              <div className="ao-rgrid" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label className="ao-label">{t('combat.label.value')}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <Stepper big value={dmgVal} onChange={setDmgVal} min={1} />
                      {[1, 5, 10].map((n) => (
                        <button key={n} className="ao-btn ao-btn--sm" onClick={() => setDmgVal((v) => v + n)}>+{n}</button>
                      ))}
                    </div>
                  </div>
                  <OrdoField label={t('combat.dmgTypeLabel')}>
                    <select className="ao-input" defaultValue="slashing">
                      {DMG_TYPES.map(([v, k]) => (
                        <option key={v} value={v}>{t(k)}</option>
                      ))}
                    </select>
                  </OrdoField>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="ao-btn ao-btn--danger ao-btn--lg" style={{ flex: 1 }} onClick={() => applyHP(-dmgVal, 'combat.kind.damage')}>
                      <Rune kind="sword" size={13} /> {t('combat.damageBtn', { n: dmgVal })}
                    </button>
                    <button className="ao-btn ao-btn--lg" style={{ flex: 1, borderColor: '#7a986677', color: '#9eb88e' }} onClick={() => applyHP(dmgVal, 'combat.kind.heal')}>
                      <Rune kind="plus" size={13} /> {t('combat.healBtn', { n: dmgVal })}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="ao-label">{t('combat.label.targetWord')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
                    <CombatPortrait kind={target.kind} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="ao-h6" style={{ fontSize: 15 }}>{target.name}</div>
                      <div style={{ marginTop: 5 }}><CombatHPBar cur={target.cur} max={target.max} temp={target.temp} size="lg" /></div>
                    </div>
                  </div>
                  <div className="ao-italic" style={{ fontSize: 12.5, marginTop: 10, color: 'var(--ink-faint)' }}>{t('combat.changeTargetHint')}</div>
                </div>
              </div>
            )}

            {tab === 'cond' && (
              <div style={{ padding: 18 }}>
                <label className="ao-label">{t('combat.condOfTarget', { name: target.name })}</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 8 }}>
                  {Object.keys(CONDITIONS).map((cid) => {
                    const on = target.conds.includes(cid);
                    const meta = CONDITIONS[cid];
                    return (
                      <button
                        key={cid}
                        onClick={() => toggleCond(cid)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '11px 12px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          background: on ? 'rgba(0,0,0,0.5)' : 'var(--panel)',
                          border: `1px solid ${on ? meta.c : 'var(--rule)'}`,
                          boxShadow: on ? `inset 0 0 10px ${meta.c}18` : 'none',
                          transition: 'all 150ms',
                        }}
                      >
                        <Rune kind={meta.glyph} size={13} color={on ? meta.c : 'var(--ink-faint)'} />
                        <span style={{ flex: 1, fontSize: 12.5, color: on ? 'var(--ink-bright)' : 'var(--ink-quiet)' }}>{t(meta.labelKey)}</span>
                        {on && <Rune kind="check" size={11} color={meta.c} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'note' && (
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <OrdoField label={t('combat.noteField')} hint={t('combat.noteHint')}>
                  <textarea className="ao-input" rows={4} placeholder={t('combat.notePlaceholder')} id="cb-note-input" />
                </OrdoField>
                <div>
                  <button
                    className="ao-btn ao-btn--primary"
                    onClick={() => {
                      const el = document.getElementById('cb-note-input') as HTMLTextAreaElement | null;
                      if (el && el.value.trim()) {
                        pushLog({ type: 'note', text: el.value.trim() });
                        el.value = '';
                      }
                    }}
                  >
                    <Rune kind="scroll" size={12} /> {t('combat.writeChronicle')}
                  </button>
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* Combat log */}
        <div style={{ width: logOpen ? 330 : 46, flexShrink: 0, borderLeft: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.18)', transition: 'width 250ms' }}>
          <button
            onClick={() => setLogOpen((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', cursor: 'pointer', color: logFlash ? 'var(--gold-pale)' : 'var(--ink-quiet)' }}
          >
            <Rune kind="book" size={14} color="currentColor" />
            {logOpen && <span className="ao-overline" style={{ color: 'currentColor' }}>{t('combat.log')}</span>}
            {logOpen && <span style={{ flex: 1 }} />}
            <Rune kind="chev-r" size={11} color="currentColor" />
          </button>
          {logOpen && (
            <div className="ao-scroll" style={{ flex: 1, overflow: 'auto' }}>
              {log.map((e, i) =>
                e.type === 'round' ? (
                  <RoundDivider key={i} n={e.n as number} />
                ) : (
                  <LogEntry key={i} type={e.type} text={e.text} detail={e.detail} open={i === log.length - 1} time={e.time || '—'} />
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </CombatBackdrop>
  );
}
