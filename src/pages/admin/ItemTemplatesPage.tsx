import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import { Rune, OrdoPanel, OrdoField, OrdoChip } from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useAdminItemTemplates,
  useCreateItemTemplate,
  useUpdateItemTemplate,
  useDeleteItemTemplate,
} from '@/hooks/useAdmin';
import type { ItemTemplateResponse, CreateItemTemplateRequest, DamageType } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import { rarityColor, normalizeRarity, RARITY_ORDER } from '@/lib/itemVisuals';
import { RarityBadge, rarityLabelKey } from '@/components/items/RarityBadge';
import s from './ItemTemplatesPage.module.css';

/* Damage type slugs are single words; the resolver lowercases on save, so the
   UPPER constant round-trips to the backend slug (e.g. 'FIRE' -> 'fire'). */
const DAMAGE_TYPES: DamageType[] = [
  'ACID', 'BLUDGEONING', 'COLD', 'FIRE', 'FORCE', 'LIGHTNING',
  'NECROTIC', 'PIERCING', 'POISON', 'PSYCHIC', 'RADIANT', 'SLASHING', 'THUNDER',
];

const NONE = '__none__';

function DamageBadge({ dice, bonus, type }: { dice?: string; bonus?: number; type?: string }) {
  if (!dice && !bonus && !type) return null;
  return (
    <span className={s.damageBadge}>
      <Rune kind="diamond-fill" size={7} color="var(--ember-pale)" />
      <span className={s.damageValue}>
        {dice}{bonus ? `+${bonus}` : ''}
      </span>
      {type && <span className={s.damageType}>{type.toUpperCase()}</span>}
    </span>
  );
}

