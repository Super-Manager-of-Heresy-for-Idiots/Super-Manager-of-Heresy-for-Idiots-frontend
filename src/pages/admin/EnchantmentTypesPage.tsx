import { useState } from 'react';
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
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 10px',
        background: 'rgba(0,0,0,0.5)',
        border: `1px solid ${c}66`,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: c,
        boxShadow: glow ? `0 0 10px ${c}44` : 'none',
      }}
    >
      <Rune kind="diamond-fill" size={7} color={c} />
      <span style={{ color: 'var(--ink-bright)' }}>
        {dice}{bonus ? `+${bonus}` : ''}
      </span>
      {type && (
        <span style={{ letterSpacing: '0.12em' }}>{type}</span>
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
      <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>
        {t('adm.ench.noLinkedEffect')}
      </span>
    );
  }
  const c = link.isBuff ? '#7a9866' : '#c0584a';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: 'var(--ink-quiet)',
        fontSize: 12,
      }}
    >
      <Rune kind="arrow-r" size={11} color="var(--bronze)" />
      <span style={{ color: 'var(--ink)' }}>{link.name}</span>
      <span
        style={{
          padding: '1px 6px',
          border: `1px solid ${c}66`,
          color: c,
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          letterSpacing: '0.1em',
        }}
      >
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
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}
    >
      <div>
        <div className="ao-overline">{t('adm.ench.overline')}</div>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('adm.ench.title')}</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
          {t('adm.ench.subtitle')}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
          <Rune kind="plus" size={11} /> {t('adm.ench.inscribeNew')}
        </button>
        <OrdoChip tone="ember" glyph="lock">{t('adm.shared.inquisitorPrivileges')}</OrdoChip>
      </div>nr
    </div>
  );

  /* ---- Loading state ---- */

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="ao-panel ao-frame ao-breathe"
              style={{ padding: 24, minHeight: 160 }}
            >
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '40%', height: 12, marginBottom: 10 }} />
              <div className="ao-ph" style={{ width: '70%', height: 18, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '50%', height: 14 }} />
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
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
            {t('adm.ench.errorBody')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
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
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
            {t('adm.ench.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {data.map((item) => {
            const c = damageColor(item.damageType);

            return (
              <OrdoPanel
                key={item.id}
                frame
                padding={0}
                style={{
                  position: 'relative',
                  borderColor: `${c}55`,
                  boxShadow: `var(--shadow-inset), var(--shadow-low), 0 0 18px ${c}14`,
                }}
              >
                {/* Card body */}
                <div style={{ padding: 18 }}>
                  {/* Top row: codex-id + name | icon box */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <span
                        className="ao-codex"
                        style={{
                          color: 'var(--ink-ghost)',
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {item.id.slice(0, 8).toUpperCase()}
                      </span>
                      <div
                        className="ao-h5"
                        style={{
                          marginTop: 4,
                          color: 'var(--ink-bright)',
                          textShadow: `0 0 16px ${c}66`,
                        }}
                      >
                        {item.name}
                      </div>
                    </div>

                    {/* Flame rune icon box */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        border: `1px solid ${c}`,
                        background: 'var(--abyss)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `inset 0 0 12px ${c}33`,
                      }}
                    >
                      <Rune kind="flame" size={18} color={c} />
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p
                      className="ao-italic"
                      style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 10 }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Damage Badge */}
                  {(item.damageDice || item.damageBonus || item.damageType) && (
                    <div style={{ marginTop: 12 }}>
                      <DamageBadge
                        dice={item.damageDice}
                        bonus={item.damageBonus}
                        type={item.damageType}
                        glow
                      />
                    </div>
                  )}

                  {/* Linked Effect */}
                  <div style={{ marginTop: 12 }}>
                    <span
                      className="ao-overline"
                      style={{ fontSize: 9, color: 'var(--brass)', display: 'block', marginBottom: 4 }}
                    >
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
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    padding: '12px 18px',
                    borderTop: '1px solid var(--hairline)',
                    background: 'var(--abyss)',
                  }}
                >
                  <button
                    className="ao-btn ao-btn--sm"
                    style={{ flex: 1 }}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.ench.descriptionPlaceholder')}
                rows={3}
                style={{ resize: 'vertical' }}
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
