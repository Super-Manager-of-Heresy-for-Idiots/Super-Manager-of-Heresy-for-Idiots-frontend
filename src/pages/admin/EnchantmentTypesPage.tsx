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
  useAdminEnchantmentTypes,
  useCreateEnchantmentType,
  useUpdateEnchantmentType,
  useDeleteEnchantmentType,
  useBuffsDebuffs,
} from '@/hooks/useAdmin';
import type { EnchantmentTypeResponse, CreateEnchantmentTypeRequest, DamageType } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import s from './EnchantmentTypesPage.module.css';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAMAGE_TYPES: DamageType[] = [
  'ACID', 'BLUDGEONING', 'COLD', 'FIRE', 'FORCE', 'LIGHTNING',
  'NECROTIC', 'PIERCING', 'POISON', 'PSYCHIC', 'RADIANT', 'SLASHING', 'THUNDER',
];

const DAMAGE_TYPE_COLORS: Record<string, string> = {
  ACID:        '#7a9866',
  BLUDGEONING: '#968c75',
  COLD:        '#7fa8c4',
  FIRE:        '#c06a32',
  FORCE:       '#b9a8d0',
  LIGHTNING:   '#86c0c8',
  NECROTIC:    '#7d6a86',
  PIERCING:    '#9a9078',
  POISON:      '#6f9a5e',
  PSYCHIC:     '#c47ea8',
  RADIANT:     '#d4b478',
  SLASHING:    '#a39378',
  THUNDER:     '#9a7ec0',
};

