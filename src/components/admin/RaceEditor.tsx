import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/i18n/I18nContext';
import {
  ABILITY_ENUMS,
  CREATURE_SIZES,
  type AbilityEnum,
  type CreatureSize,
  type RaceAbilityScoreBonus,
  type RaceLineageOption,
  type RaceRequest,
  type RaceResponse,
  type RaceSpeedProfile,
  type RaceTrait,
  type RaceTraitActionType,
  type RaceTraitRecharge,
  type RaceTraitUseType,
} from '@/types';

const TRAIT_USE_TYPES: RaceTraitUseType[] = ['PASSIVE', 'LIMITED', 'ACTION', 'BONUS_ACTION', 'REACTION'];
const TRAIT_RECHARGES: RaceTraitRecharge[] = ['NONE', 'SHORT_REST', 'LONG_REST', 'PROFICIENCY_BONUS_PER_LONG_REST', 'CUSTOM'];
const TRAIT_ACTION_TYPES: RaceTraitActionType[] = ['PASSIVE', 'ACTION', 'BONUS_ACTION', 'REACTION', 'PART_OF_ATTACK_ACTION'];

const DAMAGE_TYPES = ['SLASHING', 'PIERCING', 'BLUDGEONING', 'FIRE', 'COLD', 'LIGHTNING', 'POISON', 'NECROTIC', 'RADIANT', 'PSYCHIC', 'FORCE', 'THUNDER', 'ACID'];

export type RaceEditorScope =
  | { kind: 'system' }
  | { kind: 'homebrew'; packageId: string; packageTitle?: string };

interface RaceEditorProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (req: RaceRequest) => void;
  isSubmitting: boolean;
  scope: RaceEditorScope;
  initial?: RaceResponse | null;
}

function emptyTrait(): RaceTrait {
  return {
    name: '',
    description: '',
    levelRequirement: 1,
    uses: { type: 'PASSIVE', recharge: 'NONE', amountExpression: null },
    actionType: 'PASSIVE',
    damage: null,
    savingThrow: null,
    grantedSpells: null,
    innateSpells: null,
    metadata: null,
  };
}

function emptyLineage(): RaceLineageOption {
  return {
    name: '',
    description: '',
    traits: [],
    innateSpells: null,
    resistances: [],
    speedModifiers: null,
    metadata: null,
  };
}

function emptyAbilityBonus(): RaceAbilityScoreBonus {
  return { mode: 'FIXED', ability: 'STRENGTH', bonus: 1 };
}

function defaultSpeed(): RaceSpeedProfile {
  return { walk: 30, fly: null, swim: null, climb: null, burrow: null };
}

function deriveInitialState(initial: RaceResponse | null | undefined, scope: RaceEditorScope): RaceRequest {
  if (initial) {
    return {
      name: initial.name,
      slug: initial.slug,
      description: initial.description,
      loreDescription: initial.loreDescription,
      sourceType: initial.sourceType,
      sourceName: initial.sourceName,
      active: initial.active,
      creatureType: initial.creatureType,
      sizeOptions: initial.sizeOptions,
      defaultSize: initial.defaultSize,
      speed: initial.speed ?? defaultSpeed(),
      darkvisionRange: initial.darkvisionRange ?? null,
      traits: initial.traits ?? [],
      lineageOptions: initial.lineageOptions ?? [],
      lineageRequired: initial.lineageRequired,
      languages: initial.languages ?? [],
      languageOptions: initial.languageOptions ?? null,
      proficiencies: initial.proficiencies ?? [],
      resistances: initial.resistances ?? [],
      vulnerabilities: initial.vulnerabilities ?? [],
      immunities: initial.immunities ?? [],
      conditionResistances: initial.conditionResistances ?? [],
      conditionAdvantages: initial.conditionAdvantages ?? [],
      innateSpells: initial.innateSpells ?? null,
      allowAbilityScoreBonuses: initial.allowAbilityScoreBonuses,
      abilityScoreBonuses: initial.abilityScoreBonuses ?? [],
      metadata: initial.metadata ?? null,
    };
  }
  return {
    name: '',
    slug: '',
    description: '',
    loreDescription: '',
    sourceType: scope.kind === 'system' ? 'SYSTEM' : 'HOMEBREW',
    sourceName: '',
    active: true,
    creatureType: 'HUMANOID',
    sizeOptions: ['MEDIUM'],
    defaultSize: 'MEDIUM',
    speed: defaultSpeed(),
    darkvisionRange: null,
    traits: [],
    lineageOptions: [],
    lineageRequired: false,
    languages: ['Common'],
    languageOptions: null,
    proficiencies: [],
    resistances: [],
    vulnerabilities: [],
    immunities: [],
    conditionResistances: [],
    conditionAdvantages: [],
    innateSpells: null,
    allowAbilityScoreBonuses: false,
    abilityScoreBonuses: [],
    metadata: null,
  };
}

