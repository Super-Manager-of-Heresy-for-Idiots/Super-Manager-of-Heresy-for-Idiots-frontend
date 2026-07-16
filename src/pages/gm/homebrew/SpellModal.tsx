import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { referenceApi } from '@/api/reference.api';
import { homebrewSpellsApi } from '@/api/homebrew-spells.api';
import { useDamageTypes } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import {
  CASTING_ACTIONS, RANGE_TYPES, DURATION_TYPES, DURATION_UNITS, AREA_SHAPES,
  castingTimeText, rangeText, durationText, areaText,
} from '@/lib/spellDisplay';
import { DiceBuilder } from './DiceBuilder';
import type { ApiError, HomebrewSpellRequest } from '@/types';
import s from './SpellModal.module.css';

interface SpellModalProps {
  open: boolean;
  onClose: () => void;
  packageId: string;
  editingId?: string | null;
  onSaved: () => void;
}

/**
 * Модалка авторинга homebrew-заклинания (HB_UX Фазы 1/2/3). Двухпанельный конструктор: слева структурные
 * пикеры (время сотворения / дистанция / длительность / область — из словарей, без свободного текста),
 * справа живое превью карточки. Механика (урон/лечение) — через дайс-билдер; исполняется движком feature-rules.
 */
export function SpellModal({ open, onClose, packageId, editingId, onSaved }: SpellModalProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [level, setLevel] = useState('0');
  const [school, setSchool] = useState('');
  // Время сотворения (структурно)
  const [castingActionSlug, setCastingActionSlug] = useState('action');
  const [castingTimeAmount, setCastingTimeAmount] = useState('');
  const [castingTimeUnit, setCastingTimeUnit] = useState('minute');
  const [reactionTriggerSlug, setReactionTriggerSlug] = useState('');
  const [ritual, setRitual] = useState(false);
  // Дистанция (структурно)
  const [rangeType, setRangeType] = useState('self');
  const [rangeDistance, setRangeDistance] = useState('');
  // Длительность (структурно)
  const [durationType, setDurationType] = useState('instantaneous');
  const [durationAmount, setDurationAmount] = useState('');
  const [durationUnit, setDurationUnit] = useState('minute');
  const [concentration, setConcentration] = useState(false);
  // Область действия (структурно)
  const [areaShape, setAreaShape] = useState('');
  const [areaSizeFt, setAreaSizeFt] = useState('');
  const [zonePersists, setZonePersists] = useState(false);
  const [zoneTerrain, setZoneTerrain] = useState('');
  const [zoneObscurement, setZoneObscurement] = useState('');
  const [description, setDescription] = useState('');
  const [higherLevels, setHigherLevels] = useState('');
  // Механика
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDice, setDamageDice] = useState('8d6');
  const [damageType, setDamageType] = useState('');
  const [saveAbility, setSaveAbility] = useState('');
  const [halfOnSave, setHalfOnSave] = useState(false);
  const [requiresAttackHit, setRequiresAttackHit] = useState(false);
  const [hasHealing, setHasHealing] = useState(false);
  const [healingFormula, setHealingFormula] = useState('2d8');
  const [saving, setSaving] = useState(false);

  const { data: schoolsResp } = useQuery({
    queryKey: ['reference-spell-schools'],
    queryFn: () => referenceApi.getSpellSchools(),
    enabled: open,
  });
  const schools = schoolsResp?.data ?? [];
  const { data: damageTypes = [] } = useDamageTypes();
  const { data: triggersResp } = useQuery({
    queryKey: ['reference-reaction-triggers'],
    queryFn: () => referenceApi.getReactionTriggers(),
    enabled: open,
  });
  const triggers = triggersResp?.data ?? [];
  const ABILITIES: { slug: string; label: string }[] = [
    { slug: 'str', label: t('hb.spell.abStr') },
    { slug: 'dex', label: t('hb.spell.abDex') },
    { slug: 'con', label: t('hb.spell.abCon') },
    { slug: 'int', label: t('hb.spell.abInt') },
    { slug: 'wis', label: t('hb.spell.abWis') },
    { slug: 'cha', label: t('hb.spell.abCha') },
  ];

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      homebrewSpellsApi.get(packageId, editingId)
        .then((r) => {
          const sp = r.data;
          if (!sp) return;
          setName(sp.name);
          setNameEn(sp.nameEn ?? '');
          setLevel(String(sp.level ?? 0));
          setSchool(sp.school ?? '');
          setCastingActionSlug(sp.castingActionSlug ?? 'action');
          setCastingTimeAmount(sp.castingTimeAmount != null ? String(sp.castingTimeAmount) : '');
          setCastingTimeUnit(sp.castingTimeUnit ?? 'minute');
          setReactionTriggerSlug(sp.reactionTriggerSlug ?? '');
          setRitual(!!sp.ritual);
          setRangeType(sp.rangeType ?? 'self');
          setRangeDistance(sp.rangeDistance != null ? String(sp.rangeDistance) : '');
          setDurationType(sp.durationType ?? 'instantaneous');
          setDurationAmount(sp.durationAmount != null ? String(sp.durationAmount) : '');
          setDurationUnit(sp.durationUnit ?? 'minute');
          setConcentration(!!sp.concentration);
          setAreaShape(sp.areaShape ?? '');
          setAreaSizeFt(sp.areaSizeFt != null ? String(sp.areaSizeFt) : '');
          setZonePersists(!!sp.zonePersists);
          setZoneTerrain(sp.zoneTerrain ?? '');
          setZoneObscurement(sp.zoneObscurement ?? '');
          setDescription(sp.description ?? '');
          setHigherLevels(sp.higherLevels ?? '');
          setHasDamage(!!sp.damageDice);
          setDamageDice(sp.damageDice || '8d6');
          setDamageType(sp.damageType ?? '');
          setSaveAbility(sp.saveAbility ?? '');
          setHalfOnSave(!!sp.halfOnSave);
          setRequiresAttackHit(!!sp.requiresAttackHit);
          setHasHealing(!!sp.healingFormula);
          setHealingFormula(sp.healingFormula || '2d8');
        })
        .catch(() => toast.error(t('hb.spell.loadFailed')));
    } else {
      setName(''); setNameEn(''); setLevel('0'); setSchool('');
      setCastingActionSlug('action'); setCastingTimeAmount(''); setCastingTimeUnit('minute'); setReactionTriggerSlug('');
      setRitual(false);
      setRangeType('self'); setRangeDistance('');
      setDurationType('instantaneous'); setDurationAmount(''); setDurationUnit('minute'); setConcentration(false);
      setAreaShape(''); setAreaSizeFt(''); setZonePersists(false); setZoneTerrain(''); setZoneObscurement('');
      setDescription(''); setHigherLevels('');
      setHasDamage(false); setDamageDice('8d6'); setDamageType(''); setSaveAbility(''); setHalfOnSave(false);
      setRequiresAttackHit(false); setHasHealing(false); setHealingFormula('2d8');
    }
  }, [open, editingId, packageId, t]);

  const num = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v));

  // Живое превью: собираем структуру и генерируем строки карточки ровно как это сделает сервер.
  const preview = {
    castingActionSlug, castingTimeAmount: num(castingTimeAmount), castingTimeUnit,
    rangeType, rangeDistance: num(rangeDistance),
    durationType, durationAmount: num(durationAmount), durationUnit, concentration,
    areaShape, areaSizeFt: num(areaSizeFt), zonePersists,
  };

  const handleSave = async () => {
    if (!name.trim() || !school) return;
    setSaving(true);
    try {
      const body: HomebrewSpellRequest = {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        level: Number(level) || 0,
        school,
        castingActionSlug,
        castingTimeAmount: castingActionSlug === 'time' ? num(castingTimeAmount) : undefined,
        castingTimeUnit: castingActionSlug === 'time' ? castingTimeUnit : undefined,
        reactionTriggerSlug: castingActionSlug === 'reaction' ? (reactionTriggerSlug || undefined) : undefined,
        ritual,
        rangeType,
        rangeDistance: rangeType === 'distance' ? num(rangeDistance) : undefined,
        rangeUnit: rangeType === 'distance' ? 'ft' : undefined,
        durationType,
        durationAmount: durationType === 'timed' ? num(durationAmount) : undefined,
        durationUnit: durationType === 'timed' ? durationUnit : undefined,
        concentration,
        areaShape: areaShape || undefined,
        areaSizeFt: areaShape ? num(areaSizeFt) : undefined,
        zonePersists: areaShape ? zonePersists : undefined,
        zoneTerrain: areaShape ? (zoneTerrain || undefined) : undefined,
        zoneObscurement: areaShape ? (zoneObscurement || undefined) : undefined,
        description: description.trim() || undefined,
        higherLevels: higherLevels.trim() || undefined,
        damageDice: hasDamage ? damageDice : undefined,
        damageType: hasDamage ? (damageType || undefined) : undefined,
        saveAbility: saveAbility || undefined,
        halfOnSave,
        requiresAttackHit,
        healingFormula: hasHealing ? healingFormula : undefined,
      };
      if (editingId) await homebrewSpellsApi.update(packageId, editingId, body);
      else await homebrewSpellsApi.create(packageId, body);
      toast.success(editingId ? t('hb.spell.updated') : t('hb.spell.created'));
      onSaved();
      onClose();
    } catch (error) {
      const message = (error as AxiosError<ApiError>).response?.data?.message;
      toast.error(message || t('hb.spell.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const diceLabels = {
    count: t('hb.dice.count'), die: t('hb.dice.die'), bonus: t('hb.dice.bonus'),
    abilityMod: t('hb.dice.abilityMod'), none: t('hb.dice.none'), avg: t('hb.dice.avg'), max: t('hb.dice.max'),
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={s.wide}>
        <DialogHeader>
          <DialogTitle>{editingId ? t('hb.spell.editTitle') : t('hb.spell.createTitle')}</DialogTitle>
        </DialogHeader>
        <div className={s.layout}>
          {/* ── Левая панель: ввод ── */}
          <div className={s.form}>
            <div>
              <label className="ao-label">{t('hb.spell.name')}</label>
              <input className="ao-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.nameEn')}</label>
              <input className="ao-input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
            <div className={s.grid2}>
              <div>
                <label className="ao-label">{t('hb.spell.level')}</label>
                <select className="ao-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="0">{t('hb.spell.cantrip')}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <option key={n} value={String(n)}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ao-label">{t('hb.spell.school')}</label>
                <select className="ao-input" value={school} onChange={(e) => setSchool(e.target.value)}>
                  <option value="">{t('hb.spell.schoolNone')}</option>
                  {schools.map((sc) => (
                    <option key={sc.slug ?? sc.id} value={sc.slug ?? ''}>{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Время сотворения — сегмент-пикер экономики действия */}
            <div>
              <label className="ao-label">{t('hb.spell.castingTime')}</label>
              <div className={s.segments}>
                {CASTING_ACTIONS.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    className={cn(s.segment, castingActionSlug === slug && s.segmentOn)}
                    onClick={() => setCastingActionSlug(slug)}
                  >
                    {t(`hb.spell.cast.${slug}`)}
                  </button>
                ))}
              </div>
              {castingActionSlug === 'time' && (
                <div className={cn(s.grid2, s.subRow)}>
                  <input
                    className="ao-input" type="number" min={1}
                    placeholder={t('hb.spell.castTimeAmount')}
                    value={castingTimeAmount} onChange={(e) => setCastingTimeAmount(e.target.value)}
                  />
                  <select className="ao-input" value={castingTimeUnit} onChange={(e) => setCastingTimeUnit(e.target.value)}>
                    <option value="minute">{t('hb.spell.unit.minute')}</option>
                    <option value="hour">{t('hb.spell.unit.hour')}</option>
                  </select>
                </div>
              )}
              {castingActionSlug === 'reaction' && (
                <div className={s.subRow}>
                  <label className="ao-label">{t('hb.spell.reactionTrigger')}</label>
                  <select className="ao-input" value={reactionTriggerSlug} onChange={(e) => setReactionTriggerSlug(e.target.value)}>
                    <option value="">{t('hb.spell.reactionTriggerNone')}</option>
                    {triggers.map((tr) => (
                      <option key={tr.slug ?? tr.id} value={tr.slug ?? ''}>{tr.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Дистанция */}
            <div>
              <label className="ao-label">{t('hb.spell.range')}</label>
              <div className={s.segments}>
                {RANGE_TYPES.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    className={cn(s.segment, rangeType === slug && s.segmentOn)}
                    onClick={() => setRangeType(slug)}
                  >
                    {t(`hb.spell.range.${slug}`)}
                  </button>
                ))}
              </div>
              {rangeType === 'distance' && (
                <div className={s.subRow}>
                  <input
                    className="ao-input" type="number" min={0}
                    placeholder={t('hb.spell.rangeDistance')}
                    value={rangeDistance} onChange={(e) => setRangeDistance(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Длительность */}
            <div>
              <label className="ao-label">{t('hb.spell.duration')}</label>
              <div className={s.segments}>
                {DURATION_TYPES.map((slug) => (
                  <button
                    key={slug}
                    type="button"
                    className={cn(s.segment, durationType === slug && s.segmentOn)}
                    onClick={() => setDurationType(slug)}
                  >
                    {t(`hb.spell.dur.${slug}`)}
                  </button>
                ))}
              </div>
              {durationType === 'timed' && (
                <div className={cn(s.grid2, s.subRow)}>
                  <input
                    className="ao-input" type="number" min={1}
                    placeholder={t('hb.spell.durAmount')}
                    value={durationAmount} onChange={(e) => setDurationAmount(e.target.value)}
                  />
                  <select className="ao-input" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}>
                    {DURATION_UNITS.map((u) => <option key={u} value={u}>{t(`hb.spell.unit.${u}`)}</option>)}
                  </select>
                </div>
              )}
            </div>
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={concentration} onChange={(e) => setConcentration(e.target.checked)} />
              {t('hb.spell.concentration')}
            </label>
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={ritual} onChange={(e) => setRitual(e.target.checked)} />
              {t('hb.spell.ritual')}
            </label>

            {/* Область действия (AoE) */}
            <div className={s.sectionTitle}>{t('hb.spell.areaSection')}</div>
            <div>
              <label className="ao-label">{t('hb.spell.areaShape')}</label>
              <select className="ao-input" value={areaShape} onChange={(e) => setAreaShape(e.target.value)}>
                <option value="">{t('hb.spell.areaShapeNone')}</option>
                {AREA_SHAPES.map((sh) => <option key={sh} value={sh}>{t(`hb.spell.shape.${sh}`)}</option>)}
              </select>
            </div>
            {areaShape && (
              <>
                <div className={s.grid2}>
                  <div>
                    <label className="ao-label">{t('hb.spell.areaSize')}</label>
                    <input className="ao-input" type="number" min={0} value={areaSizeFt} onChange={(e) => setAreaSizeFt(e.target.value)} />
                  </div>
                </div>
                <label className={cn('ao-row ao-gap-8', s.check)}>
                  <input type="checkbox" checked={zonePersists} onChange={(e) => setZonePersists(e.target.checked)} />
                  {t('hb.spell.zonePersists')}
                </label>
                {zonePersists && (
                  <div className={s.grid2}>
                    <div>
                      <label className="ao-label">{t('hb.spell.zoneTerrain')}</label>
                      <select className="ao-input" value={zoneTerrain} onChange={(e) => setZoneTerrain(e.target.value)}>
                        <option value="">{t('hb.spell.zone.none')}</option>
                        <option value="DIFFICULT">{t('hb.spell.zone.difficult')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="ao-label">{t('hb.spell.zoneObscurement')}</label>
                      <select className="ao-input" value={zoneObscurement} onChange={(e) => setZoneObscurement(e.target.value)}>
                        <option value="">{t('hb.spell.zone.none')}</option>
                        <option value="LIGHT">{t('hb.spell.zone.light')}</option>
                        <option value="HEAVY">{t('hb.spell.zone.heavy')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="ao-label">{t('hb.spell.description')} <span className={s.flavorBadge}>{t('hb.flavorBadge')}</span></label>
              <textarea className="ao-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.higherLevels')}</label>
              <textarea className="ao-input" rows={2} value={higherLevels} onChange={(e) => setHigherLevels(e.target.value)} />
            </div>

            {/* Механика */}
            <div className={s.sectionTitle}>{t('hb.spell.mechanics')}</div>
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={hasDamage} onChange={(e) => setHasDamage(e.target.checked)} />
              {t('hb.spell.hasDamage')}
            </label>
            {hasDamage && (
              <>
                <DiceBuilder value={damageDice} onChange={setDamageDice} labels={diceLabels} />
                <div>
                  <label className="ao-label">{t('hb.spell.damageType')}</label>
                  <select className="ao-input" value={damageType} onChange={(e) => setDamageType(e.target.value)}>
                    <option value="">{t('hb.spell.damageTypeNone')}</option>
                    {damageTypes.map((d) => (
                      <option key={d.slug ?? d.id} value={d.slug ?? ''}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="ao-label">{t('hb.spell.saveAbility')}</label>
              <select className="ao-input" value={saveAbility} onChange={(e) => setSaveAbility(e.target.value)}>
                <option value="">{t('hb.spell.saveAbilityNone')}</option>
                {ABILITIES.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.label}</option>
                ))}
              </select>
            </div>
            {saveAbility && (
              <label className={cn('ao-row ao-gap-8', s.check)}>
                <input type="checkbox" checked={halfOnSave} onChange={(e) => setHalfOnSave(e.target.checked)} />
                {t('hb.spell.halfOnSave')}
              </label>
            )}
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={requiresAttackHit} onChange={(e) => setRequiresAttackHit(e.target.checked)} />
              {t('hb.spell.requiresAttackHit')}
            </label>
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={hasHealing} onChange={(e) => setHasHealing(e.target.checked)} />
              {t('hb.spell.hasHealing')}
            </label>
            {hasHealing && (
              <DiceBuilder value={healingFormula} onChange={setHealingFormula} allowBonus abilityMods={ABILITIES} labels={diceLabels} />
            )}
          </div>

          {/* ── Правая панель: живое превью карточки ── */}
          <aside className={s.preview}>
            <div className={s.previewCard}>
              <div className={s.previewName}>{name.trim() || t('hb.spell.previewUnnamed')}</div>
              <div className={s.previewMeta}>
                {Number(level) === 0 ? t('hb.spell.cantrip') : `${t('hb.spell.level')} ${level}`}
                {school ? ` · ${schools.find((sc) => sc.slug === school)?.name ?? school}` : ''}
              </div>
              <dl className={s.previewRows}>
                <div><dt>{t('hb.spell.castingTime')}</dt><dd>{castingTimeText(preview)}{ritual ? ` · ${t('hb.spell.ritual')}` : ''}</dd></div>
                <div><dt>{t('hb.spell.range')}</dt><dd>{rangeText(preview)}</dd></div>
                <div><dt>{t('hb.spell.duration')}</dt><dd>{durationText(preview)}</dd></div>
                {areaShape && <div><dt>{t('hb.spell.areaSection')}</dt><dd>{areaText(preview)}</dd></div>}
                {hasDamage && <div><dt>{t('hb.spell.damageDice')}</dt><dd>{damageDice}{damageType ? ` ${damageTypes.find((d) => d.slug === damageType)?.name ?? ''}` : ''}</dd></div>}
                {hasHealing && <div><dt>{t('hb.spell.healingFormula')}</dt><dd>{healingFormula}</dd></div>}
              </dl>
            </div>
          </aside>
        </div>

        <div className={s.actions}>
          <button className="ao-btn ao-btn--ghost" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
          <button className="ao-btn ao-btn--primary" onClick={handleSave} disabled={!name.trim() || !school || saving}>
            {editingId ? t('hb.spell.save') : t('hb.spell.create')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
