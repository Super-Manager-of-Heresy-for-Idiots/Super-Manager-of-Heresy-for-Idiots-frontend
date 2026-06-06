import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Rune, OrdoPanel, OrdoField, OrdoChip, PanelHeader } from '@/components/ordo';
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

const EFFECT_TYPES = [
  'STAT_MODIFIER',
  'CONDITION',
  'DAMAGE_OVER_TIME',
  'HEAL_OVER_TIME',
  'IMMUNITY',
  'VULNERABILITY',
] as const;

type FilterTab = 'ALL' | 'BUFF' | 'DEBUFF';

const GRID_COLS = '1.4fr 120px 1fr 1fr 150px 90px';

/* ---------- inline sub-components ---------- */

function BuffBadge({ isBuff }: { isBuff: boolean }) {
  const t = useT();
  const c = isBuff ? '#7a9866' : '#c0584a';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 7px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${c}66`,
        borderLeft: `2px solid ${c}`,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.18em',
        color: c,
        textTransform: 'uppercase',
      }}
    >
      <Rune kind={isBuff ? 'arrow-up' : 'tri-inv'} size={9} color={c} />
      {isBuff ? t('adm.buffs.buff') : t('adm.buffs.debuff')}
    </span>
  );
}

function EffectTypeBadge({ type }: { type: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 8px',
        background: 'var(--abyss)',
        border: '1px solid var(--hairline)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.06em',
        color: 'var(--ink-quiet)',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 4,
          height: 4,
          background: 'var(--bronze)',
          transform: 'rotate(45deg)',
        }}
      />
      {type.replace(/_/g, ' ')}
    </span>
  );
}

function DurationDisplay({ rounds }: { rounds?: number | null }) {
  const t = useT();
  const isPermanent = rounds == null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: isPermanent ? 'var(--gold-pale)' : 'var(--ink-quiet)',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
      }}
    >
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 7px',
        background: pos
          ? 'rgba(122,152,102,0.08)'
          : 'rgba(179,70,26,0.08)',
        border: `1px solid ${c}55`,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: c,
      }}
    >
      <Rune kind={pos ? 'arrow-up' : 'minus'} size={8} color={c} />
      {stat && (
        <span style={{ letterSpacing: '0.08em', color: 'var(--ink)' }}>
          {stat}
        </span>
      )}
      <span style={{ color: c, fontWeight: 600 }}>
        {pos ? `+${value}` : value}
      </span>
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
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="ao-overline">{t('adm.buffs.overline')}</div>
            <div className="ao-h3" style={{ marginTop: 4 }}>{t('adm.buffs.title')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
          ))}
        </div>
      </div>
    );
  }

  /* ---------- error state ---------- */
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
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
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        {/* Left: overline + title */}
        <div>
          <div className="ao-overline">{t('adm.buffs.overline')}</div>
          <div className="ao-h3" style={{ marginTop: 4 }}>{t('adm.buffs.title')}</div>
        </div>

        {/* Right: tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {tabs.map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                className="ao-tab"
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '10px 20px',
                  background: active ? 'var(--panel)' : 'transparent',
                  color: active ? tab.accent : 'var(--ink-quiet)',
                  borderBottom: active ? `2px solid ${tab.accent}` : '2px solid transparent',
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: 2,
                  borderBottomColor: active ? tab.accent : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {tab.label}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '1px 6px',
                    background: active ? `${tab.accent}22` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? `${tab.accent}44` : 'var(--hairline)'}`,
                    color: active ? tab.accent : 'var(--ink-faint)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginBottom: 18 }}>
        <OrdoChip tone="ember" glyph="lock">{t('adm.shared.inquisitorPrivileges')}</OrdoChip>
        <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
          <Rune kind="plus" size={11} /> {t('adm.buffs.inscribeNew')}
        </button>
      </div>

      {/* Data panel */}
      {filteredData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
            {t('adm.buffs.emptyBody')}
          </p>
        </div>
      ) : (
        <OrdoPanel frame padding={0}>
          {/* Grid header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLS,
              padding: '10px 16px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <span className="ao-overline" style={{ fontSize: 9 }}>{t('adm.buffs.colEffect')}</span>
            <span className="ao-overline" style={{ fontSize: 9 }}>{t('adm.buffs.colNature')}</span>
            <span className="ao-overline" style={{ fontSize: 9 }}>{t('adm.buffs.colType')}</span>
            <span className="ao-overline" style={{ fontSize: 9 }}>{t('adm.buffs.colModifier')}</span>
            <span className="ao-overline" style={{ fontSize: 9 }}>{t('adm.buffs.colDuration')}</span>
            <span />
          </div>

          {/* Rows */}
          {filteredData.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'grid',
                gridTemplateColumns: GRID_COLS,
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--hairline)',
              }}
            >
              {/* Effect */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--ink-bright)',
                    lineHeight: 1.3,
                  }}
                >
                  {item.name}
                </div>
                <div
                  className="ao-codex"
                  style={{ fontSize: 9, color: 'var(--ink-faint)', marginTop: 2 }}
                >
                  {item.id.slice(0, 8).toUpperCase()}
                </div>
                {item.description && (
                  <div
                    className="ao-italic"
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-quiet)',
                      marginTop: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
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
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      color: 'var(--ink-ghost)',
                    }}
                  >
                    &mdash;
                  </span>
                )}
              </div>

              {/* Duration */}
              <div>
                <DurationDisplay rounds={item.durationRounds} />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button
                  className="ao-iconbtn"
                  style={{ width: 26, height: 26 }}
                  onClick={() => handleEdit(item)}
                  title={t('adm.buffs.editTooltip')}
                >
                  <Rune kind="scroll" size={11} color="var(--gold)" />
                </button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className="ao-iconbtn"
                      style={{ width: 26, height: 26, color: '#d8896a' }}
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderTop: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('adm.buffs.descriptionPlaceholder')}
                rows={3}
                style={{ resize: 'vertical' }}
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
