// ============================================================
// Class Builder — draft model, request builder & client-side validation
// (Phase 8). Pure logic, no JSX.
//
// The editor state IS the ClassWriteRequest graph (new content model). New
// children carry a client `key` so grants can reference not-yet-saved
// features/subclasses/options in the same aggregate request.
// ============================================================
import type {
  AuthoringValidationIssue,
  ClassWriteRequest,
  GrantInput,
  GrantPayload,
  RewardGroupInput,
  RewardOptionInput,
} from '@/types';

export type ClassDraft = ClassWriteRequest;

export const HIT_DICE = [6, 8, 10, 12] as const;
export const GROUP_KINDS = ['AUTO', 'CHOICE'] as const;
export const CASTER_PROGRESSIONS = ['FULL', 'HALF', 'THIRD', 'PACT'] as const;
export const PREPARATIONS = ['PREPARED', 'KNOWN'] as const;

let keySeq = 0;
/** Stable-ish unique client key for new children. */
export function newKey(prefix = 'k'): string {
  keySeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${keySeq}`;
}

export function emptyDraft(): ClassDraft {
  return {
    name: '',
    hitDie: 8,
    primaryAbilityIds: [],
    savingThrowIds: [],
    skillChoiceCount: 2,
    skillChoiceAny: false,
    skillOptionIds: [],
    spellcasting: null,
    features: [],
    subclasses: [],
    rewardGroups: [],
  };
}

/** A sensible default payload for a freshly-added grant of the given type. */
export function defaultGrantPayload(grantType: string): GrantPayload {
  switch (grantType) {
    case 'FEATURE':
      return { inline: { title: '' } };
    case 'SUBCLASS':
      return {};
    case 'FEAT':
      return { mode: 'FIXED' };
    case 'SPELL':
      return { mode: 'CHOICE', chooseCount: 1 };
    case 'SKILL_PROFICIENCY':
      return { mode: 'CHOICE', skillOptionIds: [], chooseCount: 1 };
    case 'ABILITY_SCORE':
      return { chooseCount: 1, bonusPerChoice: 2, maxPerAbility: 2, totalBonus: 2, maxScore: 20 };
    case 'NUMERIC_MODIFIER':
      return { modifierKey: '', amount: 0 };
    default:
      return { title: '', body: '' };
  }
}

export function emptyGrant(grantType = 'FEATURE'): GrantInput {
  return { key: undefined, grantType, sortOrder: 0, payload: defaultGrantPayload(grantType) } as GrantInput;
}

export function emptyOption(index: number): RewardOptionInput {
  return { key: newKey('opt'), optionKey: `option_${index + 1}`, label: '', sortOrder: index, grants: [] };
}

export function emptyGroup(classLevel: number, sortOrder: number, kind: 'AUTO' | 'CHOICE'): RewardGroupInput {
  return {
    key: newKey('grp'),
    classLevel,
    groupKind: kind,
    chooseMin: kind === 'CHOICE' ? 1 : 0,
    chooseMax: kind === 'CHOICE' ? 1 : 0,
    repeatable: false,
    sortOrder,
    options: [],
    grants: [],
  };
}

// ── Request builder ────────────────────────────────────────
const trimmed = (v: string | undefined): string | undefined => {
  const t = v?.trim();
  return t ? t : undefined;
};

function buildGrant(grant: GrantInput, sortOrder: number): GrantInput {
  return {
    ...grant,
    sortOrder,
    label: trimmed(grant.label),
    labelRu: trimmed(grant.labelRu),
    labelEn: trimmed(grant.labelEn),
    description: trimmed(grant.description),
  };
}

function buildOption(option: RewardOptionInput, sortOrder: number): RewardOptionInput {
  return {
    ...option,
    sortOrder,
    label: option.label.trim(),
    labelRu: trimmed(option.labelRu),
    labelEn: trimmed(option.labelEn),
    description: trimmed(option.description),
    grants: option.grants.map(buildGrant),
  };
}

function buildGroup(group: RewardGroupInput, sortOrder: number): RewardGroupInput {
  const isAuto = group.groupKind === 'AUTO';
  return {
    ...group,
    sortOrder,
    prompt: trimmed(group.prompt),
    description: trimmed(group.description),
    options: isAuto ? [] : group.options.map(buildOption),
    grants: group.grants.map(buildGrant),
  };
}

/** Normalises a draft into the wire ClassWriteRequest (sortOrders, trimmed text). */
export function buildClassWriteRequest(draft: ClassDraft): ClassWriteRequest {
  return {
    ...draft,
    name: draft.name.trim(),
    nameRu: trimmed(draft.nameRu),
    nameEn: trimmed(draft.nameEn),
    slug: trimmed(draft.slug),
    subtitle: trimmed(draft.subtitle),
    description: trimmed(draft.description),
    armorProficiencyText: trimmed(draft.armorProficiencyText),
    weaponProficiencyText: trimmed(draft.weaponProficiencyText),
    toolProficiencyText: trimmed(draft.toolProficiencyText),
    spellcasting: draft.spellcasting ?? null,
    features: draft.features.map((f, i) => ({ ...f, sortOrder: i, title: f.title.trim() })),
    subclasses: draft.subclasses,
    rewardGroups: draft.rewardGroups.map(buildGroup),
  };
}

// ── Client-side validation (mirror of the backend contract) ─
function grantIssues(grant: GrantInput, path: string): AuthoringValidationIssue[] {
  const out: AuthoringValidationIssue[] = [];
  const err = (code: string, message: string) =>
    out.push({ path, code, severity: 'ERROR', message });
  const p = grant.payload as Record<string, unknown>;
  switch (grant.grantType) {
    case 'FEATURE': {
      const hasRef = !!p.featureId || !!p.featureKey;
      const inline = p.inline as { title?: string } | undefined;
      if (!hasRef && !inline?.title?.trim()) err('FEATURE_REF_REQUIRED', 'Укажи умение (ссылку или inline title).');
      break;
    }
    case 'SUBCLASS':
      if (!p.subclassId && !p.subclassKey) err('SUBCLASS_REF_REQUIRED', 'Выбери сабкласс.');
      break;
    case 'FEAT':
      if (p.mode === 'FIXED') {
        const inlineFeat = p.inlineFeat as { name?: string } | undefined;
        if (!p.featId && !inlineFeat?.name?.trim()) err('FEAT_REF_REQUIRED', 'Выбери черту или задай inline-черту.');
      } else if ((Number(p.chooseCount) || 0) < 1) {
        err('FEAT_COUNT', 'chooseCount должен быть >= 1.');
      }
      break;
    case 'SPELL':
      if (p.mode === 'FIXED') {
        if (!Array.isArray(p.fixedSpellIds) || p.fixedSpellIds.length === 0) err('SPELL_FIXED', 'Выбери хотя бы одно заклинание.');
      } else if ((Number(p.chooseCount) || 0) < 1) {
        err('SPELL_COUNT', 'chooseCount должен быть >= 1.');
      }
      break;
    case 'SKILL_PROFICIENCY':
      if (p.mode === 'FIXED') {
        if (!Array.isArray(p.skillIds) || p.skillIds.length === 0) err('SKILL_FIXED', 'Выбери навыки.');
      } else if (p.mode === 'CHOICE') {
        if (!Array.isArray(p.skillOptionIds) || p.skillOptionIds.length === 0) err('SKILL_POOL', 'Задай пул навыков.');
        if ((Number(p.chooseCount) || 0) < 1) err('SKILL_COUNT', 'chooseCount должен быть >= 1.');
      } else if ((Number(p.chooseCount) || 0) < 1) {
        err('SKILL_COUNT', 'chooseCount должен быть >= 1.');
      }
      break;
    case 'ABILITY_SCORE':
      if ((Number(p.chooseCount) || 0) < 1) err('ASI_COUNT', 'chooseCount должен быть >= 1.');
      if ((Number(p.bonusPerChoice) || 0) < 1) err('ASI_BONUS', 'bonusPerChoice должен быть >= 1.');
      break;
    case 'NUMERIC_MODIFIER':
      if (!(p.modifierKey as string)?.trim()) err('MODIFIER_KEY', 'Укажи modifierKey.');
      if (typeof p.amount !== 'number') err('MODIFIER_AMOUNT', 'Укажи числовой amount.');
      break;
    default: {
      // CUSTOM_TEXT / unknown — soft requirement: some label/body text.
      const title = (p.title as string)?.trim();
      const body = (p.body as string)?.trim();
      if (!title && !body && !grant.label?.trim()) {
        out.push({ path, code: 'CUSTOM_EMPTY', severity: 'WARNING', message: 'Пустой custom-грант: добавь текст.' });
      }
      break;
    }
  }
  return out;
}

/** Client mirror of the backend validation. Returns issues keyed by path. */
export function validateClassDraft(draft: ClassDraft): AuthoringValidationIssue[] {
  const issues: AuthoringValidationIssue[] = [];
  const err = (path: string, code: string, message: string) =>
    issues.push({ path, code, severity: 'ERROR', message });
  const warn = (path: string, code: string, message: string) =>
    issues.push({ path, code, severity: 'WARNING', message });

  if (!draft.name.trim()) err('name', 'NAME_REQUIRED', 'Имя класса обязательно.');
  if (!(HIT_DICE as readonly number[]).includes(draft.hitDie)) err('hitDie', 'HIT_DIE', 'Hit die должен быть 6/8/10/12.');
  if (draft.primaryAbilityIds.length < 1) err('primaryAbilityIds', 'PRIMARY_REQUIRED', 'Нужна хотя бы одна основная характеристика.');
  if (!draft.skillChoiceAny && draft.skillChoiceCount > 0 && draft.skillOptionIds.length < draft.skillChoiceCount) {
    warn('skillOptionIds', 'SKILL_POOL_SMALL', 'Пул навыков меньше, чем нужно выбрать.');
  }

  draft.rewardGroups.forEach((group, gi) => {
    const gp = `rewardGroups[${gi}]`;
    if (group.chooseMin < 0 || group.chooseMax < 0) err(gp, 'BOUNDS_NEGATIVE', 'choose-границы не могут быть отрицательными.');
    if (group.chooseMin > group.chooseMax) err(gp, 'BOUNDS_ORDER', 'chooseMin > chooseMax.');
    if (group.groupKind === 'CHOICE') {
      if (group.options.length < 1) err(gp, 'CHOICE_NO_OPTIONS', 'CHOICE-группа требует хотя бы одну опцию.');
      if (group.chooseMax > group.options.length) err(gp, 'CHOICE_BOUNDS', 'chooseMax больше числа опций.');
      const keys = new Set<string>();
      group.options.forEach((opt, oi) => {
        const op = `${gp}.options[${oi}]`;
        if (!opt.label.trim()) err(`${op}.label`, 'OPTION_LABEL', 'У опции нужен заголовок.');
        if (opt.optionKey && keys.has(opt.optionKey)) err(`${op}.optionKey`, 'DUPLICATE_OPTION_KEY', 'optionKey дублируется в группе.');
        if (opt.optionKey) keys.add(opt.optionKey);
        if (opt.grants.length === 0) warn(`${op}.grants`, 'OPTION_NO_GRANTS', 'Опция без грантов ничего не даёт.');
        opt.grants.forEach((grant, ki) => issues.push(...grantIssues(grant, `${op}.grants[${ki}]`)));
      });
    } else {
      // AUTO
      if (group.options.length > 0) err(gp, 'AUTO_WITH_OPTIONS', 'AUTO-группа не может иметь опции.');
      if (group.grants.length === 0) warn(`${gp}.grants`, 'AUTO_NO_GRANTS', 'AUTO-группа без грантов пуста.');
    }
    group.grants.forEach((grant, ki) => issues.push(...grantIssues(grant, `${gp}.grants[${ki}]`)));
  });

  return issues;
}

export function hasBlockingErrors(issues: AuthoringValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'ERROR');
}

/** Issues whose path starts with the given prefix (for per-node badges). */
export function issuesAt(issues: AuthoringValidationIssue[], prefix: string): AuthoringValidationIssue[] {
  return issues.filter((i) => i.path === prefix || i.path.startsWith(`${prefix}.`) || i.path.startsWith(`${prefix}[`));
}
