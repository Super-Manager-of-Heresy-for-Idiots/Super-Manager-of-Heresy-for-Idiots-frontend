import React from 'react';
import { Shield, Heart, Wind, Gauge, BookOpen, User, Clock, Copy } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import type { MonsterFeatureRow, MonsterResponse } from '@/types';
import {
  ABILITY_SCORE_FIELDS,
  SECTION_ORDER,
  abilityShortKey,
  dictName,
  scopeKey,
  sectionKey,
  type TFunc,
} from './constants';

const mod = (score: number): string => {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};
const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

function Diamond({ size = 7, color = 'var(--bronze)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function Divider({ label, color = 'var(--bronze)' }: { label?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--rule) 40%, var(--rule))' }} />
      {label ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--gold-pale)' }}>
          <Diamond color={color} />{label}<Diamond color={color} />
        </span>
      ) : <Diamond color={color} />}
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--rule), var(--rule) 60%, transparent)' }} />
    </div>
  );
}
function PropLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', margin: '0 0 7px' }}>
      <span style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, color: 'var(--gold-pale)' }}>{label} · </span>
      {children}
    </p>
  );
}
function DefenseTile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="ao-panel--inset" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
      <span style={{ color: 'var(--gold)', flexShrink: 0, display: 'flex' }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink-bright)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      </div>
    </div>
  );
}

function FeatureCard({ f, t, lang }: { f: MonsterFeatureRow; t: TFunc; lang: string }) {
  const recharge = f.rechargeMin != null
    ? ` (${t('best.atk.recharge', { range: `${f.rechargeMin}${f.rechargeMax && f.rechargeMax !== f.rechargeMin ? `–${f.rechargeMax}` : ''}` })})`
    : '';
  const attackBits: string[] = [];
  if (f.attackType) {
    attackBits.push(f.attackType === 'melee' ? t('best.atk.melee') : f.attackType === 'ranged' ? t('best.atk.ranged') : f.attackType);
    if (f.attackBonus != null) attackBits.push(t('best.atk.toHit', { n: signed(f.attackBonus) }));
    if (f.reachFt != null) attackBits.push(t('best.atk.reach', { n: f.reachFt }));
    if (f.rangeFt != null) attackBits.push(t('best.atk.range', { r: `${f.rangeFt}${f.rangeLongFt ? `/${f.rangeLongFt}` : ''}` }));
  }
  if (f.saveAbility && f.saveDc != null) attackBits.push(t('best.atk.save', { ability: dictName(f.saveAbility, lang), dc: f.saveDc }));
  return (
    <div style={{ fontSize: 14, lineHeight: 1.62, color: 'var(--ink)', paddingLeft: 14, borderLeft: '1px solid var(--hairline)' }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 16, color: 'var(--ink-bright)' }}>
        {f.nameRusloc}
        {f.nameEngloc ? <span style={{ fontWeight: 400, fontStyle: 'normal', color: 'var(--ink-faint)', fontSize: 13 }}> · {f.nameEngloc}</span> : null}
        {recharge}.
      </span>{' '}
      {attackBits.length > 0 && <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--ink-quiet)' }}>{attackBits.join(', ')}. </span>}
      {f.descriptionRusloc}
      {f.damages.length > 0 && (
        <span>
          {' '}
          {f.damages.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((d, i) => (
            <span key={d.id}>
              {i > 0 && ' + '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-pale)' }}>
                {d.average != null ? `${d.average} ` : ''}{d.dice ? `(${d.dice})` : ''}
              </span>
              {d.damageType ? ` ${dictName(d.damageType, lang)}` : ''}
              {d.note ? <span style={{ color: 'var(--ink-faint)' }}> — {d.note}</span> : ''}
            </span>
          ))}
          {' '}{t('best.atk.dmgSuffix')}
        </span>
      )}
    </div>
  );
}

