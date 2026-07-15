import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { referenceApi } from '@/api/reference.api';
import { homebrewSpellsApi } from '@/api/homebrew-spells.api';
import { useDamageTypes } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { HomebrewSpellRequest } from '@/types';
import s from './SpellModal.module.css';

interface SpellModalProps {
  open: boolean;
  onClose: () => void;
  packageId: string;
  editingId?: string | null;
  onSaved: () => void;
}

/**
 * Модалка авторинга homebrew-заклинания (P2-1, Phase A: идентичность). Создание/правка через package-scoped
 * эндпоинт /homebrew/packages/{packageId}/spells. Механика (урон/спасбросок) — через движок feature-rules отдельно.
 */
export function SpellModal({ open, onClose, packageId, editingId, onSaved }: SpellModalProps) {
  const t = useT();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [level, setLevel] = useState('0');
  const [school, setSchool] = useState('');
  const [castingTimeRaw, setCastingTimeRaw] = useState('');
  const [ritual, setRitual] = useState(false);
  const [rangeText, setRangeText] = useState('');
  const [durationText, setDurationText] = useState('');
  const [concentration, setConcentration] = useState(false);
  const [description, setDescription] = useState('');
  const [higherLevels, setHigherLevels] = useState('');
  // Механика (Phase B)
  const [damageDice, setDamageDice] = useState('');
  const [damageType, setDamageType] = useState('');
  const [saveAbility, setSaveAbility] = useState('');
  const [halfOnSave, setHalfOnSave] = useState(false);
  const [requiresAttackHit, setRequiresAttackHit] = useState(false);
  const [healingFormula, setHealingFormula] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: schoolsResp } = useQuery({
    queryKey: ['reference-spell-schools'],
    queryFn: () => referenceApi.getSpellSchools(),
    enabled: open,
  });
  const schools = schoolsResp?.data ?? [];
  const { data: damageTypes = [] } = useDamageTypes();
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
          setCastingTimeRaw(sp.castingTimeRaw ?? '');
          setRitual(!!sp.ritual);
          setRangeText(sp.rangeText ?? '');
          setDurationText(sp.durationText ?? '');
          setConcentration(!!sp.concentration);
          setDescription(sp.description ?? '');
          setHigherLevels(sp.higherLevels ?? '');
          setDamageDice(sp.damageDice ?? '');
          setDamageType(sp.damageType ?? '');
          setSaveAbility(sp.saveAbility ?? '');
          setHalfOnSave(!!sp.halfOnSave);
          setRequiresAttackHit(!!sp.requiresAttackHit);
          setHealingFormula(sp.healingFormula ?? '');
        })
        .catch(() => toast.error(t('hb.spell.loadFailed')));
    } else {
      setName(''); setNameEn(''); setLevel('0'); setSchool('');
      setCastingTimeRaw(''); setRitual(false); setRangeText(''); setDurationText('');
      setConcentration(false); setDescription(''); setHigherLevels('');
      setDamageDice(''); setDamageType(''); setSaveAbility(''); setHalfOnSave(false);
      setRequiresAttackHit(false); setHealingFormula('');
    }
  }, [open, editingId, packageId, t]);

  const handleSave = async () => {
    if (!name.trim() || !school) return;
    setSaving(true);
    try {
      const body: HomebrewSpellRequest = {
        name: name.trim(),
        nameEn: nameEn.trim() || undefined,
        level: Number(level) || 0,
        school,
        castingTimeRaw: castingTimeRaw.trim() || undefined,
        ritual,
        rangeText: rangeText.trim() || undefined,
        durationText: durationText.trim() || undefined,
        concentration,
        description: description.trim() || undefined,
        higherLevels: higherLevels.trim() || undefined,
        damageDice: damageDice.trim() || undefined,
        damageType: damageType || undefined,
        saveAbility: saveAbility || undefined,
        halfOnSave,
        requiresAttackHit,
        healingFormula: healingFormula.trim() || undefined,
      };
      if (editingId) await homebrewSpellsApi.update(packageId, editingId, body);
      else await homebrewSpellsApi.create(packageId, body);
      toast.success(editingId ? t('hb.spell.updated') : t('hb.spell.created'));
      onSaved();
      onClose();
    } catch {
      toast.error(t('hb.spell.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingId ? t('hb.spell.editTitle') : t('hb.spell.createTitle')}</DialogTitle>
        </DialogHeader>
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
          <div className={s.grid2}>
            <div>
              <label className="ao-label">{t('hb.spell.castingTime')}</label>
              <input className="ao-input" value={castingTimeRaw} onChange={(e) => setCastingTimeRaw(e.target.value)} placeholder={t('hb.spell.castingTimeHint')} />
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.range')}</label>
              <input className="ao-input" value={rangeText} onChange={(e) => setRangeText(e.target.value)} placeholder={t('hb.spell.rangeHint')} />
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.duration')}</label>
              <input className="ao-input" value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder={t('hb.spell.durationHint')} />
            </div>
          </div>
          <label className={cn('ao-row ao-gap-8', s.check)}>
            <input type="checkbox" checked={concentration} onChange={(e) => setConcentration(e.target.checked)} />
            {t('hb.spell.concentration')}
          </label>
          <label className={cn('ao-row ao-gap-8', s.check)}>
            <input type="checkbox" checked={ritual} onChange={(e) => setRitual(e.target.checked)} />
            {t('hb.spell.ritual')}
          </label>
          <div>
            <label className="ao-label">{t('hb.spell.description')}</label>
            <textarea className="ao-input" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="ao-label">{t('hb.spell.higherLevels')}</label>
            <textarea className="ao-input" rows={2} value={higherLevels} onChange={(e) => setHigherLevels(e.target.value)} />
          </div>

          {/* Механика (исполняется движком; пусто = только описание) */}
          <div className={s.sectionTitle}>{t('hb.spell.mechanics')}</div>
          <div className={s.grid2}>
            <div>
              <label className="ao-label">{t('hb.spell.damageDice')}</label>
              <input className="ao-input" value={damageDice} onChange={(e) => setDamageDice(e.target.value)} placeholder={t('hb.spell.damageDiceHint')} />
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.damageType')}</label>
              <select className="ao-input" value={damageType} onChange={(e) => setDamageType(e.target.value)}>
                <option value="">{t('hb.spell.damageTypeNone')}</option>
                {damageTypes.map((d) => (
                  <option key={d.slug ?? d.id} value={d.slug ?? ''}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.saveAbility')}</label>
              <select className="ao-input" value={saveAbility} onChange={(e) => setSaveAbility(e.target.value)}>
                <option value="">{t('hb.spell.saveAbilityNone')}</option>
                {ABILITIES.map((a) => (
                  <option key={a.slug} value={a.slug}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ao-label">{t('hb.spell.healingFormula')}</label>
              <input className="ao-input" value={healingFormula} onChange={(e) => setHealingFormula(e.target.value)} placeholder={t('hb.spell.healingFormulaHint')} />
            </div>
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

          <div className={s.actions}>
            <button className="ao-btn ao-btn--ghost" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button className="ao-btn ao-btn--primary" onClick={handleSave} disabled={!name.trim() || !school || saving}>
              {editingId ? t('hb.spell.save') : t('hb.spell.create')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
