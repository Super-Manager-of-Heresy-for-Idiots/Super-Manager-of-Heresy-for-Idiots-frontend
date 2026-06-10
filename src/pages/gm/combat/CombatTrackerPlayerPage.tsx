import { useState } from 'react';
import {
  OrdoPanel as Panel,
  OrdoChip as Chip,
  OrdoDivider as Divider,
  OrdoField,
  PanelHeader,
  Rune,
} from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { CombatBackdrop, CombatTopBar } from '@/components/combat/shell';
import { Tabs, Stepper } from '@/components/combat/primitives';
import {
  ParticipantCard,
  CombatHPBar,
  ACBadge,
  CombatPortrait,
  AttackResultCard,
  LogEntry,
  RoundDivider,
  EncounterStatusBadge,
  HealthWordBadge,
} from '@/components/combat/kit';
import { GM_INITIAL, PL_ATTACKS, PL_LOG, PL_SELF } from '@/components/combat/data';

interface PageProps {
  myTurn?: boolean;
}

export default function CombatTrackerPlayerPage({ myTurn = true }: PageProps) {
  const t = useT();
  const [tab, setTab] = useState('attack');
  const [attackId, setAttackId] = useState('p1');
  const [healVal, setHealVal] = useState(4);
  const [result, setResult] = useState<{ mode: 'HIT' | 'MISS' | 'CRIT'; roll: number; bonus: number; vsAC: number; dmg: number | null } | null>(null);
  const [toast, setToast] = useState(myTurn);

  const ps = GM_INITIAL;
  const order = [...ps].sort((a, b) => b.init - a.init);
  const activeId = myTurn ? PL_SELF : 'ogr';
  const me = ps.find((p) => p.id === PL_SELF)!;
  const activeP = ps.find((p) => p.id === activeId)!;
  const upcoming = (() => {
    const i = order.findIndex((p) => p.id === activeId);
    return [1, 2, 3].map((k) => order[(i + k) % order.length]).filter((p) => p.cur > 0);
  })();

  const rollAttack = () => {
    const roll = 1 + Math.floor(Math.random() * 20);
    const atk = PL_ATTACKS.find((a) => a.id === attackId)!;
    const mode: 'HIT' | 'MISS' | 'CRIT' = roll === 20 ? 'CRIT' : roll + atk.bonus >= 13 && roll !== 1 ? 'HIT' : 'MISS';
    const base = 2 + Math.floor(Math.random() * 6);
    setResult({ mode, roll, bonus: atk.bonus, vsAC: 13, dmg: mode === 'MISS' ? null : mode === 'CRIT' ? base * 2 : base });
  };

  return (
    <CombatBackdrop>
      <CombatTopBar
        title={t('combat.tracker.title')}
        breadcrumb={t('combat.tracker.breadcrumb')}
        right={<Chip glyph="helm">{t('combat.tracker.playerChip', { name: 'Мира Тэн' })}</Chip>}
      />

      {/* Top bar — no GM controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid var(--rule)', background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))' }}>
        <div className="ao-frame" style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '8px 18px', background: 'var(--abyss)', border: '1px solid var(--rule-strong)' }}>
          <span className="ao-frame-c" />
          <span className="ao-overline" style={{ color: 'var(--gold)' }}>{t('combat.tracker.round')}</span>
          <span className="ao-num" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink-bright)', lineHeight: 1 }}>2</span>
        </div>
        <EncounterStatusBadge status="ACTIVE" round={2} />
        <span style={{ flex: 1 }} />
        {myTurn ? (
          <span className="cb-pulse" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', border: '1px solid var(--gold)', background: 'rgba(176,141,78,0.10)', color: 'var(--gold-pale)' }}>
            <Rune kind="sword" size={13} />
            <span className="ao-engraved" style={{ fontSize: 13, color: 'var(--gold-pale)' }}>{t('combat.player.yourTurn')}</span>
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--ink-quiet)' }}>
            <Rune kind="cir-dot" size={11} color="var(--ink-faint)" />
            <span className="ao-italic" style={{ fontSize: 14 }}>{t('combat.player.acting', { name: activeP.name })}</span>
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Queue — player view */}
        <div className="ao-scroll" style={{ width: 320, flexShrink: 0, borderRight: '1px solid var(--rule)', overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.18)' }}>
          <span className="ao-overline" style={{ padding: '0 2px 4px' }}>{t('combat.tracker.queue')}</span>
          {order.map((p) => (
            <ParticipantCard key={p.id} p={p} active={p.id === activeId} view="player" isSelf={p.id === PL_SELF} />
          ))}
        </div>

        {/* Player action panel */}
        <div className="ao-scroll" style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: 18 }}>
          {myTurn ? (
            <Panel padding={0} frame>
              <span className="ao-frame-c" />
              <PanelHeader title={t('combat.player.yourActions')} glyph="sword" sub={t('combat.player.actingSub')} right={<Chip tone="gold">{t('combat.player.budget')}</Chip>} />
              <Tabs
                active={tab}
                onChange={setTab}
                items={[
                  { id: 'attack', label: t('combat.tab.attack') },
                  { id: 'heal', label: t('combat.tab.healSelf') },
                ]}
              />
              {tab === 'attack' && (
                <div className="ao-rgrid" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label className="ao-label">{t('combat.label.weapon')}</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {PL_ATTACKS.map((a) => (
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
                            <span className="ao-codex">+{a.bonus} · {a.dice}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block" onClick={rollAttack}>
                      <Rune kind="hex" size={14} /> {t('combat.rollAttack')}
                    </button>
                    <button className="ao-btn ao-btn--block">{t('combat.player.endTurn')} <Rune kind="arrow-r" size={12} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label className="ao-label">{t('combat.label.result')}</label>
                    {result ? (
                      <AttackResultCard mode={result.mode} roll={result.roll} bonus={result.bonus} vsAC={result.vsAC} dmg={result.dmg} dmgType="piercing" />
                    ) : (
                      <div style={{ padding: '28px 20px', border: '1px dashed var(--rule)', textAlign: 'center' }}>
                        <Rune kind="hex" size={26} color="var(--ink-ghost)" />
                        <div className="ao-italic" style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-faint)' }}>{t('combat.player.pickWeaponHint')}</div>
                      </div>
                    )}
                    <Divider>{t('combat.player.yourTarget')}</Divider>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
                      <CombatPortrait kind="mon" size={40} />
                      <div style={{ flex: 1 }}>
                        <div className="ao-h6" style={{ fontSize: 14 }}>Гоблин-разведчик · A</div>
                        <div style={{ marginTop: 5 }}><HealthWordBadge cur={7} max={12} size="sm" /></div>
                      </div>
                      <ACBadge value={13} />
                    </div>
                  </div>
                </div>
              )}
              {tab === 'heal' && (
                <div className="ao-rgrid" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <OrdoField label={t('combat.player.healPotions')} hint={t('combat.player.healPotionsHint')}>
                      <select className="ao-input">
                        <option>{t('combat.player.potionOpt')}</option>
                        <option>{t('combat.player.hitDieOpt')}</option>
                      </select>
                    </OrdoField>
                    <div>
                      <label className="ao-label">{t('combat.player.orManual')}</label>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <Stepper big value={healVal} onChange={setHealVal} min={1} />
                        <button className="ao-btn" style={{ borderColor: '#7a986677', color: '#9eb88e' }}><Rune kind="plus" size={12} /> {t('combat.player.healSelf')}</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="ao-label">{t('combat.label.you')}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--abyss)', border: '1px solid var(--rule)' }}>
                      <CombatPortrait kind="pc" size={44} />
                      <div style={{ flex: 1 }}>
                        <div className="ao-h6" style={{ fontSize: 15 }}>{me.name}</div>
                        <div style={{ marginTop: 5 }}><CombatHPBar cur={me.cur} max={me.max} temp={me.temp} size="lg" /></div>
                      </div>
                      <ACBadge value={me.ac} />
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          ) : (
            <Panel padding={0} frame style={{ opacity: 0.92 }}>
              <span className="ao-frame-c" />
              <PanelHeader title={t('combat.player.waitTitle')} glyph="cir-dot" tone="arcane" sub={t('combat.player.waitSub')} />
              <div style={{ padding: '34px 24px', textAlign: 'center' }}>
                <CombatPortrait kind={activeP.kind} size={64} />
                <div className="ao-h4" style={{ marginTop: 14 }}>{t('combat.player.actingNow', { name: activeP.name })}</div>
                <div className="ao-italic" style={{ marginTop: 6, color: 'var(--ink-quiet)' }}>{t('combat.player.watchQueue')}</div>
                <Divider>{t('combat.player.nextInQueue')}</Divider>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                  {upcoming.map((p, i) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--abyss)', border: `1px solid ${p.id === PL_SELF ? 'var(--gold)' : 'var(--rule)'}` }}>
                      <span className="ao-codex">{i + 1}</span>
                      <CombatPortrait kind={p.kind} size={26} unknown={p.hidden} />
                      <span style={{ fontSize: 13, color: p.id === PL_SELF ? 'var(--gold-pale)' : 'var(--ink)' }}>
                        {p.hidden ? t('combat.unknownCreature') : p.id === PL_SELF ? `${t('combat.you')} — ${p.name}` : p.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 26, display: 'inline-block', textAlign: 'left' }}>
                  <label className="ao-label">{t('combat.player.yourState')}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--abyss)', border: '1px solid var(--rule)', minWidth: 320 }}>
                    <CombatPortrait kind="pc" size={38} />
                    <div style={{ flex: 1 }}><CombatHPBar cur={me.cur} max={me.max} temp={me.temp} /></div>
                    <ACBadge value={me.ac} size="sm" />
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>

        {/* Log — player view */}
        <div style={{ width: 330, flexShrink: 0, borderLeft: '1px solid var(--rule)', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', borderBottom: '1px solid var(--rule)', color: 'var(--ink-quiet)' }}>
            <Rune kind="book" size={14} />
            <span className="ao-overline">{t('combat.log')}</span>
          </div>
          <div className="ao-scroll" style={{ flex: 1, overflow: 'auto' }}>
            {PL_LOG.map((e, i) =>
              e.type === 'round' ? (
                <RoundDivider key={i} n={e.n as number} />
              ) : (
                <LogEntry key={i} type={e.type} text={e.text} detail={e.detail} open={i === PL_LOG.length - 1} time={e.time} />
              ),
            )}
          </div>
        </div>
      </div>

      {/* Toast "Your turn!" */}
      {myTurn && toast && (
        <div className="ao-rise" style={{ position: 'absolute', top: 76, right: 24, zIndex: 30 }}>
          <div className="cb-pulse" style={{ background: 'linear-gradient(180deg, var(--panel-raised), var(--panel))', border: '1px solid var(--gold)', borderLeft: '3px solid var(--gold)', boxShadow: 'var(--shadow-high), 0 0 30px rgba(176,141,78,0.2)', padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center', maxWidth: 380 }}>
            <span style={{ width: 40, height: 40, flexShrink: 0, border: '1px solid var(--gold)', background: 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Rune kind="sword" size={18} color="var(--gold-pale)" />
            </span>
            <div style={{ flex: 1 }}>
              <div className="ao-engraved" style={{ fontSize: 14, color: 'var(--gold-pale)' }}>{t('combat.player.toastTitle')}</div>
              <div style={{ fontSize: 12.5, marginTop: 3, color: 'var(--ink-quiet)' }}>{t('combat.player.toastBody')}</div>
            </div>
            <button className="ao-iconbtn" onClick={() => setToast(false)} style={{ borderColor: 'transparent' }}><Rune kind="x" size={12} /></button>
          </div>
        </div>
      )}
    </CombatBackdrop>
  );
}