export default function MonsterStatblock({ monster: m }: { monster: MonsterResponse }) {
  const { t, lang } = useI18n();
  const locale = lang === 'en' ? 'en-US' : 'ru-RU';
  const fmtDate = (iso?: string): string => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  const xpText = (() => {
    const base = (m.xpBase ?? 0).toLocaleString(locale);
    return m.xpLair ? t('best.sb.xpWithLair', { base, lair: m.xpLair.toLocaleString(locale) }) : base;
  })();

  const subtitle = [
    `${dictName(m.size, lang)}${m.sizeSecondary ? ` / ${dictName(m.sizeSecondary, lang)}` : ''}${m.isSwarm && m.swarmSize ? ` ${t('best.sb.swarmOf', { size: dictName(m.swarmSize, lang).toLowerCase() })}` : ''}`,
    m.creatureTypes.map((ct) => ct.nameRusloc.toLowerCase()).join(', '),
    m.alignment ? m.alignment.nameRusloc.toLowerCase() : t('best.sb.unaligned'),
  ].filter(Boolean).join(' · ');

  const sections = SECTION_ORDER.filter((sec) => m.features.some((f) => f.section === sec));
  const ft = t('best.sb.ft');

  return (
    <article className="ao-panel ao-frame ao-rise" style={{ padding: 0 }}>
      <span className="ao-frame-c" />

      <header style={{ padding: 'clamp(20px, 3vw, 30px) clamp(18px, 3vw, 34px)', borderBottom: '1px solid var(--rule)', background: 'linear-gradient(180deg, rgba(176,141,78,0.05), transparent)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: '1 1 260px' }}>
            <h1 className="ao-h2" style={{ fontSize: 'clamp(30px, 5vw, 46px)', color: 'var(--gold-pale)', margin: 0, textShadow: '0 0 24px rgba(176,141,78,0.18)' }}>{m.nameRusloc}</h1>
            {m.nameEngloc && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', color: 'var(--ink-faint)', marginTop: 6, textTransform: 'uppercase' }}>{m.nameEngloc}</div>}
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16, color: 'var(--ink-quiet)', margin: '10px 0 0' }}>{subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
            <div className="ao-panel--inset" style={{ padding: '10px 18px', textAlign: 'center', borderColor: 'var(--brass)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{t('best.sb.danger')}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 600, color: 'var(--gold-pale)', lineHeight: 1.05 }}>{m.crRating}</div>
            </div>
            <div className="ao-panel--inset" style={{ padding: '10px 18px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{t('best.sb.xp')}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--ink-bright)', marginTop: 8 }}>{xpText}</div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: 'clamp(18px, 3vw, 30px) clamp(18px, 3vw, 34px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <DefenseTile icon={<Shield size={20} />} value={m.armorClass} label={`${t('best.sb.ac')}${m.armorClassText ? ` · ${m.armorClassText}` : ''}`} />
          <DefenseTile icon={<Heart size={20} />} value={m.hpAverage ?? '—'} label={`${t('best.sb.hp')}${m.hpFormula ? ` · ${m.hpFormula}` : ''}`} />
          <DefenseTile icon={<Gauge size={20} />} value={<>{m.initiativeBonus != null ? signed(m.initiativeBonus) : '—'}{m.initiativeScore != null && <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}> ({m.initiativeScore})</span>}</>} label={t('best.sb.initiative')} />
          <DefenseTile icon={<Wind size={20} />} value={<span style={{ fontSize: 14, fontFamily: 'var(--font-sans)' }}>{m.speeds.map((sp) => `${sp.movementType.nameRusloc.toLowerCase()} ${sp.ft}${sp.hover ? ` ${t('best.sb.hover')}` : ''}`).join(', ') || '—'}</span>} label={t('best.sb.speed')} />
        </div>

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }} className="bd-abil">
          {ABILITY_SCORE_FIELDS.map((a) => {
            const score = m[a.key];
            const save = m.savingThrows.find((sv) => sv.ability.code === a.full);
            return (
              <div key={a.full} className="ao-stat ao-frame" style={{ padding: '12px 6px' }}>
                <span className="ao-frame-c" />
                <div className="ao-stat-label">{t(abilityShortKey(a.full))}</div>
                <div className="ao-stat-value" style={{ fontSize: 30 }}>{score}</div>
                <div className="ao-stat-mod">{mod(score)}</div>
                <div style={{ marginTop: 7, paddingTop: 6, borderTop: '1px solid var(--hairline)', width: '100%', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: save ? 'var(--gold-pale)' : 'var(--ink-faint)' }}>
                  {t('best.sb.st')} {save ? signed(save.bonus) : mod(score)}
                </div>
              </div>
            );
          })}
        </div>

        <Divider />

        <div>
          {m.skillProficiencies.length > 0 && <PropLine label={t('best.prop.skills')}>{m.skillProficiencies.map((sk) => `${sk.skillName} ${signed(sk.bonus)}`).join(', ')}</PropLine>}
          {m.damageVulnerabilities.length > 0 && <PropLine label={t('best.prop.vulnerabilities')}>{m.damageVulnerabilities.map((d) => `${d.damageType ? dictName(d.damageType, lang) : ''}${d.note ? ` (${d.note})` : ''}`).join(', ')}</PropLine>}
          {m.damageResistances.length > 0 && <PropLine label={t('best.prop.resistances')}>{m.damageResistances.map((d) => `${d.damageType ? dictName(d.damageType, lang) : ''}${d.note ? ` (${d.note})` : ''}`).join(', ')}</PropLine>}
          {m.damageImmunities.length > 0 && <PropLine label={t('best.prop.dmgImmunities')}>{m.damageImmunities.map((d) => `${d.damageType ? dictName(d.damageType, lang) : ''}${d.note ? ` (${d.note})` : ''}`).join(', ')}</PropLine>}
          {m.conditionImmunities.length > 0 && <PropLine label={t('best.prop.condImmunities')}>{m.conditionImmunities.map((c) => c.nameRusloc).join(', ')}</PropLine>}
          {(m.senses.length > 0 || m.passivePerception != null) && (
            <PropLine label={t('best.prop.senses')}>
              {[...m.senses.map((sp) => `${sp.senseType.nameRusloc.toLowerCase()} ${sp.ft} ${ft}`), m.passivePerception != null ? t('best.sb.passivePerception', { n: m.passivePerception }) : null].filter(Boolean).join(', ')}
            </PropLine>
          )}
          {(m.languages.length > 0 || m.telepathyFt != null) && (
            <PropLine label={t('best.prop.languages')}>{[...m.languages.map((l) => l.nameRusloc), m.telepathyFt != null ? t('best.sb.telepathy', { n: m.telepathyFt }) : null].filter(Boolean).join(', ')}</PropLine>
          )}
          {m.gear.length > 0 && <PropLine label={t('best.prop.gear')}>{m.gear.map((g) => `${g.item.nameRusloc}${g.qty > 1 ? ` ×${g.qty}` : ''}`).join(', ')}</PropLine>}
          {m.habitats.length > 0 && <PropLine label={t('best.prop.habitats')}>{m.habitats.map((h) => h.nameRusloc).join(', ')}</PropLine>}
          {m.treasureTags.length > 0 && <PropLine label={t('best.prop.treasure')}>{m.treasureTags.map((tt) => tt.nameRusloc).join(', ')}</PropLine>}
          {m.proficiencyBonus != null && <PropLine label={t('best.prop.profBonus')}>{signed(m.proficiencyBonus)}</PropLine>}
        </div>

        {sections.map((sec) => (
          <section key={sec}>
            <Divider label={t(sectionKey(sec))} />
            {sec === 'legendary_actions' && m.legendaryText && (
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-quiet)', margin: '0 0 14px' }}>
                {m.legendaryText}
                {m.legendaryUsesBase != null && <span> {t('best.atk.uses', { n: m.legendaryUsesBase })}{m.legendaryUsesLair != null ? t('best.atk.usesLair', { n: m.legendaryUsesLair }) : ''}.</span>}
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {m.features.filter((f) => f.section === sec).sort((a, b) => a.sortOrder - b.sortOrder).map((f) => <FeatureCard key={f.id} f={f} t={t} lang={lang} />)}
            </div>
          </section>
        ))}

        {m.loreText && (
          <section>
            <Divider label={t('best.sb.lore')} />
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.7, color: 'var(--ink)', margin: 0 }}>{m.loreText}</p>
          </section>
        )}
      </div>

      <footer style={{ borderTop: '1px solid var(--rule)', background: 'var(--abyss)', padding: '16px clamp(18px, 3vw, 34px)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 18px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--ink-faint)' }}>
          <span className="ao-chip ao-chip--gold">{t(scopeKey(m.scope))}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: m.isVisibleToPlayers ? 'var(--gold-pale)' : 'var(--ink-faint)' }}>
            {m.isVisibleToPlayers ? t('best.sb.visible') : t('best.sb.hiddenF')}
          </span>
          {m.sourceMonsterId && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Copy size={13} /> {t('best.sb.clone')}</span>}
          {m.createdByUsername && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><User size={13} /> {m.createdByUsername}</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={13} /> {t('best.sb.createdUpdated', { created: fmtDate(m.createdAt), updated: fmtDate(m.updatedAt) })}</span>
          {m.sources.length > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><BookOpen size={13} /> {m.sources.map((sr) => sr.nameRusloc).join(', ')}</span>}
        </div>
      </footer>
    </article>
  );
}
