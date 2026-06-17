import { useMemo, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RewardGroupView } from '@/components/content-rewards/RewardGroupRenderer';
import { cn } from '@/lib/utils';
import { classAuthoringApi, type AuthoringScope } from '@/api/classAuthoring.api';
import {
  CASTER_PROGRESSIONS,
  GROUP_KINDS,
  HIT_DICE,
  PREPARATIONS,
  buildClassWriteRequest,
  defaultGrantPayload,
  emptyDraft,
  emptyGroup,
  emptyOption,
  hasBlockingErrors,
  issuesAt,
  newKey,
  validateClassDraft,
  type ClassDraft,
} from './classDraft';
import { MODIFIER_KEYS, useBuilderRefData, type RefOption } from './refData';
import { draftToRewardGroups, type PreviewCtx } from './draftPreview';
import type {
  AuthoringValidationIssue,
  GrantInput,
  GrantPayload,
  RewardGroupInput,
  RewardOptionInput,
} from '@/types';
import { KNOWN_GRANT_TYPES } from '@/types';
import s from './ClassBuilderModal.module.css';

type Tab = 'identity' | 'mechanics' | 'proficiency' | 'features' | 'rewards' | 'review';
const TABS: { id: Tab; label: string }[] = [
  { id: 'identity', label: 'Идентичность' },
  { id: 'mechanics', label: 'Механики' },
  { id: 'proficiency', label: 'Владения' },
  { id: 'features', label: 'Умения' },
  { id: 'rewards', label: 'Награды' },
  { id: 'review', label: 'Обзор' },
];

export interface ClassBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: AuthoringScope;
  /** Existing class id + etag for update; omit for create. */
  editId?: string;
  etag?: string;
  /** Initial draft for edit (caller adapts ContentClassDetailResponse). */
  initialDraft?: ClassDraft;
  onSaved?: () => void;
}