function damageColor(type?: string): string {
  if (!type) return 'var(--gold)';
  return DAMAGE_TYPE_COLORS[type] || 'var(--gold)';
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function DamageBadge({
  dice,
  bonus,
  type,
  glow = false,
}: {
  dice?: string;
  bonus?: number;
  type?: string;
  glow?: boolean;
}) {
  if (!dice && !bonus && !type) return null;
  const c = damageColor(type);
  return (
    <span className={cn(s.damageBadge, glow && s.glow)} style={{ '--c': c } as CSSProperties}>
      <Rune kind="diamond-fill" size={7} color={c} />
      <span className={s.damageValue}>
        {dice}{bonus ? `+${bonus}` : ''}
      </span>
      {type && (
        <span className={s.damageType}>{type}</span>
      )}
    </span>
  );
}

function LinkedEffectBadge({
  link,
}: {
  link?: { name: string; isBuff: boolean } | null;
}) {
  const t = useT();
  if (!link) {
    return (
      <span className={cn('ao-codex', s.noLink)}>
        {t('adm.ench.noLinkedEffect')}
      </span>
    );
  }
  const c = link.isBuff ? '#7a9866' : '#c0584a';
  return (
    <span className={s.linkWrap}>
      <Rune kind="arrow-r" size={11} color="var(--bronze)" />
      <span className={s.linkName}>{link.name}</span>
      <span className={s.linkTag} style={{ '--c': c } as CSSProperties}>
        {link.isBuff ? t('adm.ench.buff') : t('adm.ench.debuff')}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function EnchantmentTypesPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useAdminEnchantmentTypes();
  const { data: buffsDebuffs } = useBuffsDebuffs();
  const createMutation = useCreateEnchantmentType();
  const updateMutation = useUpdateEnchantmentType();
  const deleteMutation = useDeleteEnchantmentType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EnchantmentTypeResponse | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDamageDice, setFormDamageDice] = useState('');
  const [formDamageBonus, setFormDamageBonus] = useState('');
  const [formDamageType, setFormDamageType] = useState('');
  const [formBuffDebuffId, setFormBuffDebuffId] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormDamageDice('');
    setFormDamageBonus('');
    setFormDamageType('');
    setFormBuffDebuffId('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: EnchantmentTypeResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormDamageDice(item.damageDice || '');
    setFormDamageBonus(item.damageBonus != null ? String(item.damageBonus) : '');
    setFormDamageType(item.damageType || '');
    setFormBuffDebuffId(item.buffDebuff?.id || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: CreateEnchantmentTypeRequest = {
      name: formName,
      description: formDescription || undefined,
      damageDice: formDamageDice || undefined,
      damageBonus: formDamageBonus ? Number(formDamageBonus) : undefined,
      damageType: formDamageType || undefined,
      buffDebuffId: formBuffDebuffId || undefined,
    };

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    }
  };

  /* ---- Header (shared across loading / error / ready) ---- */

  const header = (
    <div className={s.header}>
      <div>
        <div className="ao-overline">{t('adm.ench.overline')}</div>
        <h3 className={cn('ao-h3', s.titleH3)}>{t('adm.ench.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {t('adm.ench.subtitle')}
        </p>
      </div>
      <div className={s.headerActions}>
        <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
          <Rune kind="plus" size={11} /> {t('adm.ench.inscribeNew')}
        </button>
        <OrdoChip tone="ember" glyph="lock">{t('adm.shared.inquisitorPrivileges')}</OrdoChip>
      </div>
    </div>
  );

  /* ---- Loading state ---- */

  if (isLoading) {
    return (
      <div>
        {header}
        <div className={cn('ao-rgrid', s.grid)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}
            >
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

  /* ---- Error state ---- */

  if (error) {
    return (
      <div>
        {header}
        <div className={s.errorBox}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('adm.ench.errorBody')}
          </p>
          {isRetryableError(error) && (
            <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    );
  }

  /* ---- Ready state ---- */

  return (
    <div>
      {header}

      {/* Card Grid */}
      {!data || data.length === 0 ? (
        <div className={s.emptyBox}>
          <p className={cn('ao-italic', s.emptyText)}>
            {t('adm.ench.emptyBody')}
          </p>
        </div>
      ) : (
        <div className={cn('ao-rgrid', s.grid)}>
          {data.map((item) => {
            const c = damageColor(item.damageType);

            return (
              <OrdoPanel
                key={item.id}
                frame
                padding={0}
                className={s.card}
                style={{ '--c': c } as CSSProperties}
              >
                {/* Card body */}
                <div className={s.cardBody}>
                  {/* Top row: codex-id + name | icon box */}
                  <div className={s.cardTop}>
                    <div>
                      <span className={cn('ao-codex', s.codexId)}>
                        {item.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div className={cn('ao-h5', s.cardName)}>
                        {item.name}
                      </div>
                    </div>

                    {/* Flame rune icon box */}
                    <div className={s.iconBox}>
                      <Rune kind="flame" size={18} color={c} />
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className={cn('ao-italic', s.cardDesc)}>
                      {item.description}
                    </p>
                  )}

                  {/* Damage Badge */}
                  {(item.damageDice || item.damageBonus || item.damageType) && (
                    <div className={s.section}>
                      <DamageBadge
                        dice={item.damageDice}
                        bonus={item.damageBonus}
                        type={item.damageType}
                        glow
                      />
                    </div>
                  )}

                  {/* Linked Effect */}
                  <div className={s.section}>
                    <span className={cn('ao-overline', s.linkedLabel)}>
                      {t('adm.ench.linkedEffect')}
                    </span>
                    <LinkedEffectBadge
                      link={
                        item.buffDebuff
                          ? { name: item.buffDebuff.name, isBuff: item.buffDebuff.isBuff }
                          : null
                      }
                    />
                  </div>
                </div>

                {/* Card footer */}
                <div className={s.cardFooter}>
                  <button
                    className={cn('ao-btn ao-btn--sm', s.footerEdit)}
                    onClick={() => handleEdit(item)}
                  >
                    <Rune kind="scroll" size={10} /> {t('adm.shared.edit')}
                  </button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="ao-btn ao-btn--sm ao-btn--danger"
                        title={t('adm.ench.unmakeTooltip')}
                      >
                        <Rune kind="x" size={10} />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('adm.ench.unmakeTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('adm.ench.unmakeDescription')}
                        </AlertDialogDescription>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('adm.ench.dialogEdit') : t('adm.ench.dialogCreate')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.ench.namePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.shared.fieldDescription')}>
              <textarea
                className={cn('ao-input', s.descArea)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.ench.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>

            <OrdoField label={t('adm.ench.damageDiceLabel')} hint={t('adm.ench.damageDiceHint')}>
              <input
                className="ao-input"
                value={formDamageDice}
                onChange={(e) => setFormDamageDice(e.target.value)}
                placeholder={t('adm.ench.damageDicePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.ench.damageBonusLabel')}>
              <input
                className="ao-input"
                type="number"
                value={formDamageBonus}
                onChange={(e) => setFormDamageBonus(e.target.value)}
                placeholder={t('adm.ench.damageBonusPlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.ench.damageTypeLabel')}>
              <Select value={formDamageType} onValueChange={setFormDamageType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.ench.selectDamageType')} />
                </SelectTrigger>
                <SelectContent>
                  {DAMAGE_TYPES.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {dt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <OrdoField label={t('adm.ench.linkedLabel')} hint={t('adm.ench.linkedHint')}>
              <Select value={formBuffDebuffId} onValueChange={setFormBuffDebuffId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.ench.selectEffect')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('adm.ench.none')}</SelectItem>
                  {(buffsDebuffs || []).map((bd) => (
                    <SelectItem key={bd.id} value={bd.id}>
                      {t('adm.ench.optionNamed', { name: bd.name, kind: bd.isBuff ? t('adm.ench.blessing') : t('adm.ench.curse') })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {t('adm.shared.withhold')}
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('adm.shared.seal')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
