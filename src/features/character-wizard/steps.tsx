import { useMemo, useState } from 'react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
  OrdoAssetIcon,
  OrdoInterfaceIcon,
  spellLevelIcon,
} from '@/components/ordo';
import {
  ABILITIES,
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  SKILLS,
  STANDARD_ARRAY,
  abilityKeyByStatName,
  abilityMod,
  asiFromDetail,
  clamp,
  fmtMod,
  maxSpellLevel,
  mergeAsi,
  pointBuySpent,
  profByLevel,
  spellLimits,
  type AbilityKey,
} from '@/data/wizard5e';
import { ALIGNMENTS } from '@/data/wizard5e';
import { useT } from '@/i18n/I18nContext';
import { useGameTerms } from '@/i18n/gameTerms';
import { cn } from '@/lib/utils';
import css from './steps.module.css';
import { CREATION_LEVEL } from './wizardState';
import type { WizardActions, WizardChar, ScoreMethod } from './wizardState';
import type { ContentLabel, SpellReferenceResponse, StatTypeResponse } from '@/types';
import { isContentRewardGroup, rewardGroupKey } from '@/lib/contentAdapters';
import { RewardGroupPicker } from '@/components/content-rewards/RewardGroupPicker';
import { initialContentRewardGroupsOf } from './rewardSelection';
import {
  DetailLine,
  StepHead,
  WizCard,
  type WizardAvailability,
} from './parts';
import {
  PORTRAIT_GALLERY,
  glyphForClass,
  makePortrait,
} from './parts.helpers';

// Resolve an AbilityKey from a backend stat id/name (statTypes carry localized names).
const makeStatResolver = (statTypes: StatTypeResponse[]) => (statName: string): AbilityKey | undefined => {
  const byId = statTypes.find((s) => s.id === statName)?.name;
  return abilityKeyByStatName(byId ?? statName);
};

export interface StepProps {
  c: WizardChar;
  A: WizardActions;
  n: number;
  total: number;
  availability: WizardAvailability;
}

const norm = (value: string | undefined): string => (value || '').trim().toLowerCase();
const skillKeyForLabel = (label: string): string | undefined => SKILLS.find((skill) => norm(skill.label) === norm(label))?.key;
const shortStatName = (name: string): string => ABILITIES.find((a) => norm(a.label) === norm(name))?.abbr || name;
const abilityKeyForStatName = (name: string): AbilityKey | undefined => ABILITIES.find((a) => norm(a.label) === norm(name))?.key;
const dbAsiText = (
  items: { statName: string; bonus: number }[] | undefined,
  fmtAbbr: (s: string) => string = (s) => s,
): string =>
  items?.length ? items.map((item) => fmtAbbr(shortStatName(item.statName)) + ' +' + item.bonus).join(' \u00b7 ') : '\u2014';

