import React from 'react';
import type { CSSProperties } from 'react';
import { Shield, Heart, Wind, Gauge, BookOpen, User, Clock, Copy } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
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
import s from './MonsterStatblock.module.css';

const mod = (score: number): string => {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};
const signed = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);

function Diamond({ size = 7, color = 'var(--bronze)' }: { size?: number; color?: string }) {
  return <span className={s.diamond} style={{ '--d-size': `${size}px`, '--d-color': color } as CSSProperties} />;
}
function Divider({ label, color = 'var(--bronze)' }: { label?: string; color?: string }) {
  return (
    <div className={s.divider}>
      <span className={s.lineL} />
      {label ? (
        <span className={s.dividerLabel}>
          <Diamond color={color} />{label}<Diamond color={color} />
        </span>
      ) : <Diamond color={color} />}
      <span className={s.lineR} />
    </div>
  );
}
function PropLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className={s.propLine}>
      <span className={s.propLabel}>{label} · </span>
      {children}
    </p>
  );
}
function DefenseTile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className={cn('ao-panel--inset', s.defTile)}>
      <span className={s.defIcon}>{icon}</span>
      <div className={s.min0}>
        <div className={s.defValue}>{value}</div>
        <div className={s.defLabel}>{label}</div>
      </div>
    </div>
  );
}

