import { useState, useMemo } from 'react';
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
  useBuffsDebuffs,
  useCreateBuffDebuff,
  useUpdateBuffDebuff,
  useDeleteBuffDebuff,
  useStatTypes,
} from '@/hooks/useAdmin';
import type { BuffDebuffResponse, CreateBuffDebuffRequest } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './BuffsDebuffsPage.module.css';

const EFFECT_TYPES = [
  'STAT_MODIFIER',
  'CONDITION',
  'DAMAGE_OVER_TIME',
  'HEAL_OVER_TIME',
  'IMMUNITY',
  'VULNERABILITY',
] as const;

type FilterTab = 'ALL' | 'BUFF' | 'DEBUFF';

/* ---------- inline sub-components ---------- */

function BuffBadge({ isBuff }: { isBuff: boolean }) {
  const t = useT();
  const c = isBuff ? '#7a9866' : '#c0584a';
  return (
    <span className={s.buffBadge} style={{ '--c': c } as CSSProperties}>
      <Rune kind={isBuff ? 'arrow-up' : 'tri-inv'} size={9} color={c} />
      {isBuff ? t('adm.buffs.buff') : t('adm.buffs.debuff')}
    </span>
  );
}

function EffectTypeBadge({ type }: { type: string }) {
  return (
    <span className={s.effectTypeBadge}>
      <span className={s.effectDot} />
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function DurationDisplay({ rounds }: { rounds?: number | null }) {
  const t = useT();
  const isPermanent = rounds == null;
  return (
    <span className={cn(s.duration, isPermanent && s.permanent)}>
      <Rune
        kind={isPermanent ? 'cir' : 'hex'}
        size={11}
        color={isPermanent ? 'var(--gold-pale)' : 'var(--bronze)'}
      />
      {isPermanent ? t('adm.buffs.permanent') : t('adm.buffs.rounds', { rounds: rounds as number })}
    </span>
  );
}

function ModifierTag({
  value,
  stat,
}: {
  value: number;
  stat?: string | null;
}) {
  const pos = value >= 0;
  const c = pos ? '#7a9866' : '#d8896a';
  return (
    <span
      className={cn(s.modTag, pos ? s.pos : s.neg)}
      style={{ '--c': c } as CSSProperties}
    >
      <Rune kind={pos ? 'arrow-up' : 'minus'} size={8} color={c} />
      {stat && <span className={s.modStat}>{stat}</span>}
      <span className={s.modValue}>{pos ? `+${value}` : value}</span>
    </span>
  );
}

/* ---------- page component ---------- */

export default function BuffsDebuffsPage() {
  const t = useT();
  const { data, isLoading, error, refetch } = useBuffsDebuffs();
  const { data: statTypes } = useStatTypes();
  const createMutation = useCreateBuffDebuff();
  const updateMutation = useUpdateBuffDebuff();
  const deleteMutation = useDeleteBuffDebuff();

  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BuffDebuffResponse | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEffectType, setFormEffectType] = useState<string>('STAT_MODIFIER');
  const [formTargetStatId, setFormTargetStatId] = useState('');
  const [formModifierValue, setFormModifierValue] = useState('');
  const [formDurationRounds, setFormDurationRounds] = useState('');
  const [formIsBuff, setFormIsBuff] = useState('true');

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (filter === 'BUFF') return data.filter((d) => d.isBuff);
    if (filter === 'DEBUFF') return data.filter((d) => !d.isBuff);
    return data;
  }, [data, filter]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, buff: 0, debuff: 0 };
    return {
      all: data.length,
      buff: data.filter((d) => d.isBuff).length,
      debuff: data.filter((d) => !d.isBuff).length,
    };
  }, [data]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormEffectType('STAT_MODIFIER');
    setFormTargetStatId('');
    setFormModifierValue('');
    setFormDurationRounds('');
    setFormIsBuff('true');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: BuffDebuffResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setFormEffectType(item.effectType);
    setFormTargetStatId(item.targetStatId || '');
    setFormModifierValue(item.modifierValue != null ? String(item.modifierValue) : '');
    setFormDurationRounds(item.durationRounds != null ? String(item.durationRounds) : '');
    setFormIsBuff(item.isBuff ? 'true' : 'false');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload: CreateBuffDebuffRequest = {
      name: formName,
      description: formDescription || undefined,
      effectType: formEffectType,
      targetStatId: formEffectType === 'STAT_MODIFIER' && formTargetStatId ? formTargetStatId : undefined,
      modifierValue: formModifierValue ? Number(formModifierValue) : undefined,
      durationRounds: formDurationRounds ? Number(formDurationRounds) : undefined,
      isBuff: formIsBuff === 'true',
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

  /* ---------- loading state ---------- */
  if (isLoading) {
    return (
      <div>
        <div className={s.header}>
          <div>
            <div className="ao-overline">{t('adm.buffs.overline')}</div>
            <div className={cn('ao-h3', s.titleH3)}>{t('adm.buffs.title')}</div>
          </div>
        </div>
        <div className={s.skelCol}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn('ao-ph', s.skelRow)} />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- error state ---------- */
  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('adm.buffs.errorBody')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  /* ---------- tab config ---------- */
  const tabs: { key: FilterTab; label: string; count: number; accent: string }[] = [
    { key: 'ALL', label: t('adm.buffs.tabAll'), count: counts.all, accent: 'var(--gold)' },
    { key: 'BUFF', label: t('adm.buffs.tabBuffs'), count: counts.buff, accent: '#7a9866' },
    { key: 'DEBUFF', label: t('adm.buffs.tabDebuffs'), count: counts.debuff, accent: '#c0584a' },
  ];

  return (
    <div>
      {/* Header row */}
      <div className={s.header}>
        {/* Left: overline + title */}
        <div>
          <div className="ao-overline">{t('adm.buffs.overline')}</div>
          <div className={cn('ao-h3', s.titleH3)}>{t('adm.buffs.title')}</div>
        </div>

        {/* Right: tabs */}
        <div className={s.tabRow}>
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                className={cn('ao-tab', s.tab, active && s.active)}
                onClick={() => setFilter(tab.key)}
                style={{ '--c': tab.accent } as CSSProperties}
              >
                {tab.label}
                <span className={s.tabCount}>{tab.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action row */}
      <div className={s.actionRow}>
        <OrdoChip tone="ember" glyph="lock">{t('adm.shared.inquisitorPrivileges')}</OrdoChip>
        <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
          <Rune kind="plus" size={11} /> {t('adm.buffs.inscribeNew')}
        </button>
      </div>

      {/* Data panel */}
      {filteredData.length === 0 ? (
        <div className={s.emptyBox}>
          <p className={cn('ao-italic', s.emptyText)}>
            {t('adm.buffs.emptyBody')}
          </p>
        </div>
      ) : (
        <OrdoPanel frame padding={0}>
          {/* Grid header */}
          <div className={cn('ao-rgrid', s.gridHead)}>
            <span className={cn('ao-overline', s.colHead)}>{t('adm.buffs.colEffect')}</span>
            <span className={cn('ao-overline', s.colHead)}>{t('adm.buffs.colNature')}</span>
            <span className={cn('ao-overline', s.colHead)}>{t('adm.buffs.colType')}</span>
            <span className={cn('ao-overline', s.colHead)}>{t('adm.buffs.colModifier')}</span>
            <span className={cn('ao-overline', s.colHead)}>{t('adm.buffs.colDuration')}</span>
            <span />
          </div>

          {/* Rows */}
          {filteredData.map((item) => (
            <div key={item.id} className={cn('ao-rgrid', s.gridRow)}>
              {/* Effect */}
              <div className={s.effectCell}>
                <div className={s.effectName}>{item.name}</div>
                <div className={cn('ao-codex', s.effectId)}>
                  {item.id.slice(0, 8).toUpperCase()}
                </div>
                {item.description && (
                  <div className={cn('ao-italic', s.effectDesc)}>
                    {item.description}
                  </div>
                )}
              </div>

              {/* Nature */}
              <div>
                <BuffBadge isBuff={item.isBuff} />
              </div>

              {/* Type */}
              <div>
                <EffectTypeBadge type={item.effectType} />
              </div>

              {/* Modifier */}
              <div>
                {item.modifierValue != null ? (
                  <ModifierTag
                    value={item.modifierValue}
                    stat={item.targetStatName}
                  />
                ) : (
                  <span className={s.modEmpty}>&mdash;</span>
                )}
              </div>

              {/* Duration */}
              <div>
                <DurationDisplay rounds={item.durationRounds} />
              </div>

              {/* Actions */}
              <div className={s.actions}>
                <button
                  className={cn('ao-iconbtn', s.iconBtn)}
                  onClick={() => handleEdit(item)}
                  title={t('adm.buffs.editTooltip')}
                >
                  <Rune kind="scroll" size={11} color="var(--gold)" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className={cn('ao-iconbtn', s.iconDanger)}
                      title={t('adm.buffs.unmakeTooltip')}
                    >
                      <Rune kind="x" size={11} color="var(--ember)" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('adm.buffs.unmakeTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('adm.buffs.unmakeDescription')}
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
            </div>
          ))}

          {/* Footer */}
          <div className={s.footer}>
            <span className="ao-codex">
              {t('adm.buffs.countOf', { filtered: filteredData.length, total: data?.length || 0 })}
            </span>
            <span className="ao-codex">{t('adm.shared.sortedByName')}</span>
          </div>
        </OrdoPanel>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t('adm.buffs.dialogEdit') : t('adm.buffs.dialogCreate')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('adm.shared.fieldName')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('adm.buffs.namePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.shared.fieldDescription')}>
              <textarea
                className={cn('ao-input', s.descArea)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.buffs.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>

            <OrdoField label={t('adm.buffs.effectTypeLabel')} required>
              <Select value={formEffectType} onValueChange={setFormEffectType}>
                <SelectTrigger>
                  <SelectValue placeholder={t('adm.buffs.selectEffectType')} />
                </SelectTrigger>
                <SelectContent>
                  {EFFECT_TYPES.map((et) => (
                    <SelectItem key={et} value={et}>
                      {et.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            {formEffectType === 'STAT_MODIFIER' && (
              <OrdoField label={t('adm.buffs.targetStatLabel')}>
                <Select value={formTargetStatId} onValueChange={setFormTargetStatId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('adm.buffs.selectStatType')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(statTypes || []).map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </OrdoField>
            )}

            <OrdoField label={t('adm.buffs.modifierValueLabel')}>
              <input
                className="ao-input"
                type="number"
                value={formModifierValue}
                onChange={(e) => setFormModifierValue(e.target.value)}
                placeholder={t('adm.buffs.modifierValuePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.buffs.durationLabel')} hint={t('adm.buffs.durationHint')}>
              <input
                className="ao-input"
                type="number"
                value={formDurationRounds}
                onChange={(e) => setFormDurationRounds(e.target.value)}
                placeholder={t('adm.buffs.durationPlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('adm.buffs.natureLabel')} required>
              <Select value={formIsBuff} onValueChange={setFormIsBuff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('adm.buffs.natureBuff')}</SelectItem>
                  <SelectItem value="false">{t('adm.buffs.natureDebuff')}</SelectItem>
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