// ════════════════════════════════════════════════════════════
// STEP 1 — BASICS
// ════════════════════════════════════════════════════════════
export function StepBasics({ c, A, n, total }: StepProps) {
  const t = useT();
  const gt = useGameTerms();
  return (
    <div className="wiz-narrow">
      <StepHead n={n} total={total} title={t('wiz.basics.title')} sub={t('wiz.basics.sub')} />
      <OrdoPanel frame padding={0}>
        <div className={css.colPad24}>
          <div>
            <label className="ao-label">{t('wiz.forge.characterName')} <span className="wiz-req">{t('wiz.basics.required')}</span></label>
            <input
              className={cn('ao-input', css.nameInput)}
              autoFocus
              value={c.name}
              placeholder={t('wiz.forge.nameSoul')}
              onChange={(e) => A.patch({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="ao-label">{t('wiz.basics.alignment')}</label>
            <div className="wiz-align-grid">
              {ALIGNMENTS.map((al) => (
                <button
                  key={al}
                  type="button"
                  className={'wiz-align' + (c.alignment === al ? ' is-active' : '')}
                  onClick={() => A.patch({ alignment: al })}
                >
                  {gt.alignment(al)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </OrdoPanel>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2 — RACE + AVATAR
// ════════════════════════════════════════════════════════════
export function StepRace({ c, A, n, total, availability }: StepProps) {
  const t = useT();
  const gt = useGameTerms();
  const resolveKey = useMemo(() => makeStatResolver(availability.statTypes), [availability.statTypes]);
  const selectedRace = availability.raceOptions.find((r) => r.key === c.raceKey);
  const selectedRaceDetail = selectedRace?.detail;
  const selectedDbSubrace = selectedRaceDetail?.subraces?.find((s) => s.id === c.subraceKey);
  const pickRace = (option: typeof availability.raceOptions[number]) => {
    const detail = option.detail;
    A.setRace(option.key, option.entry.name, {
      racialAsi: asiFromDetail(detail?.abilityScoreIncreases, resolveKey),
      speed: detail?.speed ?? 30,
      traits: detail?.traits ?? [],
    });
  };
  const pickSubrace = (subraceId: string) => {
    const sub = selectedRaceDetail?.subraces?.find((s) => s.id === subraceId);
    if (!sub || !selectedRaceDetail) {
      A.setSubrace(subraceId);
      return;
    }
    A.setSubrace(subraceId, {
      raceLabel: selectedRaceDetail.name + ' (' + sub.name + ')',
      racialAsi: mergeAsi(
        asiFromDetail(selectedRaceDetail.abilityScoreIncreases, resolveKey),
        asiFromDetail(sub.abilityScoreIncreases, resolveKey),
      ),
      speed: sub.speedOverride ?? selectedRaceDetail.speed ?? 30,
      traits: sub.traits?.length ? sub.traits : selectedRaceDetail.traits,
    });
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => A.setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };
  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.race.title')} sub={t('wiz.race.sub')} />
      <div className="wiz-split">
        <div>
          <div className="wiz-grid">
            {availability.raceOptions.map((option) => {
              const detail = option.detail;
              const source = option.entry.homebrewTitle || option.entry.source;
              return (
                <WizCard
                  key={option.key}
                  active={c.raceKey === option.key}
                  onClick={() => pickRace(option)}
                  glyph="hex"
                  icon="species"
                  title={option.entry.name}
                  sub={(detail ? dbAsiText(detail.abilityScoreIncreases, gt.abilityAbbr) + ' \u00b7 ' + (detail.speed ?? 30) + ' ' + t('wiz.race.ft') : '30 ' + t('wiz.race.ft')) + ' \u00b7 ' + source}
                />
              );
            })}
            {!availability.raceOptions.length && (
              <div className="ao-codex">{t('wiz.race.noRaces')}</div>
            )}
          </div>
        </div>

        <div className="wiz-side">
          <OrdoPanel frame padding={0}>
            <PanelHeader title={selectedRaceDetail?.name || selectedRace?.entry.name || t('wiz.race.selectRace')} icon="species" />
            <div className={css.pad16}>
              {selectedRaceDetail ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>{selectedRaceDetail.description}</div>
                  <DetailLine label={t('wiz.race.source')}>{selectedRace?.entry.homebrewTitle || selectedRace?.entry.source}</DetailLine>
                  <DetailLine label={t('wiz.race.abilityBonus')}>{dbAsiText(selectedDbSubrace?.abilityScoreIncreases || selectedRaceDetail.abilityScoreIncreases, gt.abilityAbbr)}</DetailLine>
                  <DetailLine label={t('wiz.race.speed')}>{selectedDbSubrace?.speedOverride || selectedRaceDetail.speed || 30} {t('wiz.race.ft')}</DetailLine>
                  <DetailLine label={t('wiz.race.traits')}>{(selectedDbSubrace?.traits?.length ? selectedDbSubrace.traits : selectedRaceDetail.traits || []).join(' \u00b7 ') || '\u2014'}</DetailLine>
                  {!!selectedRaceDetail.subraces?.length && (
                    <div className={css.mt14}>
                      <label className="ao-label">{t('wiz.race.subrace')} <span className="wiz-req">{t('wiz.basics.required')}</span></label>
                      <select
                        className={cn('ao-input', css.inkInput)}
                        value={c.subraceKey || ''}
                        onChange={(e) => pickSubrace(e.target.value)}
                      >
                        <option value="">{t('wiz.race.chooseSubrace')}</option>
                        {selectedRaceDetail.subraces.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} ({dbAsiText(s.abilityScoreIncreases, gt.abilityAbbr)})</option>
                        ))}
                      </select>
                      {selectedDbSubrace && (
                        <div className={cn('ao-italic', css.sub13)}>
                          {selectedDbSubrace.description}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : selectedRace ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>
                    {t('wiz.race.dbLoaded')}
                  </div>
                  <DetailLine label={t('wiz.race.source')}>{selectedRace.entry.homebrewTitle || selectedRace.entry.source}</DetailLine>
                  <DetailLine label={t('wiz.race.abilityBonus')}>{t('wiz.race.definedByContent')}</DetailLine>
                  <DetailLine label={t('wiz.race.speed')}>{c.speed || 30} {t('wiz.race.ft')}</DetailLine>
                </>
              ) : (
                <div className="ao-codex">{t('wiz.race.pickCard')}</div>
              )}
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.race.portrait')} sub={t('wiz.race.portraitSub')} glyph="eye" />
            <div className={css.pad16}>
              <div className="wiz-avatar-row">
                <div className="wiz-avatar-preview">
                  {c.avatar
                    ? <img src={c.avatar} alt={t('wiz.race.portraitAlt')} />
                    : <span className={cn('ao-codex', css.fs10)}>{t('wiz.race.noPortrait')}</span>}
                </div>
                <div className="ao-grow">
                  <label className={cn('ao-btn ao-btn--block', css.uploadBtn)}>
                    <Rune kind="arrow-up" size={11} /> {t('wiz.race.uploadImage')}
                    <input type="file" accept="image/*" onChange={onFile} className={css.hidden} />
                  </label>
                  {c.avatar && (
                    <button className="ao-btn ao-btn--ghost ao-btn--block" onClick={() => A.setAvatar(null)}>{t('wiz.race.clear')}</button>
                  )}
                </div>
              </div>
              <div className={cn('ao-overline', css.galleryLabel)}>{t('wiz.race.gallery')}</div>
              <div className="wiz-gallery">
                {PORTRAIT_GALLERY.map((g, i) => {
                  const src = makePortrait(g.hue, g.glyph);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={'wiz-gallery-item' + (c.avatar === src ? ' is-active' : '')}
                      onClick={() => A.setAvatar(src)}
                      style={{ backgroundImage: 'url("' + src + '")' }}
                    />
                  );
                })}
              </div>
            </div>
          </OrdoPanel>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3 — CLASS
// ════════════════════════════════════════════════════════════
export function StepClass({ c, A, n, total, availability }: StepProps) {
  const t = useT();
  const gt = useGameTerms();
  const selectedClass = availability.classOptions.find((cl) => cl.key === c.classKey);
  const selectedClassDetail = selectedClass?.detail;
  const prof = profByLevel(c.level);
  const StatName = ({ id }: { id?: string }) => {
    const stat = availability.statTypes.find((item) => item.id === id);
    return <>{stat ? gt.ability(stat.name) : '\u2014'}</>;
  };
  const d = selectedClassDetail;
  const resolveAbilityName = (label: ContentLabel): string =>
    availability.statTypes.find((stat) => stat.id === label.id)?.name ?? label.name;
  const primaryAbilitiesText = d?.primaryAbilities?.length
    ? d.primaryAbilities.map((label) => gt.ability(resolveAbilityName(label))).join(' \u00b7 ')
    : undefined;
  const savesText = d?.savingThrows?.length
    ? d.savingThrows.map((label) => gt.abilityAbbr(shortStatName(resolveAbilityName(label)))).join(' \u00b7 ')
    : undefined;
  const armorText = d?.armorProficiencyText?.trim();
  const weaponText = d?.weaponProficiencyText?.trim();
  const toolText = d?.toolProficiencyText?.trim();
  const combinedProf = d?.armorWeaponProficiencies?.trim();
  const hasSeparateProf = !!(armorText || weaponText || toolText);
  const skillChoiceCount = d?.skillChoiceCount ?? 0;
  const skillChoiceText = d?.skillChoiceAny
    ? t('wiz.class.skillAny')
    : d?.skillOptions?.length
      ? d.skillOptions.map((label) => label.name).join(', ')
      : undefined;
  const spellcastingAbilityText = d?.spellcasting?.spellcastingAbility
    ? gt.ability(resolveAbilityName(d.spellcasting.spellcastingAbility))
    : d?.spellcasting?.spellcastingStatName
      ? gt.ability(d.spellcasting.spellcastingStatName)
      : undefined;
  // Level-1 content-shaped reward groups (new grants/options payload).
  const contentRewardGroups = initialContentRewardGroupsOf(d?.rewardGroups).filter(isContentRewardGroup);
  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.class.title')} sub={t('wiz.class.sub')} />
      <div className="wiz-split">
        <div>
          <div className="wiz-grid">
            {availability.classOptions.map((option) => {
              const detail = option.detail;
              const source = option.entry.homebrewTitle || option.entry.source;
              const primaryStat = availability.statTypes.find((stat) => stat.id === detail?.primaryAbilityStatId);
              const isSpellcaster = detail?.spellcasting?.isSpellcaster;
              return (
                <WizCard
                  key={option.key}
                  active={c.classKey === option.key}
                  onClick={() => A.setClass(option.key, option.entry.name, {
                    hitDie: detail?.hitDie,
                    isSpellcaster,
                    hasCantrips: detail?.spellcasting?.hasCantrips,
                    isHalfCaster: detail?.spellcasting?.isHalfCaster,
                    slug: detail?.slug,
                    classDesc: detail?.description,
                    saves: detail?.savingThrowStatNames?.map(abilityKeyForStatName).filter((key): key is AbilityKey => !!key),
                    proficiencies: detail?.armorWeaponProficiencies ? 'Weapons & armour: ' + detail.armorWeaponProficiencies : undefined,
                  })}
                  glyph={glyphForClass(detail?.slug, option.entry.name)}
                  icon="class"
                  title={option.entry.name}
                  sub={(detail
                    ? 'd' + (detail.hitDie || 8) + ' \u00b7 ' + (primaryStat ? gt.abilityAbbr(shortStatName(primaryStat.name)) : 'DB') + (isSpellcaster ? ' \u00b7 ' + t('wiz.class.caster') : '')
                    : 'd8') + ' \u00b7 ' + source}
                />
              );
            })}
            {!availability.classOptions.length && (
              <div className="ao-codex">{t('wiz.class.noClasses')}</div>
            )}
          </div>
        </div>
        <div className="wiz-side">
          <OrdoPanel frame padding={0}>
            <PanelHeader title={selectedClassDetail?.name || selectedClass?.entry.name || t('wiz.class.selectClass')} icon="class" />
            <div className={css.pad16}>
              {selectedClassDetail ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>{selectedClassDetail.description}</div>
                  <DetailLine label={t('wiz.class.source')}>{selectedClass?.entry.homebrewTitle || selectedClass?.entry.source}</DetailLine>
                  <DetailLine label={t('wiz.class.hitDie')}>d{selectedClassDetail.hitDie || 8}</DetailLine>
                  <DetailLine label={t('wiz.class.primary')}>{primaryAbilitiesText ?? <StatName id={selectedClassDetail.primaryAbilityStatId} />}</DetailLine>
                  <DetailLine label={t('wiz.class.saves')}>{savesText ?? '\u2014'}</DetailLine>
                  {hasSeparateProf ? (
                    <>
                      {armorText && <DetailLine label={t('wiz.class.armor')}>{armorText}</DetailLine>}
                      {weaponText && <DetailLine label={t('wiz.class.weapons')}>{weaponText}</DetailLine>}
                      {toolText && <DetailLine label={t('wiz.class.tools')}>{toolText}</DetailLine>}
                    </>
                  ) : (
                    <DetailLine label={t('wiz.class.proficiencies')}>{combinedProf || '\u2014'}</DetailLine>
                  )}
                  {skillChoiceCount > 0 && (
                    <DetailLine label={t('wiz.class.skillChoice')}>
                      {skillChoiceText
                        ? t('wiz.class.skillChoiceRule', { count: skillChoiceCount, options: skillChoiceText })
                        : t('wiz.class.skillChoiceN', { count: skillChoiceCount })}
                    </DetailLine>
                  )}
                  {selectedClassDetail.spellcasting?.isSpellcaster && (
                    <div className={css.mt10}>
                      <OrdoChip tone="arcane" glyph="sigil-1">
                        {t('wiz.class.spellcaster')}{spellcastingAbilityText ? ' \u00b7 ' + spellcastingAbilityText : ''}{selectedClassDetail.spellcasting.isHalfCaster ? ' \u00b7 ' + t('wiz.class.half') : ''}{!selectedClassDetail.spellcasting.hasCantrips ? ' \u00b7 ' + t('wiz.class.noCantrips') : ''}
                      </OrdoChip>
                    </div>
                  )}
                  <OrdoDivider glyph="diamond-fill" />
                  <div className="wiz-level">
                    <div>
                      <label className={cn('ao-label', css.label0)}>{t('wiz.class.targetLevel')}</label>
                      <div className={cn('ao-codex', css.fs10)}>{t('wiz.class.profBonus', { prof: fmtMod(prof) })}</div>
                    </div>
                    <div className="wiz-level-ctrl">
                      <button className="ao-iconbtn" onClick={() => A.setLevel(clamp(c.level - 1, 1, 20))}>
                        <Rune kind="minus" size={12} />
                      </button>
                      <input
                        className={cn('ao-input', css.lvlInput)}
                        type="number"
                        min={1}
                        max={20}
                        value={c.level}
                        onChange={(e) => A.setLevel(clamp(Number(e.target.value || 1), 1, 20))}
                      />
                      <button className="ao-iconbtn" onClick={() => A.setLevel(clamp(c.level + 1, 1, 20))}>
                        <Rune kind="plus" size={12} />
                      </button>
                    </div>
                  </div>
                  {c.level > 1 && (
                    <div className={css.targetLevelNote}>
                      {t('wiz.class.targetLevelNote', { level: c.level })}
                    </div>
                  )}
                </>
              ) : selectedClass ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>
                    {t('wiz.class.dbLoaded')}
                  </div>
                  <DetailLine label={t('wiz.class.source')}>{selectedClass.entry.homebrewTitle || selectedClass.entry.source}</DetailLine>
                  <DetailLine label={t('wiz.class.hitDie')}>{c.hitDiceType || 'd8'}</DetailLine>
                  <OrdoDivider glyph="diamond-fill" />
                  <div className="wiz-level">
                    <div>
                      <label className={cn('ao-label', css.label0)}>{t('wiz.class.targetLevel')}</label>
                      <div className={cn('ao-codex', css.fs10)}>{t('wiz.class.profBonus', { prof: fmtMod(prof) })}</div>
                    </div>
                    <div className="wiz-level-ctrl">
                      <button className="ao-iconbtn" onClick={() => A.setLevel(clamp(c.level - 1, 1, 20))}>
                        <Rune kind="minus" size={12} />
                      </button>
                      <input
                        className={cn('ao-input', css.lvlInput)}
                        type="number"
                        min={1}
                        max={20}
                        value={c.level}
                        onChange={(e) => A.setLevel(clamp(Number(e.target.value || 1), 1, 20))}
                      />
                      <button className="ao-iconbtn" onClick={() => A.setLevel(clamp(c.level + 1, 1, 20))}>
                        <Rune kind="plus" size={12} />
                      </button>
                    </div>
                  </div>
                  {c.level > 1 && (
                    <div className={css.targetLevelNote}>
                      {t('wiz.class.targetLevelNote', { level: c.level })}
                    </div>
                  )}
                </>
              ) : (
                <div className="ao-codex">{t('wiz.class.pickCard')}</div>
              )}
            </div>
          </OrdoPanel>
        </div>
      </div>
      {contentRewardGroups.length > 0 && (
        <div className={css.contentRewards}>
          {contentRewardGroups.map((g) => {
            const key = rewardGroupKey(g);
            return (
              <RewardGroupPicker
                key={key}
                group={g}
                optionIds={c.contentRewardSelections[key] ?? []}
                onOptionsChange={(ids) =>
                  A.patch({ contentRewardSelections: { ...c.contentRewardSelections, [key]: ids } })
                }
                child={c.contentRewardChildSelections}
                onChildChange={(grantId, sel) =>
                  A.patch({
                    contentRewardChildSelections: {
                      ...c.contentRewardChildSelections,
                      [grantId]: sel,
                    },
                  })
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 4 — ABILITY SCORES
// ════════════════════════════════════════════════════════════
function poolCount(arr: number[], v: number): number {
  return (arr || []).filter((x) => x === v).length;
}
function assignOptions(method: ScoreMethod, pool: number[]): number[] {
  if (method === 'standard') return STANDARD_ARRAY;
  if (method === 'roll') return (pool || []).slice().sort((a, b) => b - a);
  return [];
}
function isOptDisabled(v: number, current: number, base: Record<AbilityKey, number>, method: ScoreMethod, pool: number[]): boolean {
  if (v === current) return false;
  const assigned = ABILITIES.map((a) => base[a.key]);
  if (method === 'standard') {
    return assigned.filter((x) => x === v).length >= STANDARD_ARRAY.filter((x) => x === v).length;
  }
  if (method === 'roll') {
    return assigned.filter((x) => x === v).length >= poolCount(pool, v);
  }
  return false;
}

export function StepAbilities({ c, A, n, total }: StepProps) {
  const t = useT();
  const gt = useGameTerms();
  const asi = c.racialAsi || {};
  const base = c.baseScores;
  const spent = pointBuySpent(base);
  const remaining = POINT_BUY_BUDGET - spent;
  const poolUsed = ABILITIES.map((a) => base[a.key]);

  const Method = ({ id, label, sub }: { id: ScoreMethod; label: string; sub: string }) => (
    <button
      type="button"
      className={'wiz-method' + (c.scoreMethod === id ? ' is-active' : '')}
      onClick={() => A.setMethod(id)}
    >
      <span className={cn('ao-engraved', css.eng12)}>{label}</span>
      <span className={cn('ao-codex', css.fs10)}>{sub}</span>
    </button>
  );

  return (
    <div className="wiz-narrow-wide">
      <StepHead n={n} total={total} title={t('wiz.abil.title')} sub={t('wiz.abil.sub')} />

      <div className="wiz-methods">
        <Method id="standard" label={t('wiz.abil.standardArray')} sub="15·14·13·12·10·8" />
        <Method id="pointbuy" label={t('wiz.abil.pointBuy')} sub={t('wiz.abil.pointBuySub')} />
        <Method id="roll" label={t('wiz.abil.roll4d6')} sub={t('wiz.abil.dropLowest')} />
      </div>

      {c.scoreMethod === 'pointbuy' && (
        <div className={'wiz-budget' + (remaining < 0 ? ' is-over' : '')}>
          <Rune kind="coin" size={14} color={remaining < 0 ? 'var(--ember)' : 'var(--gold)'} />
          <span className={cn('ao-engraved', css.eng12)}>{t('wiz.abil.pointsRemaining')}</span>
          <span className="wiz-budget-num">{remaining}</span>
          <span className="ao-codex">{t('wiz.abil.spentBudget', { spent, budget: POINT_BUY_BUDGET })}</span>
        </div>
      )}
      {c.scoreMethod === 'roll' && (
        <div className="wiz-roll-bar">
          <button className="ao-btn ao-btn--primary" onClick={A.rollPool}>
            <Rune kind="hex" size={11} /> {c.rolledPool && c.rolledPool.length ? t('wiz.abil.reroll') : t('wiz.abil.roll4d6x6')}
          </button>
          <div className="wiz-pool">
            {(c.rolledPool || []).map((v, i) => (
              <span
                key={i}
                className={'wiz-pool-die' + (poolUsed.includes(v) && poolCount(poolUsed, v) >= poolCount(c.rolledPool, v) ? ' is-used' : '')}
              >
                {v}
              </span>
            ))}
            {(!c.rolledPool || !c.rolledPool.length) && (
              <span className="ao-codex">{t('wiz.abil.rollToGenerate')}</span>
            )}
          </div>
        </div>
      )}

      <OrdoPanel frame padding={0}>
        <div className="wiz-abil-head">
          <span className="ao-overline">{t('wiz.abil.colAbility')}</span>
          <span className={cn('ao-overline', css.taCenter)}>{t('wiz.abil.colBase')}</span>
          <span className={cn('ao-overline', css.taCenter)}>{t('wiz.abil.colRacial')}</span>
          <span className={cn('ao-overline', css.taCenter)}>{t('wiz.abil.colTotal')}</span>
          <span className={cn('ao-overline', css.taCenter)}>{t('wiz.abil.colMod')}</span>
        </div>
        {ABILITIES.map((a) => {
          const b = base[a.key] || 0;
          const bonus = asi[a.key] || 0;
          const tot = b + bonus;
          return (
            <div className="wiz-abil-row" key={a.key}>
              <div className="wiz-abil-name">
                <span className={cn('ao-engraved', css.eng13)}>{gt.abilityAbbr(a.abbr)}</span>
                <span className={cn('ao-codex', css.fs10)}>{gt.ability(a.label)}</span>
              </div>
              <div className="wiz-abil-ctrl">
                {c.scoreMethod === 'pointbuy' ? (
                  <div className="wiz-stepper">
                    <button className="ao-iconbtn" disabled={b <= 8} onClick={() => A.setBaseScore(a.key, b - 1)}>
                      <Rune kind="minus" size={11} />
                    </button>
                    <span className="wiz-stepper-num">{b}</span>
                    <button
                      className="ao-iconbtn"
                      disabled={b >= 15 || remaining - ((POINT_BUY_COST[b + 1] ?? 99) - (POINT_BUY_COST[b] ?? 0)) < 0}
                      onClick={() => A.setBaseScore(a.key, b + 1)}
                    >
                      <Rune kind="plus" size={11} />
                    </button>
                  </div>
                ) : (
                  <select
                    className="ao-input wiz-abil-select"
                    value={b || ''}
                    onChange={(e) => A.setBaseScore(a.key, Number(e.target.value) || 0)}
                  >
                    <option value="">—</option>
                    {assignOptions(c.scoreMethod, c.rolledPool).map((v, i) => {
                      const disabled = isOptDisabled(v, b, base, c.scoreMethod, c.rolledPool);
                      return <option key={i} value={v} disabled={disabled}>{v}</option>;
                    })}
                  </select>
                )}
              </div>
              <div className={cn('wiz-abil-cell', bonus ? css.goldPale : css.inkFaint)}>{bonus ? '+' + bonus : '\u2014'}</div>
              <div className="wiz-abil-cell wiz-abil-total">{tot || '\u2014'}</div>
              <div className="wiz-abil-cell wiz-abil-mod">{tot ? fmtMod(abilityMod(tot)) : '\u2014'}</div>
            </div>
          );
        })}
      </OrdoPanel>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 5 — BACKGROUND & SKILLS
// ════════════════════════════════════════════════════════════
export function StepBackground({ c, A, n, total, availability }: StepProps) {
  const t = useT();
  const gt = useGameTerms();
  const selectedClass = availability.classOptions.find((option) => option.key === c.classKey);
  const dbBackground = availability.backgrounds.find((b) => c.backgroundKey === `db-background:${b.id}`);
  const backgroundOptions = availability.backgrounds.map((entry) => ({
    key: `db-background:${entry.id}`,
    entry,
  }));
  // Final contract: skill choice driven by `skillOptions` (ContentLabel[]) and
  // `skillChoiceAny` (any skill allowed). Falls back to all proficiency skills
  // when the class has no explicit skill options.
  const detail = selectedClass?.detail;
  const skillChoiceAny = detail?.skillChoiceAny ?? false;
  const allSkillOptions: { id: string; name: string }[] = availability.proficiencySkills.length
    ? availability.proficiencySkills.map((skill) => ({ id: skill.id, name: skill.name }))
    : SKILLS.map((skill) => ({ id: skill.key, name: skill.label }));
  const classSkillOptions: { id: string; name: string }[] = skillChoiceAny
    ? allSkillOptions
    : detail?.skillOptions?.length
      ? detail.skillOptions.map((label) => ({ id: label.id, name: label.name }))
      : allSkillOptions;
  const classSkillKeys = classSkillOptions.map((skill) => skillKeyForLabel(skill.name) || skill.id);
  const chosen = c.classSkills || [];
  const limit = detail?.skillChoiceCount ?? 0;
  const bgSkills = (dbBackground?.skillProficiencyNames || []).map((name) => skillKeyForLabel(name) || name);

  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.bg.title')} sub={t('wiz.bg.sub')} />
      <div className="wiz-split">
        <div>
          <div className={cn('ao-overline', css.mb10)}>{t('wiz.bg.background')}</div>
          <div className="wiz-grid wiz-grid--bg">
            {backgroundOptions.map((option) => {
              const grantedSkillKeys = (option.entry.skillProficiencyNames || []).map((name) => skillKeyForLabel(name) || name);
              return (
                <WizCard
                  key={option.key}
                  active={c.backgroundKey === option.key}
                  onClick={() => A.setBackground(option.key, option.entry.name, grantedSkillKeys, {
                    desc: option.entry.description,
                    extra: option.entry.grantedExtras,
                  })}
                  glyph="scroll"
                  icon="source-book"
                  title={option.entry.name || t('wiz.bg.backgroundFallback')}
                  sub={(option.entry.skillProficiencyNames || []).map((nm) => gt.skill(nm)).join(' \u00b7 ')}
                />
              );
            })}
            {!backgroundOptions.length && (
              <div className="ao-codex">{t('wiz.bg.chooseBackground')}</div>
            )}
          </div>
        </div>
        <div className="wiz-side">
          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.bg.grants')} icon="grant-feature" />
            <div className={css.pad16}>
              {dbBackground ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>{dbBackground.description}</div>
                  <DetailLine label={t('wiz.bg.skillProficiencies')}>
                    {(dbBackground.skillProficiencyNames || []).map((nm) => gt.skill(nm)).join(' \u00b7 ')}
                  </DetailLine>
                  <DetailLine label={t('wiz.bg.alsoGrants')}>{dbBackground.grantedExtras || '\u2014'}</DetailLine>
                </>
              ) : (
                <div className="ao-codex">{t('wiz.bg.chooseBackground')}</div>
              )}
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('wiz.bg.classSkills')}
              sub={selectedClass ? t('wiz.bg.chooseFrom', { limit, class: selectedClass.entry.name }) : t('wiz.bg.selectClassFirst')}
              icon="skill"
              right={<span className={cn('ao-codex', chosen.length === limit ? css.goldPale : css.inkQuiet)}>{chosen.length} / {limit}</span>}
            />
            <div className={css.pad12}>
              {!selectedClass ? (
                <div className={cn('ao-codex', css.pad8)}>{t('wiz.bg.noClassChosen')}</div>
              ) : (
                <div className="wiz-skill-grid">
                  {classSkillKeys.map((sk) => {
                    const granted = bgSkills.includes(sk);
                    const on = chosen.includes(sk) || granted;
                    const atLimit = chosen.length >= limit && !chosen.includes(sk);
                    const label = gt.skill(SKILLS.find((x) => x.key === sk)?.label || classSkillOptions.find((skill) => skill.id === sk)?.name || sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        className={'wiz-skill' + (on ? ' is-on' : '') + (granted ? ' is-granted' : '')}
                        disabled={granted || (atLimit && !on)}
                        onClick={() => A.toggleClassSkill(sk)}
                      >
                        <span className={cn(css.pip12, on && css.pipOn)} />
                        <span className={css.skillName}>{label}</span>
                        {granted && <span className={cn('ao-codex', css.fs9)}>{t('wiz.bg.bgTag')}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </OrdoPanel>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 6 — SPELLS (spellcasters only)
// ════════════════════════════════════════════════════════════
export function StepSpells({ c, A, n, total, availability }: StepProps) {
  const t = useT();
  // Character is created at level 1 (c.level is the *target* level), so the spell
  // loadout is sized for level 1 — see CREATION_LEVEL in wizardState.
  const limits = spellLimits(
    { isSpellcaster: c.isSpellcaster, hasCantrips: c.hasCantrips, isHalfCaster: c.isHalfCaster, kind: c.classSlug },
    CREATION_LEVEL,
  );
  const classId = availability.classIdByKey[c.classKey];
  // Cap by the highest spell level a level-1 character can know (mirrors the
  // backend validation) so over-level spells are neither shown nor selectable.
  const maxLvl = maxSpellLevel(!!c.isHalfCaster, CREATION_LEVEL);
  const list = useMemo(
    () => availability.spells.filter(
      (sp) => (!classId || (sp.availableToClassIds?.includes(classId) ?? false)) && (sp.level ?? 0) <= maxLvl,
    ),
    [availability.spells, classId, maxLvl],
  );
  const schools = useMemo(
    () => Array.from(new Set(list.map((s) => s.school).filter((x): x is string => !!x))).sort(),
    [list],
  );
  const [q, setQ] = useState('');
  const [lvlFilter, setLvlFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  const cantripsChosen = c.spells.cantrips || [];
  const knownChosen = c.spells.known || [];

  // Selections are stored by English name so the Forge submit can resolve ids.
  const spellKey = (s: SpellReferenceResponse): string => s.nameEn ?? s.name;

  const filtered = list.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (schoolFilter !== 'all' && s.school !== schoolFilter) return false;
    if (lvlFilter === 'cantrip' && s.level !== 0) return false;
    if (lvlFilter !== 'all' && lvlFilter !== 'cantrip' && s.level !== Number(lvlFilter)) return false;
    return true;
  });
  const cantrips = filtered.filter((s) => s.level === 0);
  const leveled = filtered.filter((s) => s.level > 0);

  const SpellRow = ({ s }: { s: SpellReferenceResponse }) => {
    const isCantrip = s.level === 0;
    const chosenArr = isCantrip ? cantripsChosen : knownChosen;
    const lim = isCantrip ? limits.cantrips : limits.spells;
    const key = spellKey(s);
    const on = chosenArr.includes(key);
    const atLimit = chosenArr.length >= lim && !on;
    return (
      <div className={'wiz-spell' + (on ? ' is-on' : '')}>
        <button
          type="button"
          className="wiz-spell-pick"
          disabled={atLimit}
          onClick={() => A.toggleSpell(isCantrip ? 'cantrips' : 'known', key)}
        >
          <span className={cn(css.pip13, on && css.pipOn)} />
        </button>
        <button type="button" className="wiz-spell-body" onClick={() => setOpen(open === s.id ? null : s.id)}>
          <span className="wiz-spell-icon" aria-hidden="true">
            <OrdoAssetIcon
              names={[s.nameEn, s.name]}
              source="spells"
              fallback={<OrdoInterfaceIcon icon={spellLevelIcon(s.level)} size={14} style={{ color: 'var(--arcane)' }} />}
            />
          </span>
          <div className="wiz-spell-main">
            <span className="wiz-spell-name">{s.name}</span>
            <span className={cn('ao-codex', css.fs10)}>{isCantrip ? t('wiz.spells.cantrip') : t('wiz.spells.lvl', { level: s.level })}{s.school ? ' · ' + s.school : ''}</span>
          </div>
          <Rune kind={open === s.id ? 'chev-d' : 'chev-r'} size={12} color="var(--ink-faint)" />
        </button>
        {open === s.id && <div className="wiz-spell-desc ao-italic">{s.description}</div>}
      </div>
    );
  };

  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.spells.title')} sub={t('wiz.spells.sub', { class: c.cls || t('wiz.spells.caster') })} />

      <div className="wiz-spell-toolbar">
        <div className="wiz-search">
          <Rune kind="search" size={13} color="var(--ink-faint)" />
          <input className="wiz-search-in" value={q} placeholder={t('wiz.spells.searchPh')} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="ao-input wiz-filter" value={lvlFilter} onChange={(e) => setLvlFilter(e.target.value)}>
          <option value="all">{t('wiz.spells.allLevels')}</option>
          <option value="cantrip">{t('wiz.spells.cantrips')}</option>
          {Array.from({ length: maxLvl }, (_, i) => i + 1).map((lv) => (
            <option key={lv} value={String(lv)}>{t('wiz.spells.lvl', { level: lv })}</option>
          ))}
        </select>
        <select className="ao-input wiz-filter" value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="all">{t('wiz.spells.allSchools')}</option>
          {schools.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="wiz-spell-cols">
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('wiz.spells.cantrips')}
            icon="spell-cantrip"
            tone="arcane"
            right={<span className={cn('ao-codex', cantripsChosen.length === limits.cantrips ? css.goldPale : css.inkQuiet)}>{cantripsChosen.length} / {limits.cantrips}</span>}
          />
          <div className="wiz-spell-list ao-scroll">
            {limits.cantrips === 0
              ? <div className={cn('ao-codex', css.pad14)}>{t('wiz.spells.noCantrips')}</div>
              : cantrips.length
                ? cantrips.map((s) => <SpellRow key={s.id} s={s} />)
                : <div className={cn('ao-codex', css.pad14)}>{t('wiz.spells.noCantripsMatch')}</div>}
          </div>
        </OrdoPanel>
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('wiz.spells.spells')}
            icon="spellbook"
            tone="arcane"
            right={<span className={cn('ao-codex', knownChosen.length === limits.spells ? css.goldPale : css.inkQuiet)}>{knownChosen.length} / {limits.spells}</span>}
          />
          <div className="wiz-spell-list ao-scroll">
            {leveled.length
              ? leveled.map((s) => <SpellRow key={s.id} s={s} />)
              : <div className={cn('ao-codex', css.pad14)}>{t('wiz.spells.noSpellsMatch')}</div>}
          </div>
        </OrdoPanel>
      </div>
    </div>
  );
}
