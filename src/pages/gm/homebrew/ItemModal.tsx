import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { referenceApi } from '@/api/reference.api';
import { homebrewItemsApi } from '@/api/homebrew-items.api';
import { useDamageTypes } from '@/hooks/useContentCatalog';
import { useT } from '@/i18n/I18nContext';
import { isPureDiceFormula, normalizeDiceNotation } from '@/lib/dice';
import { cn } from '@/lib/utils';
import type { ApiError, HomebrewItemRequest } from '@/types';
import s from './ItemModal.module.css';

interface ItemModalProps {
  open: boolean;
  onClose: () => void;
  packageId: string;
  editingId?: string | null;
  onSaved: () => void;
}

/** Внутренний дискриминатор вида для UI-селектора (магия + четыре вида снаряжения). */
type ItemKindUi = 'magic' | 'weapon' | 'armor' | 'gear' | 'tool';

const KIND_ORDER: ItemKindUi[] = ['magic', 'weapon', 'armor', 'gear', 'tool'];

function numOrUndef(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Единая модалка авторинга homebrew-предмета (P1.5 / IT-2/IT-3). Селектор вида (магический / оружие / броня /
 * снаряжение / инструмент); секции статов появляются по виду. Создание/правка через package-scoped эндпоинт
 * /homebrew/packages/{packageId}/items с kind в теле.
 */
export function ItemModal({ open, onClose, packageId, editingId, onSaved }: ItemModalProps) {
  const t = useT();
  const [kindUi, setKindUi] = useState<ItemKindUi>('magic');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');
  // magic
  const [rarity, setRarity] = useState('');
  const [attunementRequired, setAttunementRequired] = useState(false);
  const [attunementRequirement, setAttunementRequirement] = useState('');
  // equipment common
  const [category, setCategory] = useState('');
  const [costGold, setCostGold] = useState('');
  const [weightLb, setWeightLb] = useState('');
  // weapon
  const [damageDiceCount, setDamageDiceCount] = useState('');
  const [damageDieSize, setDamageDieSize] = useState('');
  const [damageBonus, setDamageBonus] = useState('');
  const [damageType, setDamageType] = useState('');
  const [flatDamage, setFlatDamage] = useState('');
  // armor
  const [baseAc, setBaseAc] = useState('');
  const [dexBonusAllowed, setDexBonusAllowed] = useState(false);
  const [maxDexBonus, setMaxDexBonus] = useState('');
  const [strengthRequired, setStrengthRequired] = useState('');
  const [stealthDisadvantage, setStealthDisadvantage] = useState(false);
  // умение предмета (IT-4)
  const [abDamageDice, setAbDamageDice] = useState('');
  const [abDamageType, setAbDamageType] = useState('');
  const [abSaveAbility, setAbSaveAbility] = useState('');
  const [abHalfOnSave, setAbHalfOnSave] = useState(false);
  const [abHealingFormula, setAbHealingFormula] = useState('');
  const [abRequiresEquipped, setAbRequiresEquipped] = useState(false);
  const [abRequiresAttunement, setAbRequiresAttunement] = useState(false);
  const [abConsumeOnUse, setAbConsumeOnUse] = useState(false);
  const [saving, setSaving] = useState(false);

  const ABILITIES: { slug: string; label: string }[] = [
    { slug: 'str', label: t('hb.spell.abStr') },
    { slug: 'dex', label: t('hb.spell.abDex') },
    { slug: 'con', label: t('hb.spell.abCon') },
    { slug: 'int', label: t('hb.spell.abInt') },
    { slug: 'wis', label: t('hb.spell.abWis') },
    { slug: 'cha', label: t('hb.spell.abCha') },
  ];

  const { data: raritiesResp } = useQuery({
    queryKey: ['reference-rarities'],
    queryFn: () => referenceApi.getRarities(),
    enabled: open && kindUi === 'magic',
  });
  const rarities = raritiesResp?.data ?? [];
  const { data: damageTypes = [] } = useDamageTypes();

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      homebrewItemsApi.get(packageId, editingId)
        .then((r) => {
          const it = r.data;
          if (!it) return;
          setKindUi(it.kind === 'EQUIPMENT' ? ((it.equipmentKind as ItemKindUi) ?? 'gear') : 'magic');
          setName(it.name);
          setNameEn(it.nameEn ?? '');
          setDescription(it.description ?? '');
          setRarity(it.rarity ?? '');
          setAttunementRequired(!!it.attunementRequired);
          setAttunementRequirement(it.attunementRequirement ?? '');
          setCategory(it.category ?? '');
          setCostGold(it.costGold != null ? String(it.costGold) : '');
          setWeightLb(it.weightLb != null ? String(it.weightLb) : '');
          setDamageDiceCount(it.damageDiceCount != null ? String(it.damageDiceCount) : '');
          setDamageDieSize(it.damageDieSize != null ? String(it.damageDieSize) : '');
          setDamageBonus(it.damageBonus != null ? String(it.damageBonus) : '');
          setDamageType(it.damageType ?? '');
          setFlatDamage(it.flatDamage != null ? String(it.flatDamage) : '');
          setBaseAc(it.baseAc != null ? String(it.baseAc) : '');
          setDexBonusAllowed(!!it.dexBonusAllowed);
          setMaxDexBonus(it.maxDexBonus != null ? String(it.maxDexBonus) : '');
          setStrengthRequired(it.strengthRequired != null ? String(it.strengthRequired) : '');
          setStealthDisadvantage(!!it.stealthDisadvantage);
          setAbDamageDice(it.abilityDamageDice ?? '');
          setAbDamageType(it.abilityDamageType ?? '');
          setAbSaveAbility(it.abilitySaveAbility ?? '');
          setAbHalfOnSave(!!it.abilityHalfOnSave);
          setAbHealingFormula(it.abilityHealingFormula ?? '');
          setAbRequiresEquipped(!!it.abilityRequiresEquipped);
          setAbRequiresAttunement(!!it.abilityRequiresAttunement);
          setAbConsumeOnUse(!!it.abilityConsumeOnUse);
        })
        .catch(() => toast.error(t('hb.item.loadFailed')));
    } else {
      setKindUi('magic');
      setName(''); setNameEn(''); setDescription('');
      setRarity(''); setAttunementRequired(false); setAttunementRequirement('');
      setCategory(''); setCostGold(''); setWeightLb('');
      setDamageDiceCount(''); setDamageDieSize(''); setDamageBonus(''); setDamageType(''); setFlatDamage('');
      setBaseAc(''); setDexBonusAllowed(false); setMaxDexBonus(''); setStrengthRequired(''); setStealthDisadvantage(false);
      setAbDamageDice(''); setAbDamageType(''); setAbSaveAbility(''); setAbHalfOnSave(false);
      setAbHealingFormula(''); setAbRequiresEquipped(false); setAbRequiresAttunement(false); setAbConsumeOnUse(false);
    }
  }, [open, editingId, packageId, t]);

  // Валидация костей у поля: та же семантика, что у серверного парсера (чистая NdM, русская нотация допустима).
  const abDamageDiceInvalid = abDamageDice.trim() !== '' && !isPureDiceFormula(abDamageDice);

  const handleSave = async () => {
    if (!name.trim() || abDamageDiceInvalid) return;
    setSaving(true);
    try {
      const ability: Partial<HomebrewItemRequest> = {
        abilityDamageDice: abDamageDice.trim() ? normalizeDiceNotation(abDamageDice.trim()) : undefined,
        abilityDamageType: abDamageType || undefined,
        abilitySaveAbility: abSaveAbility || undefined,
        abilityHalfOnSave: abHalfOnSave,
        abilityHealingFormula: abHealingFormula.trim() ? normalizeDiceNotation(abHealingFormula.trim()) : undefined,
        abilityRequiresEquipped: abRequiresEquipped,
        abilityRequiresAttunement: abRequiresAttunement,
        abilityConsumeOnUse: abConsumeOnUse,
      };
      const body: HomebrewItemRequest = kindUi === 'magic'
        ? {
            kind: 'MAGIC',
            name: name.trim(),
            nameEn: nameEn.trim() || undefined,
            description: description.trim() || undefined,
            rarity: rarity || undefined,
            attunementRequired,
            attunementRequirement: attunementRequirement.trim() || undefined,
            ...ability,
          }
        : {
            kind: 'EQUIPMENT',
            equipmentKind: kindUi,
            name: name.trim(),
            nameEn: nameEn.trim() || undefined,
            description: description.trim() || undefined,
            category: category.trim() || undefined,
            costGold: numOrUndef(costGold),
            weightLb: numOrUndef(weightLb),
            ...(kindUi === 'weapon' && {
              damageDiceCount: numOrUndef(damageDiceCount),
              damageDieSize: numOrUndef(damageDieSize),
              damageBonus: numOrUndef(damageBonus),
              damageType: damageType || undefined,
              flatDamage: numOrUndef(flatDamage),
            }),
            ...(kindUi === 'armor' && {
              baseAc: numOrUndef(baseAc),
              dexBonusAllowed,
              maxDexBonus: numOrUndef(maxDexBonus),
              strengthRequired: numOrUndef(strengthRequired),
              stealthDisadvantage,
            }),
            ...ability,
          };
      if (editingId) await homebrewItemsApi.update(packageId, editingId, body);
      else await homebrewItemsApi.create(packageId, body);
      toast.success(editingId ? t('hb.item.updated') : t('hb.item.created'));
      onSaved();
      onClose();
    } catch (error) {
      const message = (error as AxiosError<ApiError>).response?.data?.message;
      toast.error(message || t('hb.item.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingId ? t('hb.item.editTitle') : t('hb.item.createTitle')}</DialogTitle>
        </DialogHeader>
        <div className={s.form}>
          {/* Вид предмета — при правке зафиксирован (нельзя менять таблицу-назначение) */}
          {!editingId && (
            <div>
              <label className="ao-label">{t('hb.item.kind')}</label>
              <div className={s.kindTabs}>
                {KIND_ORDER.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={cn(s.kindTab, kindUi === k && s.kindTabOn)}
                    onClick={() => setKindUi(k)}
                  >
                    {t(`hb.item.kind.${k}`)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="ao-label">{t('hb.item.name')}</label>
            <input className="ao-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="ao-label">{t('hb.item.nameEn')}</label>
            <input className="ao-input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div>
            <label className="ao-label">{t('hb.item.description')}</label>
            <textarea className="ao-input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* ── MAGIC ── */}
          {kindUi === 'magic' && (
            <>
              <div>
                <label className="ao-label">{t('hb.item.rarity')}</label>
                <select className="ao-input" value={rarity} onChange={(e) => setRarity(e.target.value)}>
                  <option value="">{t('hb.item.rarityNone')}</option>
                  {rarities.map((r) => (
                    <option key={r.slug ?? r.id} value={r.slug ?? ''}>{r.name}</option>
                  ))}
                </select>
              </div>
              <label className={cn('ao-row ao-gap-8', s.check)}>
                <input type="checkbox" checked={attunementRequired} onChange={(e) => setAttunementRequired(e.target.checked)} />
                {t('hb.item.attunement')}
              </label>
              {attunementRequired && (
                <input
                  className="ao-input"
                  value={attunementRequirement}
                  onChange={(e) => setAttunementRequirement(e.target.value)}
                  placeholder={t('hb.item.attunementReq')}
                />
              )}
            </>
          )}

          {/* ── EQUIPMENT common ── */}
          {kindUi !== 'magic' && (
            <div className={s.grid2}>
              <div>
                <label className="ao-label">{t('hb.item.category')}</label>
                <input className="ao-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t('hb.item.categoryHint')} />
              </div>
              <div>
                <label className="ao-label">{t('hb.item.costGold')}</label>
                <input className="ao-input" type="number" min={0} value={costGold} onChange={(e) => setCostGold(e.target.value)} />
              </div>
              <div>
                <label className="ao-label">{t('hb.item.weightLb')}</label>
                <input className="ao-input" type="number" min={0} value={weightLb} onChange={(e) => setWeightLb(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── WEAPON ── */}
          {kindUi === 'weapon' && (
            <div className={s.section}>
              <div className={s.sectionTitle}>{t('hb.item.weaponSection')}</div>
              <div className={s.grid2}>
                <div>
                  <label className="ao-label">{t('hb.item.damageDiceCount')}</label>
                  <input className="ao-input" type="number" min={1} value={damageDiceCount} onChange={(e) => setDamageDiceCount(e.target.value)} />
                </div>
                <div>
                  <label className="ao-label">{t('hb.item.damageDieSize')}</label>
                  <input className="ao-input" type="number" min={1} value={damageDieSize} onChange={(e) => setDamageDieSize(e.target.value)} />
                </div>
                <div>
                  <label className="ao-label">{t('hb.item.damageBonus')}</label>
                  <input className="ao-input" type="number" value={damageBonus} onChange={(e) => setDamageBonus(e.target.value)} />
                </div>
                <div>
                  <label className="ao-label">{t('hb.item.flatDamage')}</label>
                  <input className="ao-input" type="number" value={flatDamage} onChange={(e) => setFlatDamage(e.target.value)} />
                </div>
                <div>
                  <label className="ao-label">{t('hb.item.damageType')}</label>
                  <select className="ao-input" value={damageType} onChange={(e) => setDamageType(e.target.value)}>
                    <option value="">{t('hb.item.damageTypeNone')}</option>
                    {damageTypes.map((d) => (
                      <option key={d.slug ?? d.id} value={d.slug ?? ''}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── ARMOR ── */}
          {kindUi === 'armor' && (
            <div className={s.section}>
              <div className={s.sectionTitle}>{t('hb.item.armorSection')}</div>
              <div className={s.grid2}>
                <div>
                  <label className="ao-label">{t('hb.item.baseAc')}</label>
                  <input className="ao-input" type="number" value={baseAc} onChange={(e) => setBaseAc(e.target.value)} />
                </div>
                <div>
                  <label className="ao-label">{t('hb.item.maxDexBonus')}</label>
                  <input className="ao-input" type="number" value={maxDexBonus} onChange={(e) => setMaxDexBonus(e.target.value)} />
                </div>
                <div>
                  <label className="ao-label">{t('hb.item.strengthRequired')}</label>
                  <input className="ao-input" type="number" value={strengthRequired} onChange={(e) => setStrengthRequired(e.target.value)} />
                </div>
              </div>
              <label className={cn('ao-row ao-gap-8', s.check)}>
                <input type="checkbox" checked={dexBonusAllowed} onChange={(e) => setDexBonusAllowed(e.target.checked)} />
                {t('hb.item.dexBonusAllowed')}
              </label>
              <label className={cn('ao-row ao-gap-8', s.check)}>
                <input type="checkbox" checked={stealthDisadvantage} onChange={(e) => setStealthDisadvantage(e.target.checked)} />
                {t('hb.item.stealthDisadvantage')}
              </label>
            </div>
          )}

          {/* Умение предмета — исполняется движком (пусто = у предмета нет активного умения) */}
          <div className={s.section}>
            <div className={s.sectionTitle}>{t('hb.item.abilitySection')}</div>
            <div className={s.grid2}>
              <div>
                <label className="ao-label">{t('hb.item.abDamageDice')}</label>
                <input className="ao-input" value={abDamageDice} onChange={(e) => setAbDamageDice(e.target.value)} placeholder={t('hb.item.abDamageDiceHint')} />
                {abDamageDiceInvalid && <div className={s.fieldError}>{t('hb.dice.invalid')}</div>}
              </div>
              <div>
                <label className="ao-label">{t('hb.item.abDamageType')}</label>
                <select className="ao-input" value={abDamageType} onChange={(e) => setAbDamageType(e.target.value)}>
                  <option value="">{t('hb.item.abDamageTypeNone')}</option>
                  {damageTypes.map((d) => (
                    <option key={d.slug ?? d.id} value={d.slug ?? ''}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ao-label">{t('hb.item.abSaveAbility')}</label>
                <select className="ao-input" value={abSaveAbility} onChange={(e) => setAbSaveAbility(e.target.value)}>
                  <option value="">{t('hb.item.abSaveAbilityNone')}</option>
                  {ABILITIES.map((a) => (
                    <option key={a.slug} value={a.slug}>{a.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="ao-label">{t('hb.item.abHealingFormula')}</label>
                <input className="ao-input" value={abHealingFormula} onChange={(e) => setAbHealingFormula(e.target.value)} placeholder={t('hb.item.abHealingFormulaHint')} />
              </div>
            </div>
            {abSaveAbility && (
              <label className={cn('ao-row ao-gap-8', s.check)}>
                <input type="checkbox" checked={abHalfOnSave} onChange={(e) => setAbHalfOnSave(e.target.checked)} />
                {t('hb.item.abHalfOnSave')}
              </label>
            )}
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={abRequiresEquipped} onChange={(e) => setAbRequiresEquipped(e.target.checked)} disabled={abConsumeOnUse} />
              {t('hb.item.abRequiresEquipped')}
            </label>
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={abRequiresAttunement} onChange={(e) => setAbRequiresAttunement(e.target.checked)} />
              {t('hb.item.abRequiresAttunement')}
            </label>
            <label className={cn('ao-row ao-gap-8', s.check)}>
              <input type="checkbox" checked={abConsumeOnUse} onChange={(e) => setAbConsumeOnUse(e.target.checked)} />
              {t('hb.item.abConsumeOnUse')}
            </label>
          </div>

          <div className={s.actions}>
            <button className="ao-btn ao-btn--ghost" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button className="ao-btn ao-btn--primary" onClick={handleSave} disabled={!name.trim() || abDamageDiceInvalid || saving}>
              {editingId ? t('hb.item.save') : t('hb.item.create')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