function FeatureCard({ f, t, lang }: { f: MonsterFeatureRow; t: TFunc; lang: string }) {
  const featureName = f.name || (lang === 'en' ? f.nameEngloc || f.nameRusloc : f.nameRusloc);
  const featureDescription = f.description || (lang === 'en' ? f.descriptionEngloc || f.descriptionRusloc : f.descriptionRusloc);
  const secondaryName = lang === 'en' ? f.nameRusloc : f.nameEngloc;
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
    <div className={s.feature}>
      <span className={s.featName}>
        {featureName}
        {secondaryName && secondaryName !== featureName ? <span className={s.featEng}> � {secondaryName}</span> : null}
        {recharge}.
      </span>{' '}
      {attackBits.length > 0 && <span className={s.featAttack}>{attackBits.join(', ')}. </span>}
      {featureDescription}
      {f.damages.length > 0 && (
        <span>
          {' '}
          {f.damages.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((d, i) => (
            <span key={d.id}>
              {i > 0 && ' + '}
              <span className={s.featDmg}>
                {d.average != null ? `${d.average} ` : ''}{d.dice ? `(${d.dice})` : ''}
              </span>
              {d.damageType ? ` ${dictName(d.damageType, lang)}` : ''}
              {d.note ? <span className={s.featNote}> — {d.note}</span> : ''}
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
  const monsterName = m.name || (lang === 'en' ? m.nameEngloc || m.nameRusloc : m.nameRusloc);
  const secondaryMonsterName = lang === 'en' ? m.nameRusloc : m.nameEngloc;
  const locale = lang === 'en' ? 'en-US' : 'ru-RU';
  const fmtDate = (iso?: string): string => (iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  const xpText = (() => {
    const base = (m.xpBase ?? 0).toLocaleString(locale);
    return m.xpLair ? t('best.sb.xpWithLair', { base, lair: m.xpLair.toLocaleString(locale) }) : base;
  })();

  const subtitle = [
    `${dictName(m.size, lang)}${m.sizeSecondary ? ` / ${dictName(m.sizeSecondary, lang)}` : ''}${m.isSwarm && m.swarmSize ? ` ${t('best.sb.swarmOf', { size: dictName(m.swarmSize, lang).toLowerCase() })}` : ''}`,
    m.creatureTypes.map((ct) => dictName(ct, lang).toLowerCase()).join(', '),
    m.alignment ? dictName(m.alignment, lang).toLowerCase() : t('best.sb.unaligned'),
  ].filter(Boolean).join(' · ');

  const sections = SECTION_ORDER.filter((sec) => m.features.some((f) => f.section === sec));
  const ft = t('best.sb.ft');

  return (
    <article className={cn('ao-panel ao-frame ao-rise', s.statblock)}>
      <span className="ao-frame-c" />

      <header className={s.header}>
        <div className={s.headerRow}>
          <div className={s.headerMain}>
            <h1 className={cn('ao-h2', s.title)}>{monsterName}</h1>
            {secondaryMonsterName && secondaryMonsterName !== monsterName && <div className={s.titleEng}>{secondaryMonsterName}</div>}
            <p className={s.subtitle}>{subtitle}</p>
          </div>
          <div className={s.crWrap}>
            <div className={cn('ao-panel--inset', s.crTile)}>
              <div className={s.tileLabel}>{t('best.sb.danger')}</div>
              <div className={s.crValue}>{m.crRating}</div>
            </div>
            <div className={cn('ao-panel--inset', s.xpTile)}>
              <div className={s.tileLabel}>{t('best.sb.xp')}</div>
              <div className={s.xpValue}>{xpText}</div>
            </div>
          </div>
        </div>
      </header>

      <div className={s.body}>
        <div className={s.defGrid}>
          <DefenseTile icon={<Shield size={20} />} value={m.armorClass} label={`${t('best.sb.ac')}${m.armorClassText ? ` · ${m.armorClassText}` : ''}`} />
          <DefenseTile icon={<Heart size={20} />} value={m.hpAverage ?? '—'} label={`${t('best.sb.hp')}${m.hpFormula ? ` · ${m.hpFormula}` : ''}`} />
          <DefenseTile icon={<Gauge size={20} />} value={<>{m.initiativeBonus != null ? signed(m.initiativeBonus) : '—'}{m.initiativeScore != null && <span className={s.initScore}> ({m.initiativeScore})</span>}</>} label={t('best.sb.initiative')} />
          <DefenseTile icon={<Wind size={20} />} value={<span className={s.speedText}>{m.speeds.map((sp) => `${dictName(sp.movementType, lang).toLowerCase()} ${sp.ft}${sp.hover ? ` ${t('best.sb.hover')}` : ''}`).join(', ') || '—'}</span>} label={t('best.sb.speed')} />
        </div>

        <div className={cn(s.abilGrid, 'bd-abil')}>
          {ABILITY_SCORE_FIELDS.map((a) => {
            const score = m[a.key];
            const save = m.savingThrows.find((sv) => sv.ability.code === a.full);
            return (
              <div key={a.full} className={cn('ao-stat ao-frame', s.statCell)}>
                <span className="ao-frame-c" />
                <div className="ao-stat-label">{t(abilityShortKey(a.full))}</div>
                <div className={cn('ao-stat-value', s.statValue)}>{score}</div>
                <div className="ao-stat-mod">{mod(score)}</div>
                <div className={cn(s.saveLine, save && s.hasSave)}>
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
          {m.conditionImmunities.length > 0 && <PropLine label={t('best.prop.condImmunities')}>{m.conditionImmunities.map((c) => dictName(c, lang)).join(', ')}</PropLine>}
          {(m.senses.length > 0 || m.passivePerception != null) && (
            <PropLine label={t('best.prop.senses')}>
              {[...m.senses.map((sp) => `${dictName(sp.senseType, lang).toLowerCase()} ${sp.ft} ${ft}`), m.passivePerception != null ? t('best.sb.passivePerception', { n: m.passivePerception }) : null].filter(Boolean).join(', ')}
            </PropLine>
          )}
          {(m.languages.length > 0 || m.telepathyFt != null) && (
            <PropLine label={t('best.prop.languages')}>{[...m.languages.map((l) => dictName(l, lang)), m.telepathyFt != null ? t('best.sb.telepathy', { n: m.telepathyFt }) : null].filter(Boolean).join(', ')}</PropLine>
          )}
          {m.gear.length > 0 && <PropLine label={t('best.prop.gear')}>{m.gear.map((g) => `${dictName(g.item, lang)}${g.qty > 1 ? ` ×${g.qty}` : ''}`).join(', ')}</PropLine>}
          {m.habitats.length > 0 && <PropLine label={t('best.prop.habitats')}>{m.habitats.map((h) => dictName(h, lang)).join(', ')}</PropLine>}
          {m.treasureTags.length > 0 && <PropLine label={t('best.prop.treasure')}>{m.treasureTags.map((tt) => dictName(tt, lang)).join(', ')}</PropLine>}
          {m.proficiencyBonus != null && <PropLine label={t('best.prop.profBonus')}>{signed(m.proficiencyBonus)}</PropLine>}
        </div>

        {sections.map((sec) => (
          <section key={sec}>
            <Divider label={t(sectionKey(sec))} />
            {sec === 'legendary_actions' && m.legendaryText && (
              <p className={s.legendaryText}>
                {m.legendaryText}
                {m.legendaryUsesBase != null && <span> {t('best.atk.uses', { n: m.legendaryUsesBase })}{m.legendaryUsesLair != null ? t('best.atk.usesLair', { n: m.legendaryUsesLair }) : ''}.</span>}
              </p>
            )}
            <div className={s.featureCol}>
              {m.features.filter((f) => f.section === sec).sort((a, b) => a.sortOrder - b.sortOrder).map((f) => <FeatureCard key={f.id} f={f} t={t} lang={lang} />)}
            </div>
          </section>
        ))}

        {m.loreText && (
          <section>
            <Divider label={t('best.sb.lore')} />
            <p className={s.lore}>{m.loreText}</p>
          </section>
        )}
      </div>

      <footer className={s.footer}>
        <div className={s.footerRow}>
          <span className="ao-chip ao-chip--gold">{t(scopeKey(m.scope))}</span>
          <span className={cn(s.footChip, m.isVisibleToPlayers && s.visible)}>
            {m.isVisibleToPlayers ? t('best.sb.visible') : t('best.sb.hiddenF')}
          </span>
          {m.sourceMonsterId && <span className={s.footChip}><Copy size={13} /> {t('best.sb.clone')}</span>}
          {m.createdByUsername && <span className={s.footChip}><User size={13} /> {m.createdByUsername}</span>}
          <span className={s.footChip}><Clock size={13} /> {t('best.sb.createdUpdated', { created: fmtDate(m.createdAt), updated: fmtDate(m.updatedAt) })}</span>
          {m.sources.length > 0 && <span className={s.footChip}><BookOpen size={13} /> {m.sources.map((sr) => dictName(sr, lang)).join(', ')}</span>}
        </div>
      </footer>
    </article>
  );
}