export function ClassBuilderModal({
  open,
  onOpenChange,
  scope,
  editId,
  etag,
  initialDraft,
  onSaved,
}: ClassBuilderModalProps) {
  const queryClient = useQueryClient();
  const ref = useBuilderRefData();
  const [tab, setTab] = useState<Tab>('identity');
  const [draft, setDraft] = useState<ClassDraft>(() => initialDraft ?? emptyDraft());
  const [saving, setSaving] = useState(false);

  const issues = useMemo(() => validateClassDraft(draft), [draft]);
  const blocking = hasBlockingErrors(issues);

  const previewCtx: PreviewCtx = {
    abilities: ref.abilities,
    skills: ref.skills,
    feats: ref.feats,
    spells: ref.spells,
    subclasses: draft.subclasses ?? [],
    features: draft.features,
  };

  const patch = (p: Partial<ClassDraft>) => setDraft((d) => ({ ...d, ...p }));
  const setGroups = (rewardGroups: RewardGroupInput[]) => patch({ rewardGroups });

  const handleSave = async () => {
    if (blocking) {
      toast.error('Исправь ошибки перед сохранением.');
      return;
    }
    setSaving(true);
    try {
      const body = buildClassWriteRequest(draft);
      const res = editId
        ? await classAuthoringApi.update(scope, editId, body, etag)
        : await classAuthoringApi.create(scope, body);
      if (!res.data) throw new Error('Пустой ответ сервера');
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      queryClient.invalidateQueries({ queryKey: ['reference', 'classes'] });
      if (scope.kind === 'homebrew') {
        queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
        queryClient.invalidateQueries({ queryKey: ['homebrew-my', scope.packageId] });
      }
      if (res.data.warnings?.length) toast.success(`Сохранено с предупреждениями (${res.data.warnings.length}).`);
      else toast.success(editId ? 'Класс обновлён.' : 'Класс создан.');
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить класс.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-[96vw] h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <DialogTitle>
            {editId ? 'Редактирование класса' : 'Новый класс'}{' '}
            <span className={cn('ao-codex', s.muted)}>
              · {scope.kind === 'admin' ? 'core' : 'homebrew'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className={s.tabs}>
          {TABS.map((tdef) => (
            <button
              key={tdef.id}
              className={cn('ao-tab', tab === tdef.id && 'is-active')}
              onClick={() => setTab(tdef.id)}
            >
              {tdef.label}
            </button>
          ))}
        </div>

        <div className={s.body}>
          {tab === 'identity' && <IdentityTab draft={draft} patch={patch} />}
          {tab === 'mechanics' && <MechanicsTab draft={draft} patch={patch} ref={ref} />}
          {tab === 'proficiency' && <ProficiencyTab draft={draft} patch={patch} />}
          {tab === 'features' && <FeaturesTab draft={draft} patch={patch} />}
          {tab === 'rewards' && (
            <RewardsTab draft={draft} setGroups={setGroups} issues={issues} ref={ref} />
          )}
          {tab === 'review' && (
            <ReviewTab draft={draft} issues={issues} previewCtx={previewCtx} />
          )}
        </div>

        <div className={s.footer}>
          <span className={cn('ao-codex', s.muted)}>
            {blocking ? `Ошибок: ${issues.filter((i) => i.severity === 'ERROR').length}` : 'Готово к сохранению'}
          </span>
          <div className="ao-row ao-gap-8">
            <button className="ao-btn ao-btn--ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Отмена
            </button>
            <button className="ao-btn ao-btn--primary" onClick={handleSave} disabled={saving || blocking}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Сохранить
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Small controls ──────────────────────────────────────────
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className={s.field}>
      <span className="ao-label">{label}</span>
      {children}
    </label>
  );
}

function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'добавить…',
}: {
  options: RefOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const remaining = options.filter((o) => !selected.includes(o.id));
  return (
    <div className="ao-col ao-gap-4">
      {selected.length > 0 && (
        <div className={s.chips}>
          {selected.map((id) => {
            const opt = options.find((o) => o.id === id);
            return (
              <span key={id} className={s.chip}>
                {opt?.name ?? id}
                <span className={s.chipX} onClick={() => onChange(selected.filter((x) => x !== id))}>×</span>
              </span>
            );
          })}
        </div>
      )}
      <select
        className="ao-input"
        value=""
        onChange={(e) => e.target.value && onChange([...selected, e.target.value])}
      >
        <option value="">{placeholder}</option>
        {remaining.map((o) => (
          <option key={o.id} value={o.id}>{o.name}{o.hint ? ` (${o.hint})` : ''}</option>
        ))}
      </select>
    </div>
  );
}

function Badges({ issues }: { issues: AuthoringValidationIssue[] }) {
  if (issues.length === 0) return null;
  const errors = issues.filter((i) => i.severity === 'ERROR').length;
  const warns = issues.length - errors;
  return (
    <div className="ao-row ao-gap-4">
      {errors > 0 && <span className={cn(s.badge, s.badgeErr)}>● {errors}</span>}
      {warns > 0 && <span className={cn(s.badge, s.badgeWarn)}>▲ {warns}</span>}
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────
function IdentityTab({ draft, patch }: { draft: ClassDraft; patch: (p: Partial<ClassDraft>) => void }) {
  return (
    <div className="ao-col ao-gap-12">
      <div className={s.grid2}>
        <Field label="Название*">
          <input className="ao-input" value={draft.name} maxLength={80} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="Slug">
          <input className="ao-input" value={draft.slug ?? ''} onChange={(e) => patch({ slug: e.target.value })} placeholder="генерится из названия" />
        </Field>
        <Field label="Название (RU)">
          <input className="ao-input" value={draft.nameRu ?? ''} onChange={(e) => patch({ nameRu: e.target.value })} />
        </Field>
        <Field label="Название (EN)">
          <input className="ao-input" value={draft.nameEn ?? ''} onChange={(e) => patch({ nameEn: e.target.value })} />
        </Field>
      </div>
      <Field label="Подзаголовок">
        <input className="ao-input" value={draft.subtitle ?? ''} onChange={(e) => patch({ subtitle: e.target.value })} />
      </Field>
      <Field label="Описание">
        <textarea className="ao-input" rows={4} value={draft.description ?? ''} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
    </div>
  );
}

function MechanicsTab({
  draft,
  patch,
  ref,
}: {
  draft: ClassDraft;
  patch: (p: Partial<ClassDraft>) => void;
  ref: ReturnType<typeof useBuilderRefData>;
}) {
  const sc = draft.spellcasting;
  return (
    <div className="ao-col ao-gap-12">
      <div className={s.grid3}>
        <Field label="Hit die">
          <select className="ao-input" value={draft.hitDie} onChange={(e) => patch({ hitDie: Number(e.target.value) })}>
            {HIT_DICE.map((d) => <option key={d} value={d}>d{d}</option>)}
          </select>
        </Field>
        <Field label="Выбор навыков (кол-во)">
          <input className="ao-input" type="number" min={0} value={draft.skillChoiceCount} onChange={(e) => patch({ skillChoiceCount: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="Любой навык">
          <select className="ao-input" value={draft.skillChoiceAny ? 'yes' : 'no'} onChange={(e) => patch({ skillChoiceAny: e.target.value === 'yes' })}>
            <option value="no">из пула</option>
            <option value="yes">любой</option>
          </select>
        </Field>
      </div>
      <Field label="Основные характеристики*">
        <MultiSelect options={ref.abilities} selected={draft.primaryAbilityIds} onChange={(ids) => patch({ primaryAbilityIds: ids })} />
      </Field>
      <Field label="Спасброски">
        <MultiSelect options={ref.abilities} selected={draft.savingThrowIds} onChange={(ids) => patch({ savingThrowIds: ids })} />
      </Field>
      {!draft.skillChoiceAny && (
        <Field label="Пул навыков">
          <MultiSelect options={ref.skills} selected={draft.skillOptionIds} onChange={(ids) => patch({ skillOptionIds: ids })} />
        </Field>
      )}

      <div className="ao-row ao-between">
        <span className="ao-h6">Заклинательство</span>
        <button
          className="ao-btn ao-btn--sm ao-btn--ghost"
          onClick={() => patch({ spellcasting: sc ? null : { casterProgression: 'FULL', spellcastingAbilityId: ref.abilities[0]?.id ?? '', preparation: 'KNOWN', ritualCasting: false } })}
        >
          {sc ? 'Убрать' : 'Сделать заклинателем'}
        </button>
      </div>
      {sc && (
        <div className={s.grid3}>
          <Field label="Прогрессия">
            <input className="ao-input" list="caster-prog" value={sc.casterProgression} onChange={(e) => patch({ spellcasting: { ...sc, casterProgression: e.target.value } })} />
            <datalist id="caster-prog">{CASTER_PROGRESSIONS.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="Базовая характеристика">
            <select className="ao-input" value={sc.spellcastingAbilityId} onChange={(e) => patch({ spellcasting: { ...sc, spellcastingAbilityId: e.target.value } })}>
              <option value="">—</option>
              {ref.abilities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Подготовка">
            <select className="ao-input" value={sc.preparation} onChange={(e) => patch({ spellcasting: { ...sc, preparation: e.target.value } })}>
              {PREPARATIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      )}
    </div>
  );
}

function ProficiencyTab({ draft, patch }: { draft: ClassDraft; patch: (p: Partial<ClassDraft>) => void }) {
  return (
    <div className="ao-col ao-gap-12">
      <Field label="Доспехи"><input className="ao-input" value={draft.armorProficiencyText ?? ''} onChange={(e) => patch({ armorProficiencyText: e.target.value })} /></Field>
      <Field label="Оружие"><input className="ao-input" value={draft.weaponProficiencyText ?? ''} onChange={(e) => patch({ weaponProficiencyText: e.target.value })} /></Field>
      <Field label="Инструменты"><input className="ao-input" value={draft.toolProficiencyText ?? ''} onChange={(e) => patch({ toolProficiencyText: e.target.value })} /></Field>
    </div>
  );
}

function FeaturesTab({ draft, patch }: { draft: ClassDraft; patch: (p: Partial<ClassDraft>) => void }) {
  const features = draft.features;
  const subclasses = draft.subclasses ?? [];
  const addFeature = () => patch({ features: [...features, { key: newKey('feat'), level: 1, sortOrder: features.length, title: '' }] });
  const addSubclass = () => patch({ subclasses: [...subclasses, { key: newKey('sub'), name: '' }] });
  return (
    <div className="ao-col ao-gap-16">
      <div>
        <div className="ao-row ao-between">
          <span className="ao-h6">Умения по уровням</span>
          <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={addFeature}><Plus size={12} /> умение</button>
        </div>
        {features.map((f, i) => (
          <div key={f.id ?? f.key ?? i} className={cn('ao-panel', s.card)}>
            <div className={s.grid3}>
              <Field label="Уровень"><input className="ao-input" type="number" min={1} max={20} value={f.level} onChange={(e) => patch({ features: features.map((x, j) => j === i ? { ...x, level: Number(e.target.value) || 1 } : x) })} /></Field>
              <Field label="Название"><input className="ao-input" value={f.title} onChange={(e) => patch({ features: features.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} /></Field>
              <div className="ao-col ao-justify-end">
                <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={() => patch({ features: features.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
              </div>
            </div>
            <Field label="Описание"><textarea className="ao-input" rows={2} value={f.description ?? ''} onChange={(e) => patch({ features: features.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} /></Field>
          </div>
        ))}
      </div>

      <div>
        <div className="ao-row ao-between">
          <span className="ao-h6">Сабклассы</span>
          <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={addSubclass}><Plus size={12} /> сабкласс</button>
        </div>
        {subclasses.map((sub, i) => (
          <div key={sub.id ?? sub.key ?? i} className={cn('ao-panel', s.card)}>
            <div className={s.grid2}>
              <Field label="Название"><input className="ao-input" value={sub.name} onChange={(e) => patch({ subclasses: subclasses.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} /></Field>
              <div className="ao-col ao-justify-end">
                <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={() => patch({ subclasses: subclasses.filter((_, j) => j !== i) })}><Trash2 size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rewards builder ─────────────────────────────────────────
function RewardsTab({
  draft,
  setGroups,
  issues,
  ref,
}: {
  draft: ClassDraft;
  setGroups: (groups: RewardGroupInput[]) => void;
  issues: AuthoringValidationIssue[];
  ref: ReturnType<typeof useBuilderRefData>;
}) {
  const groups = draft.rewardGroups;
  const add = (kind: 'AUTO' | 'CHOICE') => setGroups([...groups, emptyGroup(1, groups.length, kind)]);
  return (
    <div className="ao-col ao-gap-12">
      <div className="ao-row ao-gap-8">
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={() => add('AUTO')}><Plus size={12} /> авто-группа</button>
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={() => add('CHOICE')}><Plus size={12} /> группа выбора</button>
      </div>
      {groups.length === 0 && <p className={cn('ao-italic', s.muted)}>Нет групп наград. Добавь авто-выдачу или выбор.</p>}
      {groups.map((g, gi) => (
        <GroupEditor
          key={g.id ?? g.key ?? gi}
          group={g}
          path={`rewardGroups[${gi}]`}
          issues={issues}
          refData={ref}
          localRefs={{ subclasses: draft.subclasses ?? [], features: draft.features }}
          onChange={(ng) => setGroups(groups.map((x, j) => j === gi ? ng : x))}
          onRemove={() => setGroups(groups.filter((_, j) => j !== gi))}
        />
      ))}
    </div>
  );
}

interface LocalRefs {
  subclasses: { id?: string; key?: string; name: string }[];
  features: { id?: string; key?: string; title: string }[];
}

function GroupEditor({
  group,
  path,
  issues,
  refData,
  localRefs,
  onChange,
  onRemove,
}: {
  group: RewardGroupInput;
  path: string;
  issues: AuthoringValidationIssue[];
  refData: ReturnType<typeof useBuilderRefData>;
  localRefs: LocalRefs;
  onChange: (g: RewardGroupInput) => void;
  onRemove: () => void;
}) {
  const isChoice = group.groupKind === 'CHOICE';
  const set = (p: Partial<RewardGroupInput>) => onChange({ ...group, ...p });
  const addOption = () => set({ options: [...group.options, emptyOption(group.options.length)] });
  const addGrant = () => set({ grants: [...group.grants, { grantType: 'FEATURE', sortOrder: group.grants.length, payload: defaultGrantPayload('FEATURE') }] });
  return (
    <div className={cn('ao-panel ao-frame', s.card)}>
      <span className="ao-frame-c" />
      <div className={s.cardHead}>
        <div className="ao-row ao-gap-8">
          <select className="ao-input" value={group.groupKind} onChange={(e) => set({ groupKind: e.target.value, chooseMin: e.target.value === 'CHOICE' ? 1 : 0, chooseMax: e.target.value === 'CHOICE' ? 1 : 0 })}>
            {GROUP_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <label className="ao-row ao-gap-4"><span className="ao-codex">ур.</span>
            <input className={cn('ao-input', s.w64)} type="number" min={1} max={20} value={group.classLevel} onChange={(e) => set({ classLevel: Number(e.target.value) || 1 })} />
          </label>
          <Badges issues={issuesAt(issues, path)} />
        </div>
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={onRemove}><Trash2 size={12} /></button>
      </div>

      {isChoice && (
        <div className={s.grid3}>
          <Field label="Вопрос (prompt)"><input className="ao-input" value={group.prompt ?? ''} onChange={(e) => set({ prompt: e.target.value })} /></Field>
          <Field label="chooseMin"><input className="ao-input" type="number" min={0} value={group.chooseMin} onChange={(e) => set({ chooseMin: Number(e.target.value) || 0 })} /></Field>
          <Field label="chooseMax"><input className="ao-input" type="number" min={0} value={group.chooseMax} onChange={(e) => set({ chooseMax: Number(e.target.value) || 0 })} /></Field>
        </div>
      )}

      {/* group-level grants (AUTO) */}
      {!isChoice && (
        <div className="ao-col ao-gap-8">
          <div className="ao-row ao-between"><span className="ao-overline">Гранты</span>
            <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={addGrant}><Plus size={12} /> грант</button>
          </div>
          {group.grants.map((gr, ki) => (
            <GrantEditor
              key={gr.id ?? ki}
              grant={gr}
              path={`${path}.grants[${ki}]`}
              issues={issues}
              refData={refData}
              localRefs={localRefs}
              onChange={(ng) => set({ grants: group.grants.map((x, j) => j === ki ? ng : x) })}
              onRemove={() => set({ grants: group.grants.filter((_, j) => j !== ki) })}
            />
          ))}
        </div>
      )}

      {/* options (CHOICE) */}
      {isChoice && (
        <div className="ao-col ao-gap-8">
          <div className="ao-row ao-between"><span className="ao-overline">Опции</span>
            <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={addOption}><Plus size={12} /> опция</button>
          </div>
          {group.options.map((opt, oi) => (
            <OptionEditor
              key={opt.id ?? opt.key ?? oi}
              option={opt}
              path={`${path}.options[${oi}]`}
              issues={issues}
              refData={refData}
              localRefs={localRefs}
              onChange={(no) => set({ options: group.options.map((x, j) => j === oi ? no : x) })}
              onRemove={() => set({ options: group.options.filter((_, j) => j !== oi) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionEditor({
  option,
  path,
  issues,
  refData,
  localRefs,
  onChange,
  onRemove,
}: {
  option: RewardOptionInput;
  path: string;
  issues: AuthoringValidationIssue[];
  refData: ReturnType<typeof useBuilderRefData>;
  localRefs: LocalRefs;
  onChange: (o: RewardOptionInput) => void;
  onRemove: () => void;
}) {
  const set = (p: Partial<RewardOptionInput>) => onChange({ ...option, ...p });
  const addGrant = () => set({ grants: [...option.grants, { grantType: 'FEATURE', sortOrder: option.grants.length, payload: defaultGrantPayload('FEATURE') }] });
  return (
    <div className={cn('ao-panel', s.optionCard)}>
      <div className={s.cardHead}>
        <div className="ao-row ao-gap-8">
          <input className={cn('ao-input', s.w140)} placeholder="optionKey" value={option.optionKey} onChange={(e) => set({ optionKey: e.target.value })} />
          <input className="ao-input" placeholder="Заголовок" value={option.label} onChange={(e) => set({ label: e.target.value })} />
          <label className="ao-row ao-gap-4"><input type="checkbox" checked={!!option.recommended} onChange={(e) => set({ recommended: e.target.checked })} /><span className="ao-codex">рекоменд.</span></label>
          <Badges issues={issuesAt(issues, path)} />
        </div>
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={onRemove}><Trash2 size={12} /></button>
      </div>
      <div className="ao-row ao-between"><span className="ao-overline">Гранты опции</span>
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={addGrant}><Plus size={12} /> грант</button>
      </div>
      {option.grants.map((gr, ki) => (
        <GrantEditor
          key={gr.id ?? ki}
          grant={gr}
          path={`${path}.grants[${ki}]`}
          issues={issues}
          refData={refData}
          localRefs={localRefs}
          onChange={(ng) => set({ grants: option.grants.map((x, j) => j === ki ? ng : x) })}
          onRemove={() => set({ grants: option.grants.filter((_, j) => j !== ki) })}
        />
      ))}
    </div>
  );
}

// ── Grant editor (per type) ─────────────────────────────────
function GrantEditor({
  grant,
  path,
  issues,
  refData,
  localRefs,
  onChange,
  onRemove,
}: {
  grant: GrantInput;
  path: string;
  issues: AuthoringValidationIssue[];
  refData: ReturnType<typeof useBuilderRefData>;
  localRefs: LocalRefs;
  onChange: (g: GrantInput) => void;
  onRemove: () => void;
}) {
  const p = grant.payload as Record<string, unknown>;
  const setPayload = (patch: Record<string, unknown>) => onChange({ ...grant, payload: { ...grant.payload, ...patch } as GrantPayload });
  const setType = (grantType: string) => onChange({ ...grant, grantType, payload: defaultGrantPayload(grantType) });
  const num = (v: string) => (v === '' ? undefined : Number(v));

  return (
    <div className={cn('ao-panel', s.grantCard)}>
      <div className={s.cardHead}>
        <div className="ao-row ao-gap-8">
          <select className="ao-input" value={grant.grantType} onChange={(e) => setType(e.target.value)}>
            {(KNOWN_GRANT_TYPES as readonly string[]).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <Badges issues={issuesAt(issues, path)} />
        </div>
        <button className="ao-btn ao-btn--sm ao-btn--ghost" onClick={onRemove}><Trash2 size={12} /></button>
      </div>

      {grant.grantType === 'FEATURE' && (
        <div className={s.grid2}>
          <Field label="Умение (из списка)">
            <select className="ao-input" value={(p.featureKey as string) ?? (p.featureId as string) ?? ''} onChange={(e) => setPayload({ featureKey: e.target.value || undefined, featureId: undefined, inline: undefined })}>
              <option value="">— inline ниже —</option>
              {localRefs.features.map((f) => <option key={f.key ?? f.id} value={f.key ?? f.id}>{f.title || '(без названия)'}</option>)}
            </select>
          </Field>
          <Field label="…или inline title">
            <input className="ao-input" value={(p.inline as { title?: string })?.title ?? ''} onChange={(e) => setPayload({ inline: { title: e.target.value }, featureKey: undefined, featureId: undefined })} />
          </Field>
        </div>
      )}

      {grant.grantType === 'SUBCLASS' && (
        <Field label="Сабкласс">
          <select className="ao-input" value={(p.subclassKey as string) ?? (p.subclassId as string) ?? ''} onChange={(e) => setPayload({ subclassKey: e.target.value || undefined, subclassId: undefined })}>
            <option value="">—</option>
            {localRefs.subclasses.map((sub) => <option key={sub.key ?? sub.id} value={sub.key ?? sub.id}>{sub.name || '(без названия)'}</option>)}
          </select>
        </Field>
      )}

      {grant.grantType === 'FEAT' && (
        <div className={s.grid2}>
          <Field label="Режим">
            <select className="ao-input" value={(p.mode as string) ?? 'FIXED'} onChange={(e) => setPayload({ mode: e.target.value })}>
              <option value="FIXED">фикс. черта</option>
              <option value="ANY">любая</option>
            </select>
          </Field>
          {p.mode === 'ANY' ? (
            <Field label="chooseCount"><input className="ao-input" type="number" min={1} value={(p.chooseCount as number) ?? 1} onChange={(e) => setPayload({ chooseCount: num(e.target.value) })} /></Field>
          ) : (
            <Field label="Черта">
              <select className="ao-input" value={(p.featId as string) ?? ''} onChange={(e) => setPayload({ featId: e.target.value || undefined })}>
                <option value="">—</option>
                {refData.feats.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </Field>
          )}
        </div>
      )}

      {grant.grantType === 'SPELL' && (
        <div className={s.grid3}>
          <Field label="Режим">
            <select className="ao-input" value={(p.mode as string) ?? 'CHOICE'} onChange={(e) => setPayload({ mode: e.target.value })}>
              <option value="CHOICE">выбор</option>
              <option value="FIXED">фикс.</option>
            </select>
          </Field>
          {p.mode === 'FIXED' ? (
            <Field label="Заклинания"><MultiSelect options={refData.spells} selected={(p.fixedSpellIds as string[]) ?? []} onChange={(ids) => setPayload({ fixedSpellIds: ids })} /></Field>
          ) : (
            <>
              <Field label="Уровень"><input className="ao-input" type="number" min={0} value={(p.spellLevel as number) ?? 0} onChange={(e) => setPayload({ spellLevel: num(e.target.value) })} /></Field>
              <Field label="chooseCount"><input className="ao-input" type="number" min={1} value={(p.chooseCount as number) ?? 1} onChange={(e) => setPayload({ chooseCount: num(e.target.value) })} /></Field>
            </>
          )}
        </div>
      )}

      {grant.grantType === 'SKILL_PROFICIENCY' && (
        <div className="ao-col ao-gap-8">
          <Field label="Режим">
            <select className="ao-input" value={(p.mode as string) ?? 'CHOICE'} onChange={(e) => setPayload({ mode: e.target.value })}>
              <option value="CHOICE">выбор из пула</option>
              <option value="FIXED">фикс. навыки</option>
              <option value="ANY">любой</option>
            </select>
          </Field>
          {p.mode === 'FIXED' && <Field label="Навыки"><MultiSelect options={refData.skills} selected={(p.skillIds as string[]) ?? []} onChange={(ids) => setPayload({ skillIds: ids })} /></Field>}
          {p.mode === 'CHOICE' && (
            <div className={s.grid2}>
              <Field label="Пул навыков"><MultiSelect options={refData.skills} selected={(p.skillOptionIds as string[]) ?? []} onChange={(ids) => setPayload({ skillOptionIds: ids })} /></Field>
              <Field label="chooseCount"><input className="ao-input" type="number" min={1} value={(p.chooseCount as number) ?? 1} onChange={(e) => setPayload({ chooseCount: num(e.target.value) })} /></Field>
            </div>
          )}
          {p.mode === 'ANY' && <Field label="chooseCount"><input className="ao-input" type="number" min={1} value={(p.chooseCount as number) ?? 1} onChange={(e) => setPayload({ chooseCount: num(e.target.value) })} /></Field>}
        </div>
      )}

      {grant.grantType === 'ABILITY_SCORE' && (
        <div className="ao-col ao-gap-8">
          <Field label="Допустимые характеристики (пусто = любые)"><MultiSelect options={refData.abilities} selected={(p.abilityOptionIds as string[]) ?? []} onChange={(ids) => setPayload({ abilityOptionIds: ids })} /></Field>
          <div className={s.grid3}>
            <Field label="chooseCount"><input className="ao-input" type="number" min={1} value={(p.chooseCount as number) ?? 1} onChange={(e) => setPayload({ chooseCount: num(e.target.value) })} /></Field>
            <Field label="bonusPerChoice"><input className="ao-input" type="number" min={1} value={(p.bonusPerChoice as number) ?? 1} onChange={(e) => setPayload({ bonusPerChoice: num(e.target.value) })} /></Field>
            <Field label="maxPerAbility"><input className="ao-input" type="number" min={1} value={(p.maxPerAbility as number) ?? ''} onChange={(e) => setPayload({ maxPerAbility: num(e.target.value) })} /></Field>
          </div>
        </div>
      )}

      {grant.grantType === 'NUMERIC_MODIFIER' && (
        <div className={s.grid3}>
          <Field label="modifierKey">
            <input className="ao-input" list="mod-keys" value={(p.modifierKey as string) ?? ''} onChange={(e) => setPayload({ modifierKey: e.target.value })} />
            <datalist id="mod-keys">{MODIFIER_KEYS.map((k) => <option key={k} value={k} />)}</datalist>
          </Field>
          <Field label="amount"><input className="ao-input" type="number" value={(p.amount as number) ?? 0} onChange={(e) => setPayload({ amount: Number(e.target.value) || 0 })} /></Field>
          <Field label="unitText"><input className="ao-input" value={(p.unitText as string) ?? ''} onChange={(e) => setPayload({ unitText: e.target.value })} /></Field>
        </div>
      )}

      {!(KNOWN_GRANT_TYPES as readonly string[]).includes(grant.grantType) || grant.grantType === 'CUSTOM_TEXT' ? (
        <div className="ao-col ao-gap-8">
          <Field label="Заголовок"><input className="ao-input" value={(p.title as string) ?? ''} onChange={(e) => setPayload({ title: e.target.value })} /></Field>
          <Field label="Текст"><textarea className="ao-input" rows={2} value={(p.body as string) ?? ''} onChange={(e) => setPayload({ body: e.target.value })} /></Field>
        </div>
      ) : null}
    </div>
  );
}

// ── Review + preview ────────────────────────────────────────
function ReviewTab({
  draft,
  issues,
  previewCtx,
}: {
  draft: ClassDraft;
  issues: AuthoringValidationIssue[];
  previewCtx: PreviewCtx;
}) {
  const errors = issues.filter((i) => i.severity === 'ERROR');
  const warns = issues.filter((i) => i.severity === 'WARNING');
  const groups = useMemo(() => draftToRewardGroups(buildClassWriteRequest(draft), previewCtx), [draft, previewCtx]);
  return (
    <div className="ao-col ao-gap-16">
      <div>
        <span className="ao-h5">{draft.name || '(без названия)'}</span>{' '}
        <span className="ao-codex">d{draft.hitDie}</span>
        {draft.subtitle && <div className={cn('ao-italic', s.muted)}>{draft.subtitle}</div>}
      </div>

      {(errors.length > 0 || warns.length > 0) && (
        <div className={cn('ao-panel', s.card)}>
          <span className="ao-overline">Проверки</span>
          <div className={s.issues}>
            {errors.map((i, k) => <div key={`e${k}`} className={cn('ao-codex', s.issueErr)}>● {i.path}: {i.message}</div>)}
            {warns.map((i, k) => <div key={`w${k}`} className={cn('ao-codex', s.issueWarn)}>▲ {i.path}: {i.message}</div>)}
          </div>
        </div>
      )}

      <div>
        <span className="ao-overline">Превью (как увидят игроки)</span>
        <div className={s.previewWrap}>
          {groups.length === 0 && <p className={cn('ao-italic', s.muted)}>Нет групп наград.</p>}
          {groups.map((g) => (
            <div key={g.id ?? g.groupKey}>
              <span className="ao-codex">Уровень {g.classLevel}</span>
              <RewardGroupView group={g} selectedOptionIds={[]} onChange={() => {}} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