export default function ItemTemplatesPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useAdminItemTemplates();
  const createMutation = useCreateItemTemplate();
  const updateMutation = useUpdateItemTemplate();
  const deleteMutation = useDeleteItemTemplate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ItemTemplateResponse | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formRarity, setFormRarity] = useState<string>('common');
  const [formDamageDice, setFormDamageDice] = useState('');
  const [formDamageBonus, setFormDamageBonus] = useState('');
  const [formDamageType, setFormDamageType] = useState(NONE);
  const [formStackable, setFormStackable] = useState(false);

  const busy = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormRarity('common');
    setFormDamageDice('');
    setFormDamageBonus('');
    setFormDamageType(NONE);
    setFormStackable(false);
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: ItemTemplateResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormRarity(normalizeRarity(item.rarity) ?? 'common');
    setFormDamageDice(item.damageDice || '');
    setFormDamageBonus(item.damageBonus != null ? String(item.damageBonus) : '');
    setFormDamageType(item.damageType ? item.damageType.toUpperCase() : NONE);
    setFormStackable(item.isStackable ?? false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: CreateItemTemplateRequest = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      rarity: formRarity || undefined,
      damageDice: formDamageDice.trim() || undefined,
      damageBonus: formDamageBonus ? Number(formDamageBonus) : undefined,
      damageType: formDamageType !== NONE ? (formDamageType as DamageType) : undefined,
      isStackable: formStackable,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  /* ---- Header ---- */
  const header = (
    <div className={s.header}>
      <div>
        <div className="ao-overline">{t('adm.itemTpl.overline')}</div>
        <h3 className={cn('ao-h3', s.titleH3)}>{t('adm.itemTpl.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>{t('adm.itemTpl.subtitle')}</p>
      </div>
      <div className={s.headerActions}>
        <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
          <Rune kind="plus" size={11} /> {t('adm.itemTpl.inscribeNew')}
        </button>
        <OrdoChip tone="ember" glyph="lock">{t('adm.shared.inquisitorPrivileges')}</OrdoChip>
      </div>
    </div>
  );

  /* ---- Loading ---- */
  if (isLoading) {
    return (
      <div>
        {header}
        <div className={cn('ao-rgrid', s.grid)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phW40H12)} />
              <div className={cn('ao-ph', s.phW70H18)} />
              <div className={cn('ao-ph', s.phW50H14)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error ---- */
  if (error) {
    return (
      <div>
        {header}
        <div className={s.errorBox}>
          <p className={cn('ao-italic', s.errorText)}>{t('adm.itemTpl.errorBody')}</p>
          {isRetryableError(error) && (
            <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    );
  }

  /* ---- Ready ---- */
  return (
    <div>
      {header}

      {!data || data.length === 0 ? (
        <div className={s.emptyBox}>
          <p className={cn('ao-italic', s.emptyText)}>{t('adm.itemTpl.emptyBody')}</p>
        </div>
      ) : (
        <div className={cn('ao-rgrid', s.grid)}>
          {data.map((item) => {
            const c = rarityColor(item.rarity);
            return (
              <OrdoPanel
                key={item.id}
                frame
                padding={0}
                className={s.card}
                style={{ '--c': c } as CSSProperties}
              >
                <div className={s.cardBody}>
                  <div className={s.cardTop}>
                    <div className={s.cardTopMain}>
                      <span className={cn('ao-codex', s.codexId)}>
                        {item.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className={cn('ao-h5', s.cardName)}>{item.name}</div>
                    </div>
                    <div className={s.iconBox}>
                      <Rune kind={item.damageDice ? 'sword' : 'scroll'} size={18} color={c} />
                    </div>
                  </div>

                  {item.description && (
                    <p className={cn('ao-italic', s.cardDesc)}>{item.description}</p>
                  )}

                  <div className={s.chipRow}>
                    <RarityBadge rarity={item.rarity} size="md" />
                    {item.isStackable && (
                      <OrdoChip tone="rune" glyph="square">{t('adm.itemTpl.stackableYes')}</OrdoChip>
                    )}
                  </div>

                  {(item.damageDice || item.damageBonus || item.damageType) && (
                    <div className={s.section}>
                      <DamageBadge dice={item.damageDice} bonus={item.damageBonus} type={item.damageType} />
                    </div>
                  )}

                  {item.sourceHomebrewTitle && (
                    <div className={cn(s.section, s.homebrewLine)}>
                      <Rune kind="scroll" size={10} color="var(--bronze)" />
                      {t('adm.itemTpl.homebrewSource', { title: item.sourceHomebrewTitle })}
                    </div>
                  )}
                </div>

                <div className={s.cardFooter}>
                  <button className={cn('ao-btn ao-btn--sm', s.footerEdit)} onClick={() => handleEdit(item)}>
                    <Rune kind="scroll" size={10} /> {t('adm.shared.edit')}
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="ao-btn ao-btn--sm ao-btn--danger" title={t('adm.itemTpl.unmakeTooltip')}>
                        <Rune kind="x" size={10} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('adm.itemTpl.unmakeTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('adm.itemTpl.unmakeDescription')}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('adm.shared.withhold')}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteMutation.mutate(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {t('adm.shared.unmake')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </OrdoPanel>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('adm.itemTpl.dialogEdit') : t('adm.itemTpl.dialogCreate')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.itemTpl.namePlaceholder')}
                maxLength={100}
              />
            </OrdoField>

            <OrdoField label={t('adm.shared.fieldDescription')}>
              <textarea
                className={cn('ao-input', s.descArea)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.itemTpl.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>

            <OrdoField label={t('adm.itemTpl.rarityLabel')} required>
              <Select value={formRarity} onValueChange={setFormRarity}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.itemTpl.selectRarity')} />
                </SelectTrigger>
                <SelectContent>
                  {RARITY_ORDER.map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(rarityLabelKey(key))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label={t('adm.itemTpl.damageDiceLabel')} hint={t('adm.itemTpl.damageDiceHint')}>
              <input
                className="ao-input"
                value={formDamageDice}
                onChange={(e) => setFormDamageDice(e.target.value)}
                placeholder={t('adm.itemTpl.damageDicePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.itemTpl.damageBonusLabel')}>
              <input
                className="ao-input"
                type="number"
                value={formDamageBonus}
                onChange={(e) => setFormDamageBonus(e.target.value)}
                placeholder={t('adm.itemTpl.damageBonusPlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.itemTpl.damageTypeLabel')}>
              <Select value={formDamageType} onValueChange={setFormDamageType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.itemTpl.selectDamageType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t('adm.itemTpl.none')}</SelectItem>
                  {DAMAGE_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <label className={s.checkRow}>
              <input
                type="checkbox"
                checked={formStackable}
                onChange={(e) => setFormStackable(e.target.checked)}
              />
              <span className={s.checkText}>
                <span className={s.checkLabel}>{t('adm.itemTpl.stackableLabel')}</span>
                <span className={s.checkHint}>{t('adm.itemTpl.stackableHint')}</span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setDialogOpen(false)} disabled={busy}>
              {t('adm.shared.withhold')}
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName.trim() || busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('adm.shared.seal')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
