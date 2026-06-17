import { useMemo, useState } from 'react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoChip,
} from '@/components/ordo';
import {
  ABILITIES,
  BACKGROUNDS,
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  SCHOOLS,
  SKILLS,
  STANDARD_ARRAY,
  abilityMod,
  classByKey,
  clamp,
  combinedASI,
  fmtMod,
  pointBuySpent,
  profByLevel,
  raceByKey,
  spellLimits,
  spellsForClass,
  type AbilityKey,
  type Spell,
} from '@/data/wizard5e';
import { ALIGNMENTS } from '@/data/wizard5e';
import { useT } from '@/i18n/I18nContext';
import { useGameTerms } from '@/i18n/gameTerms';
import { cn } from '@/lib/utils';
import css from './steps.module.css';
import type { WizardActions, WizardChar, ScoreMethod } from './wizardState';
import type { ContentLabel } from '@/types';
import { isContentRewardGroup, rewardGroupKey } from '@/lib/contentAdapters';
import { RewardGroupView } from '@/components/content-rewards/RewardGroupRenderer';
import {
  DetailLine,
  StepHead,
  WizCard,
  type WizardAvailability,
} from './parts';
import {
  CLASS_GLYPH,
  PORTRAIT_GALLERY,
  asiText,
  makePortrait,
} from './parts.helpers';

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
  const race = raceByKey(c.raceKey);
  const selectedRace = availability.raceOptions.find((r) => r.key === c.raceKey);
  const selectedRaceDetail = selectedRace?.detail;
  const selectedDbSubrace = selectedRaceDetail?.subraces?.find((s) => s.id === c.subraceKey);
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
              const r = option.local;
              const detail = option.detail;
              const source = option.entry.homebrewTitle || option.entry.source;
              return (
                <WizCard
                  key={option.key}
                  active={c.raceKey === option.key}
                  onClick={() => A.setRace(option.key, option.entry.name)}
                  glyph="hex"
                  title={option.entry.name}
                  sub={(detail ? dbAsiText(detail.abilityScoreIncreases, gt.abilityAbbr) + ' \u00b7 ' + (detail.speed ?? 30) + ' ' + t('wiz.race.ft') : r ? asiText(r.asi, gt.abilityAbbr) + ' \u00b7 ' + r.speed + ' ' + t('wiz.race.ft') : '30 ' + t('wiz.race.ft')) + ' \u00b7 ' + source}
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
            <PanelHeader title={selectedRaceDetail?.name || race?.label || selectedRace?.entry.name || t('wiz.race.selectRace')} glyph="hex" />
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
                        onChange={(e) => A.setSubrace(e.target.value)}
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
              ) : race ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>{race.desc}</div>
                  <DetailLine label={t('wiz.race.abilityBonus')}>{asiText(combinedASI(race, c.subraceKey), gt.abilityAbbr)}</DetailLine>
                  <DetailLine label={t('wiz.race.speed')}>{(race.subraces.find((s) => s.key === c.subraceKey) || {}).speed || race.speed} {t('wiz.race.ft')}</DetailLine>
                  <DetailLine label={t('wiz.race.traits')}>{race.traits.join(' \u00b7 ')}</DetailLine>
                  {race.subraces.length > 0 && (
                    <div className={css.mt14}>
                      <label className="ao-label">{t('wiz.race.subrace')} <span className="wiz-req">{t('wiz.basics.required')}</span></label>
                      <select
                        className={cn('ao-input', css.inkInput)}
                        value={c.subraceKey || ''}
                        onChange={(e) => A.setSubrace(e.target.value)}
                      >
                        <option value="">{t('wiz.race.chooseSubrace')}</option>
                        {race.subraces.map((s) => (
                          <option key={s.key} value={s.key}>{s.label} ({asiText(s.asi, gt.abilityAbbr)})</option>
                        ))}
                      </select>
                      {c.subraceKey && (
                        <div className={cn('ao-italic', css.sub13)}>
                          {race.subraces.find((s) => s.key === c.subraceKey)?.desc}
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
  const cls = classByKey(c.classKey);
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
  // Level-1 content-shaped reward groups (new grants/options payload). Selections are
  // prepared in wizard state but not yet submitted — ContentLevelUpRequest wiring is
  // deferred until the backend accepts it (rollout step 7).
  const contentRewardGroups = (d?.rewardGroups ?? []).filter(isContentRewardGroup);
  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.class.title')} sub={t('wiz.class.sub')} />
      <div className="wiz-split">
        <div>
          <div className="wiz-grid">
            {availability.classOptions.map((option) => {
              const cl = option.local;
              const detail = option.detail;
              const source = option.entry.homebrewTitle || option.entry.source;
              const primaryStat = availability.statTypes.find((stat) => stat.id === detail?.primaryAbilityStatId);
              const isSpellcaster = detail?.spellcasting?.isSpellcaster ?? cl?.spellcaster;
              return (
                <WizCard
                  key={option.key}
                  active={c.classKey === option.key}
                  onClick={() => A.setClass(option.key, option.entry.name, {
                    hitDie: detail?.hitDie,
                    isSpellcaster,
                    saves: detail?.savingThrowStatNames?.map(abilityKeyForStatName).filter((key): key is AbilityKey => !!key),
                    proficiencies: detail?.armorWeaponProficiencies ? 'Weapons & armour: ' + detail.armorWeaponProficiencies : undefined,
                  })}
                  glyph={cl ? CLASS_GLYPH[cl.key] : 'book'}
                  title={option.entry.name}
                  sub={(detail
                    ? 'd' + (detail.hitDie || 8) + ' \u00b7 ' + (primaryStat ? gt.abilityAbbr(shortStatName(primaryStat.name)) : 'DB') + (isSpellcaster ? ' \u00b7 ' + t('wiz.class.caster') : '')
                    : cl ? 'd' + cl.hitDie + ' \u00b7 ' + gt.abilityAbbr(cl.primary) + (cl.spellcaster ? ' \u00b7 ' + t('wiz.class.caster') : '') : 'd8') + ' \u00b7 ' + source}
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
            <PanelHeader title={selectedClassDetail?.name || cls?.label || selectedClass?.entry.name || t('wiz.class.selectClass')} glyph={cls ? CLASS_GLYPH[cls.key] : 'sword'} />
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
                      <label className={cn('ao-label', css.label0)}>{t('wiz.class.level')}</label>
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
                </>
              ) : cls ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>{cls.desc}</div>
                  <DetailLine label={t('wiz.class.hitDie')}>d{cls.hitDie}</DetailLine>
                  <DetailLine label={t('wiz.class.primary')}>{gt.ability(ABILITIES.find((a) => a.key === cls.primary)?.label)}</DetailLine>
                  <DetailLine label={t('wiz.class.saves')}>{cls.saves.map((s) => gt.abilityAbbr(ABILITIES.find((a) => a.key === s)?.abbr)).join(' \u00b7 ')}</DetailLine>
                  <DetailLine label={t('wiz.class.proficiencies')}>{cls.profs}</DetailLine>
                  {cls.spellcaster && (
                    <div className={css.mt10}>
                      <OrdoChip tone="arcane" glyph="sigil-1">
                        {t('wiz.class.spellcaster')}{cls.halfCaster ? ' \u00b7 ' + t('wiz.class.half') : ''}{!cls.cantrips ? ' \u00b7 ' + t('wiz.class.noCantrips') : ''}
                      </OrdoChip>
                    </div>
                  )}
                  <OrdoDivider glyph="diamond-fill" />
                  <div className="wiz-level">
                    <div>
                      <label className={cn('ao-label', css.label0)}>{t('wiz.class.level')}</label>
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
                      <label className={cn('ao-label', css.label0)}>{t('wiz.class.level')}</label>
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
              <RewardGroupView
                key={key}
                group={g}
                selectedOptionIds={c.contentRewardSelections[key] ?? []}
                onChange={(ids) =>
                  A.patch({ contentRewardSelections: { ...c.contentRewardSelections, [key]: ids } })
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
  const race = raceByKey(c.raceKey);
  const asi = combinedASI(race, c.subraceKey);
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
  const cls = classByKey(c.classKey) || selectedClass?.local;
  const bg = BACKGROUNDS.find((b) => b.key === c.backgroundKey);
  const dbBackground = availability.backgrounds.find((b) => c.backgroundKey === `db-background:${b.id}` || norm(b.name) === norm(c.background));
  const backgroundOptions = availability.backgrounds.length
    ? availability.backgrounds.map((entry) => {
      const local = BACKGROUNDS.find((b) => norm(b.label) === norm(entry.name));
      return { key: local?.key ?? `db-background:${entry.id}`, entry, local };
    })
    : BACKGROUNDS.map((local) => ({ key: local.key, entry: null, local }));
  // Final contract: skill choice driven by `skillOptions` (ContentLabel[]) and
  // `skillChoiceAny` (any skill allowed). Falls back to legacy local skills when
  // the class has no content detail at all.
  const detail = selectedClass?.detail;
  const skillChoiceAny = detail?.skillChoiceAny ?? false;
  const allSkillOptions: { id: string; name: string }[] = availability.proficiencySkills.length
    ? availability.proficiencySkills.map((skill) => ({ id: skill.id, name: skill.name }))
    : SKILLS.map((skill) => ({ id: skill.key, name: skill.label }));
  const classSkillOptions: { id: string; name: string }[] = skillChoiceAny
    ? allSkillOptions
    : detail?.skillOptions?.length
      ? detail.skillOptions.map((label) => ({ id: label.id, name: label.name }))
      : cls?.skills.map((key) => {
        const local = SKILLS.find((skill) => skill.key === key);
        const ref = availability.proficiencySkills.find((skill) => norm(skill.name) === norm(local?.label));
        return ref || (local ? { id: key, name: local.label } : null);
      }).filter((skill): skill is { id: string; name: string } => !!skill) || [];
  const classSkillKeys = classSkillOptions.map((skill) => skillKeyForLabel(skill.name) || skill.id);
  const chosen = c.classSkills || [];
  const limit = detail?.skillChoiceCount ?? cls?.skillCount ?? 0;
  const bgSkills = bg ? bg.skills : (dbBackground?.skillProficiencyNames || []).map((name) => skillKeyForLabel(name) || name);

  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.bg.title')} sub={t('wiz.bg.sub')} />
      <div className="wiz-split">
        <div>
          <div className={cn('ao-overline', css.mb10)}>{t('wiz.bg.background')}</div>
          <div className="wiz-grid wiz-grid--bg">
            {backgroundOptions.map((option) => {
              const grantedSkillKeys = option.local
                ? option.local.skills
                : (option.entry?.skillProficiencyNames || []).map((name) => skillKeyForLabel(name) || name);
              return (
                <WizCard
                  key={option.key}
                  active={c.backgroundKey === option.key}
                  onClick={() => A.setBackground(option.key, option.entry?.name || option.local?.label, grantedSkillKeys)}
                  glyph="scroll"
                  title={option.entry?.name || option.local?.label || t('wiz.bg.backgroundFallback')}
                  sub={option.local
                    ? option.local.skills.map((s) => gt.skill(SKILLS.find((x) => x.key === s)?.label)).join(' \u00b7 ')
                    : (option.entry?.skillProficiencyNames || []).map((nm) => gt.skill(nm)).join(' \u00b7 ')}
                />
              );
            })}
          </div>
        </div>
        <div className="wiz-side">
          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.bg.grants')} glyph="scroll" />
            <div className={css.pad16}>
              {bg || dbBackground ? (
                <>
                  <div className={cn('ao-italic', css.desc14)}>{bg?.desc || dbBackground?.description}</div>
                  <DetailLine label={t('wiz.bg.skillProficiencies')}>
                    {bg
                      ? bg.skills.map((s) => gt.skill(SKILLS.find((x) => x.key === s)?.label)).join(' \u00b7 ')
                      : (dbBackground?.skillProficiencyNames || []).map((nm) => gt.skill(nm)).join(' \u00b7 ')}
                  </DetailLine>
                  <DetailLine label={t('wiz.bg.alsoGrants')}>{bg?.extra || dbBackground?.grantedExtras || '\u2014'}</DetailLine>
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
              glyph="diamond-fill"
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
export function StepSpells({ c, A, n, total }: StepProps) {
  const t = useT();
  const cls = classByKey(c.classKey);
  const limits = spellLimits(cls, c.level);
  const list = useMemo(() => spellsForClass(c.classKey), [c.classKey]);
  const [q, setQ] = useState('');
  const [lvlFilter, setLvlFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [open, setOpen] = useState<string | null>(null);

  const cantripsChosen = c.spells.cantrips || [];
  const knownChosen = c.spells.known || [];

  const filtered = list.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (schoolFilter !== 'all' && s.school !== schoolFilter) return false;
    if (lvlFilter === 'cantrip' && s.level !== 0) return false;
    if (lvlFilter !== 'all' && lvlFilter !== 'cantrip' && s.level !== Number(lvlFilter)) return false;
    return true;
  });
  const cantrips = filtered.filter((s) => s.level === 0);
  const leveled = filtered.filter((s) => s.level > 0);

  const SpellRow = ({ s }: { s: Spell }) => {
    const isCantrip = s.level === 0;
    const chosenArr = isCantrip ? cantripsChosen : knownChosen;
    const lim = isCantrip ? limits.cantrips : limits.spells;
    const on = chosenArr.includes(s.name);
    const atLimit = chosenArr.length >= lim && !on;
    return (
      <div className={'wiz-spell' + (on ? ' is-on' : '')}>
        <button
          type="button"
          className="wiz-spell-pick"
          disabled={atLimit}
          onClick={() => A.toggleSpell(isCantrip ? 'cantrips' : 'known', s.name)}
        >
          <span className={cn(css.pip13, on && css.pipOn)} />
        </button>
        <button type="button" className="wiz-spell-body" onClick={() => setOpen(open === s.name ? null : s.name)}>
          <div className="wiz-spell-main">
            <span className="wiz-spell-name">{s.name}</span>
            <span className={cn('ao-codex', css.fs10)}>{isCantrip ? t('wiz.spells.cantrip') : t('wiz.spells.lvl', { level: s.level })} · {s.school}</span>
          </div>
          <Rune kind={open === s.name ? 'chev-d' : 'chev-r'} size={12} color="var(--ink-faint)" />
        </button>
        {open === s.name && <div className="wiz-spell-desc ao-italic">{s.desc}</div>}
      </div>
    );
  };

  return (
    <div>
      <StepHead n={n} total={total} title={t('wiz.spells.title')} sub={t('wiz.spells.sub', { class: cls ? cls.label : t('wiz.spells.caster') })} />

      <div className="wiz-spell-toolbar">
        <div className="wiz-search">
          <Rune kind="search" size={13} color="var(--ink-faint)" />
          <input className="wiz-search-in" value={q} placeholder={t('wiz.spells.searchPh')} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="ao-input wiz-filter" value={lvlFilter} onChange={(e) => setLvlFilter(e.target.value)}>
          <option value="all">{t('wiz.spells.allLevels')}</option>
          <option value="cantrip">{t('wiz.spells.cantrips')}</option>
          <option value="1">{t('wiz.spells.level1')}</option>
          <option value="2">{t('wiz.spells.level2')}</option>
          <option value="3">{t('wiz.spells.level3')}</option>
        </select>
        <select className="ao-input wiz-filter" value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="all">{t('wiz.spells.allSchools')}</option>
          {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="wiz-spell-cols">
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('wiz.spells.cantrips')}
            glyph="flame"
            tone="arcane"
            right={<span className={cn('ao-codex', cantripsChosen.length === limits.cantrips ? css.goldPale : css.inkQuiet)}>{cantripsChosen.length} / {limits.cantrips}</span>}
          />
          <div className="wiz-spell-list ao-scroll">
            {limits.cantrips === 0
              ? <div className={cn('ao-codex', css.pad14)}>{t('wiz.spells.noCantrips')}</div>
              : cantrips.length
                ? cantrips.map((s) => <SpellRow key={s.name} s={s} />)
                : <div className={cn('ao-codex', css.pad14)}>{t('wiz.spells.noCantripsMatch')}</div>}
          </div>
        </OrdoPanel>
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('wiz.spells.spells')}
            glyph="book"
            tone="arcane"
            right={<span className={cn('ao-codex', knownChosen.length === limits.spells ? css.goldPale : css.inkQuiet)}>{knownChosen.length} / {limits.spells}</span>}
          />
          <div className="wiz-spell-list ao-scroll">
            {leveled.length
              ? leveled.map((s) => <SpellRow key={s.name} s={s} />)
              : <div className={cn('ao-codex', css.pad14)}>{t('wiz.spells.noSpellsMatch')}</div>}
          </div>
        </OrdoPanel>
      </div>
    </div>
  );
}