function csvToArray(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

interface CsvFieldProps {
  label: string;
  value: string[] | null | undefined;
  onChange: (next: string[]) => void;
  placeholder?: string;
}

function CsvField({ label, value, onChange, placeholder }: CsvFieldProps) {
  const t = useT();
  const [text, setText] = useState((value || []).join(', '));
  useEffect(() => {
    setText((value || []).join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.join('|')]);
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide">{label}</Label>
      <Input
        value={text}
        placeholder={placeholder || t('cmp2.race.csvPlaceholder')}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => onChange(csvToArray(text))}
      />
    </div>
  );
}

function CollapsibleSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="border border-border rounded-md">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold hover:bg-accent/30"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="p-3 border-t border-border space-y-3">{children}</div>}
    </div>
  );
}

export function RaceEditor({ open, onClose, onSubmit, isSubmitting, scope, initial }: RaceEditorProps) {
  const t = useT();
  const [state, setState] = useState<RaceRequest>(() => deriveInitialState(initial, scope));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setState(deriveInitialState(initial, scope));
      setErrors({});
    }
  }, [open, initial, scope]);

  const patch = (p: Partial<RaceRequest>) => setState((prev) => ({ ...prev, ...p }));
  const patchSpeed = (p: Partial<RaceSpeedProfile>) => setState((prev) => ({ ...prev, speed: { ...prev.speed, ...p } }));

  const toggleSize = (size: CreatureSize) => {
    setState((prev) => {
      const has = prev.sizeOptions.includes(size);
      const nextSizes = has ? prev.sizeOptions.filter((s) => s !== size) : [...prev.sizeOptions, size];
      const nextDefault = nextSizes.includes(prev.defaultSize) ? prev.defaultSize : (nextSizes[0] ?? prev.defaultSize);
      return { ...prev, sizeOptions: nextSizes.length ? nextSizes : prev.sizeOptions, defaultSize: nextDefault };
    });
  };

  // === Traits ===
  const addTrait = () => patch({ traits: [...(state.traits || []), emptyTrait()] });
  const updateTrait = (idx: number, p: Partial<RaceTrait>) => {
    const next = [...(state.traits || [])];
    next[idx] = { ...next[idx], ...p };
    patch({ traits: next });
  };
  const removeTrait = (idx: number) => patch({ traits: (state.traits || []).filter((_, i) => i !== idx) });

  // === Lineages ===
  const addLineage = () => patch({ lineageOptions: [...(state.lineageOptions || []), emptyLineage()] });
  const updateLineage = (idx: number, p: Partial<RaceLineageOption>) => {
    const next = [...(state.lineageOptions || [])];
    next[idx] = { ...next[idx], ...p };
    patch({ lineageOptions: next });
  };
  const removeLineage = (idx: number) => patch({ lineageOptions: (state.lineageOptions || []).filter((_, i) => i !== idx) });

  // === Ability Score Bonuses ===
  const addAbilityBonus = () => patch({ abilityScoreBonuses: [...(state.abilityScoreBonuses || []), emptyAbilityBonus()] });
  const updateAbilityBonus = (idx: number, p: Partial<RaceAbilityScoreBonus>) => {
    const next = [...(state.abilityScoreBonuses || [])];
    next[idx] = { ...next[idx], ...p };
    patch({ abilityScoreBonuses: next });
  };
  const removeAbilityBonus = (idx: number) => patch({ abilityScoreBonuses: (state.abilityScoreBonuses || []).filter((_, i) => i !== idx) });

  const scopeBadgeLabel = scope.kind === 'system'
    ? t('cmp2.race.scopeSystem')
    : (scope.packageTitle ? t('cmp2.race.scopeHomebrewTitled', { title: scope.packageTitle }) : t('cmp2.race.scopeHomebrew'));

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!state.name || state.name.trim().length === 0) errs.name = t('cmp2.race.errNameRequired');
    if (state.name && state.name.length > 50) errs.name = t('cmp2.race.errNameMax');
    if (!state.creatureType) errs.creatureType = t('cmp2.race.errCreatureType');
    if (!state.sizeOptions || state.sizeOptions.length === 0) errs.sizeOptions = t('cmp2.race.errSizeOptions');
    if (state.defaultSize && !state.sizeOptions?.includes(state.defaultSize)) errs.defaultSize = t('cmp2.race.errDefaultSize');
    if (state.speed?.walk === undefined || state.speed.walk === null || state.speed.walk < 0) errs.walk = t('cmp2.race.errWalk');
    if (state.darkvisionRange !== null && state.darkvisionRange !== undefined && state.darkvisionRange < 0) errs.dark = t('cmp2.race.errDark');
    if (state.abilityScoreBonuses && state.abilityScoreBonuses.length > 0 && !state.allowAbilityScoreBonuses) {
      errs.asi = t('cmp2.race.errAsi');
    }
    if (state.lineageRequired && (!state.lineageOptions || state.lineageOptions.length === 0)) {
      errs.lineages = t('cmp2.race.errLineages');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const cleaned: RaceRequest = {
      ...state,
      slug: state.slug?.trim() || undefined,
      sourceName: state.sourceName?.trim() || undefined,
      description: state.description?.trim() || undefined,
      loreDescription: state.loreDescription?.trim() || undefined,
      abilityScoreBonuses: state.allowAbilityScoreBonuses ? state.abilityScoreBonuses : [],
    };
    onSubmit(cleaned);
  };

  const traitsCount = state.traits?.length ?? 0;
  const lineagesCount = state.lineageOptions?.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initial ? t('cmp2.race.editSpecies') : t('cmp2.race.newSpecies')}
            <Badge variant={scope.kind === 'system' ? 'default' : 'secondary'}>{scopeBadgeLabel}</Badge>
            {initial && !initial.active && <Badge variant="outline">{t('cmp2.race.disabled')}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* === Identity === */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t('cmp2.race.name')}</Label>
              <Input
                value={state.name}
                maxLength={50}
                onChange={(e) => patch({ name: e.target.value })}
              />
              {errors.name && <p className="text-xs text-dnd-red">{errors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('cmp2.race.slug')}</Label>
              <Input
                value={state.slug || ''}
                onChange={(e) => patch({ slug: e.target.value })}
                placeholder="elf"
              />
            </div>
            <div className="space-y-1">
              <Label>{t('cmp2.race.creatureType')}</Label>
              <Input
                value={state.creatureType}
                onChange={(e) => patch({ creatureType: e.target.value.toUpperCase() })}
                placeholder="HUMANOID"
              />
              {errors.creatureType && <p className="text-xs text-dnd-red">{errors.creatureType}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('cmp2.race.sourceName')}</Label>
              <Input
                value={state.sourceName || ''}
                onChange={(e) => patch({ sourceName: e.target.value })}
                placeholder="Player's Handbook 2024"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('cmp2.race.shortDescription')}</Label>
              <Textarea
                value={state.description || ''}
                onChange={(e) => patch({ description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>{t('cmp2.race.loreDescription')}</Label>
              <Textarea
                value={state.loreDescription || ''}
                onChange={(e) => patch({ loreDescription: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {/* === Sizes === */}
          <CollapsibleSection title={t('cmp2.race.sizesMovement')} defaultOpen>
            <div>
              <Label className="text-xs uppercase">{t('cmp2.race.sizeOptions')}</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {CREATURE_SIZES.map((size) => (
                  <Button
                    key={size}
                    type="button"
                    size="sm"
                    variant={state.sizeOptions.includes(size) ? 'gold' : 'outline'}
                    onClick={() => toggleSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
              {errors.sizeOptions && <p className="text-xs text-dnd-red mt-1">{errors.sizeOptions}</p>}
            </div>
            <div className="space-y-1">
              <Label>{t('cmp2.race.defaultSize')}</Label>
              <Select value={state.defaultSize} onValueChange={(v) => patch({ defaultSize: v as CreatureSize })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(state.sizeOptions.length ? state.sizeOptions : CREATURE_SIZES).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.defaultSize && <p className="text-xs text-dnd-red">{errors.defaultSize}</p>}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {(['walk', 'fly', 'swim', 'climb', 'burrow'] as const).map((mode) => (
                <div key={mode} className="space-y-1">
                  <Label className="capitalize text-xs">{mode}{mode === 'walk' ? ' *' : ''}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={state.speed?.[mode] ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const v = raw === '' ? (mode === 'walk' ? 0 : null) : Number(raw);
                      patchSpeed({ [mode]: v });
                    }}
                  />
                </div>
              ))}
            </div>
            {errors.walk && <p className="text-xs text-dnd-red">{errors.walk}</p>}
            <div className="space-y-1">
              <Label>{t('cmp2.race.darkvision')}</Label>
              <Input
                type="number"
                min={0}
                value={state.darkvisionRange ?? ''}
                onChange={(e) => patch({ darkvisionRange: e.target.value === '' ? null : Number(e.target.value) })}
              />
              {errors.dark && <p className="text-xs text-dnd-red">{errors.dark}</p>}
            </div>
          </CollapsibleSection>

          {/* === Traits === */}
          <CollapsibleSection title={t('cmp2.race.traits', { count: traitsCount })}>
            {(state.traits || []).map((trait, idx) => (
              <TraitEditor
                key={idx}
                trait={trait}
                onChange={(p) => updateTrait(idx, p)}
                onRemove={() => removeTrait(idx)}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addTrait}>
              <Plus className="h-3 w-3 mr-1" /> {t('cmp2.race.addTrait')}
            </Button>
          </CollapsibleSection>

          {/* === Lineages === */}
          <CollapsibleSection title={t('cmp2.race.lineageOptions', { count: lineagesCount })}>
            <div className="flex items-center gap-2">
              <input
                id="lineageRequired"
                type="checkbox"
                checked={!!state.lineageRequired}
                onChange={(e) => patch({ lineageRequired: e.target.checked })}
              />
              <Label htmlFor="lineageRequired" className="cursor-pointer">{t('cmp2.race.lineageRequired')}</Label>
            </div>
            {(state.lineageOptions || []).map((lineage, idx) => (
              <LineageEditor
                key={idx}
                lineage={lineage}
                onChange={(p) => updateLineage(idx, p)}
                onRemove={() => removeLineage(idx)}
              />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addLineage}>
              <Plus className="h-3 w-3 mr-1" /> {t('cmp2.race.addLineage')}
            </Button>
            {errors.lineages && <p className="text-xs text-dnd-red">{errors.lineages}</p>}
          </CollapsibleSection>

          {/* === Languages / Profs / Damage interactions === */}
          <CollapsibleSection title={t('cmp2.race.langsProfsDamage')}>
            <CsvField label={t('cmp2.race.languages')} value={state.languages} onChange={(v) => patch({ languages: v })} placeholder={t('cmp2.race.langsCommonElvish')} />
            <CsvField label={t('cmp2.race.languageOptions')} value={state.languageOptions} onChange={(v) => patch({ languageOptions: v.length ? v : null })} />
            <CsvField label={t('cmp2.race.proficiencies')} value={state.proficiencies} onChange={(v) => patch({ proficiencies: v })} />
            <CsvField label={t('cmp2.race.resistances')} value={state.resistances} onChange={(v) => patch({ resistances: v })} placeholder={t('cmp2.race.resistFireCold')} />
            <CsvField label={t('cmp2.race.vulnerabilities')} value={state.vulnerabilities} onChange={(v) => patch({ vulnerabilities: v })} />
            <CsvField label={t('cmp2.race.immunities')} value={state.immunities} onChange={(v) => patch({ immunities: v })} />
            <CsvField label={t('cmp2.race.conditionResistances')} value={state.conditionResistances} onChange={(v) => patch({ conditionResistances: v })} />
            <CsvField label={t('cmp2.race.conditionAdvantages')} value={state.conditionAdvantages} onChange={(v) => patch({ conditionAdvantages: v })} placeholder={t('cmp2.race.condCharmed')} />
            <CsvField label={t('cmp2.race.innateSpells')} value={state.innateSpells} onChange={(v) => patch({ innateSpells: v.length ? v : null })} />
          </CollapsibleSection>

          {/* === Legacy / Homebrew mechanics === */}
          <CollapsibleSection title={t('cmp2.race.legacySection')}>
            <p className="text-xs text-muted-foreground">
              {t('cmp2.race.legacyNote')}
            </p>
            <div className="flex items-center gap-2">
              <input
                id="allowAsi"
                type="checkbox"
                checked={!!state.allowAbilityScoreBonuses}
                onChange={(e) => patch({ allowAbilityScoreBonuses: e.target.checked })}
              />
              <Label htmlFor="allowAsi" className="cursor-pointer">{t('cmp2.race.allowAsi')}</Label>
            </div>
            {state.allowAbilityScoreBonuses && (
              <>
                {(state.abilityScoreBonuses || []).map((asi, idx) => (
                  <AbilityBonusEditor
                    key={idx}
                    bonus={asi}
                    onChange={(p) => updateAbilityBonus(idx, p)}
                    onRemove={() => removeAbilityBonus(idx)}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addAbilityBonus}>
                  <Plus className="h-3 w-3 mr-1" /> {t('cmp2.race.addAbilityBonus')}
                </Button>
              </>
            )}
            {errors.asi && <p className="text-xs text-dnd-red">{errors.asi}</p>}
          </CollapsibleSection>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>{t('common.cancel')}</Button>
          <Button type="button" variant="gold" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-editors ──────────────────────────────────────────────

function TraitEditor({
  trait,
  onChange,
  onRemove,
}: {
  trait: RaceTrait;
  onChange: (p: Partial<RaceTrait>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const uses = trait.uses ?? { type: 'PASSIVE' as RaceTraitUseType, recharge: 'NONE' as RaceTraitRecharge, amountExpression: null };
  const damage = trait.damage;
  const saving = trait.savingThrow;
  return (
    <div className="border border-border rounded p-2 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2">
        <Input
          className="flex-1"
          placeholder={t('cmp2.race.traitName')}
          value={trait.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Input
          className="w-20"
          type="number"
          min={1}
          value={trait.levelRequirement ?? 1}
          onChange={(e) => onChange({ levelRequirement: Number(e.target.value) || 1 })}
        />
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-dnd-red" />
        </Button>
      </div>
      <Textarea
        rows={2}
        placeholder={t('cmp2.race.traitDescription')}
        value={trait.description || ''}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs">{t('cmp2.race.useType')}</Label>
          <Select value={uses.type} onValueChange={(v) => onChange({ uses: { ...uses, type: v as RaceTraitUseType } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRAIT_USE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">{t('cmp2.race.recharge')}</Label>
          <Select value={uses.recharge} onValueChange={(v) => onChange({ uses: { ...uses, recharge: v as RaceTraitRecharge } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRAIT_RECHARGES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">{t('cmp2.race.actionType')}</Label>
          <Select value={trait.actionType || 'PASSIVE'} onValueChange={(v) => onChange({ actionType: v as RaceTraitActionType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TRAIT_ACTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Input
        placeholder={t('cmp2.race.usesAmountExpr')}
        value={uses.amountExpression || ''}
        onChange={(e) => onChange({ uses: { ...uses, amountExpression: e.target.value || null } })}
      />
      <div className="flex items-center gap-2">
        <input
          id={`dmg-${trait.name}`}
          type="checkbox"
          checked={!!damage}
          onChange={(e) => onChange({ damage: e.target.checked ? { damageType: 'FIRE', diceExpression: '1d6' } : null })}
        />
        <Label htmlFor={`dmg-${trait.name}`} className="cursor-pointer text-xs">{t('cmp2.race.hasDamage')}</Label>
        {damage && (
          <>
            <Select value={damage.damageType} onValueChange={(v) => onChange({ damage: { ...damage, damageType: v } })}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAMAGE_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              className="w-24"
              placeholder="1d6"
              value={damage.diceExpression || ''}
              onChange={(e) => onChange({ damage: { ...damage, diceExpression: e.target.value } })}
            />
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          id={`sav-${trait.name}`}
          type="checkbox"
          checked={!!saving}
          onChange={(e) => onChange({ savingThrow: e.target.checked ? { ability: 'DEXTERITY' } : null })}
        />
        <Label htmlFor={`sav-${trait.name}`} className="cursor-pointer text-xs">{t('cmp2.race.hasSavingThrow')}</Label>
        {saving && (
          <>
            <Select value={saving.ability} onValueChange={(v) => onChange({ savingThrow: { ...saving, ability: v as AbilityEnum } })}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ABILITY_ENUMS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              className="w-32"
              placeholder={t('cmp2.race.dcExpression')}
              value={saving.dcExpression || ''}
              onChange={(e) => onChange({ savingThrow: { ...saving, dcExpression: e.target.value } })}
            />
          </>
        )}
      </div>
    </div>
  );
}

function LineageEditor({
  lineage,
  onChange,
  onRemove,
}: {
  lineage: RaceLineageOption;
  onChange: (p: Partial<RaceLineageOption>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  return (
    <div className="border border-border rounded p-2 space-y-2 bg-muted/20">
      <div className="flex items-center gap-2">
        <Input
          className="flex-1"
          placeholder={t('cmp2.race.lineageNamePlaceholder')}
          value={lineage.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-dnd-red" />
        </Button>
      </div>
      <Textarea
        rows={2}
        placeholder={t('cmp2.race.lineageDescription')}
        value={lineage.description || ''}
        onChange={(e) => onChange({ description: e.target.value })}
      />
      <CsvField label={t('cmp2.race.resistances')} value={lineage.resistances} onChange={(v) => onChange({ resistances: v })} />
      <CsvField label={t('cmp2.race.innateSpells')} value={lineage.innateSpells} onChange={(v) => onChange({ innateSpells: v.length ? v : null })} />
    </div>
  );
}

function AbilityBonusEditor({
  bonus,
  onChange,
  onRemove,
}: {
  bonus: RaceAbilityScoreBonus;
  onChange: (p: Partial<RaceAbilityScoreBonus>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center gap-2 border border-border rounded p-2 bg-muted/20">
      <div className="space-y-1 w-32">
        <Label className="text-xs">{t('cmp2.race.mode')}</Label>
        <Select value={bonus.mode} onValueChange={(v) => onChange({ mode: v as 'FIXED' | 'CHOICE' })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">{t('cmp2.race.fixed')}</SelectItem>
            <SelectItem value="CHOICE">{t('cmp2.race.choiceMode')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {bonus.mode === 'FIXED' ? (
        <>
          <div className="space-y-1 flex-1">
            <Label className="text-xs">{t('cmp2.race.ability')}</Label>
            <Select value={bonus.ability || 'STRENGTH'} onValueChange={(v) => onChange({ ability: v as AbilityEnum })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ABILITY_ENUMS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-20">
            <Label className="text-xs">{t('cmp2.race.bonus')}</Label>
            <Input
              type="number"
              value={bonus.bonus ?? 1}
              onChange={(e) => onChange({ bonus: Number(e.target.value) })}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1 w-32">
            <Label className="text-xs">{t('cmp2.race.choices')}</Label>
            <Input
              type="number"
              min={1}
              value={bonus.choiceCount ?? 1}
              onChange={(e) => onChange({ choiceCount: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1 w-32">
            <Label className="text-xs">{t('cmp2.race.amountEach')}</Label>
            <Input
              type="number"
              value={bonus.choiceAmount ?? 1}
              onChange={(e) => onChange({ choiceAmount: Number(e.target.value) })}
            />
          </div>
        </>
      )}
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4 text-dnd-red" />
      </Button>
    </div>
  );
}

// Helper: expose deriveInitialState for tests if needed
export { deriveInitialState };
