import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Rune, OrdoChip } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateRichHomebrewClass } from '@/hooks/useHomebrew';
import {
  useImportRichHomebrewClassJson,
  useUpdateRichHomebrewClass,
} from '@/hooks/useHomebrew';
import { useStatTypes } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import s from './RichClassWizard.module.css';
import type {
  ContentSummaryDto,
  ContentType,
  CreateBuffDebuffRequest,
  CreateRichCharacterClassRequest,
  HomebrewDetailResponse,
  RichCharacterClassResponse,
  RichClassRewardType,
  SkillEffectRole,
} from '@/types';

type TFn = (key: string, vars?: Record<string, string | number>) => string;

const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);
const REWARD_TYPES: { value: RichClassRewardType; labelKey: string }[] = [
  { value: 'SKILL', labelKey: 'cmp2.rich.reward.SKILL' },
  { value: 'FEAT', labelKey: 'cmp2.rich.reward.FEAT' },
  { value: 'SUBCLASS', labelKey: 'cmp2.rich.reward.SUBCLASS' },
  { value: 'BUFF_DEBUFF', labelKey: 'cmp2.rich.reward.BUFF_DEBUFF' },
];
const DAMAGE_TYPES = [
  'SLASHING',
  'PIERCING',
  'BLUDGEONING',
  'FIRE',
  'COLD',
  'LIGHTNING',
  'POISON',
  'NECROTIC',
  'RADIANT',
  'PSYCHIC',
  'FORCE',
  'THUNDER',
  'ACID',
];
const EFFECT_TYPES = [
  'STAT_MODIFIER',
  'CONDITION',
  'DAMAGE_OVER_TIME',
  'HEAL_OVER_TIME',
  'IMMUNITY',
  'VULNERABILITY',
];

type ExistingContent = ContentSummaryDto & {
  isBuff?: boolean;
  effectType?: string;
  targetStatId?: string;
};
type SourceMode = 'existing' | 'new';

interface DraftBuffDebuff {
  name: string;
  description: string;
  effectType: string;
  targetStatId: string;
  modifierValue: string;
  durationRounds: string;
  isBuff: boolean;
}

interface DraftSkillEffect {
  localId: string;
  effectRole: SkillEffectRole;
  chancePercent: string;
  sourceMode: SourceMode;
  buffDebuffId: string;
  buffDebuff: DraftBuffDebuff;
}

interface DraftSkill {
  name: string;
  description: string;
  skillType: string;
  damageDice: string;
  damageBonus: string;
  damageType: string;
  effects: DraftSkillEffect[];
}

interface DraftReward {
  localId: string;
  rewardType: RichClassRewardType;
  isChoice: boolean;
  sourceMode: SourceMode;
  rewardId: string;
  skill: DraftSkill;
  feat: { name: string; description: string; prerequisites: string };
  subclass: { name: string; description: string };
  buffDebuff: DraftBuffDebuff;
}

interface ValidationResult {
  errors: string[];
  levelErrors: Record<number, number>;
  rewardErrors: Record<string, string[]>;
}

interface RichClassWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageDetail: HomebrewDetailResponse;
  editingClass?: ContentSummaryDto | null;
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function defaultBuffDebuff(role: SkillEffectRole = 'BUFF'): DraftBuffDebuff {
  return {
    name: '',
    description: '',
    effectType: 'STAT_MODIFIER',
    targetStatId: '',
    modifierValue: '',
    durationRounds: '',
    isBuff: role === 'BUFF',
  };
}

function defaultSkillEffect(role: SkillEffectRole = 'DEBUFF'): DraftSkillEffect {
  return {
    localId: newId(),
    effectRole: role,
    chancePercent: '100',
    sourceMode: 'existing',
    buffDebuffId: '',
    buffDebuff: defaultBuffDebuff(role),
  };
}

function defaultSkill(): DraftSkill {
  return {
    name: '',
    description: '',
    skillType: 'SPELL',
    damageDice: '',
    damageBonus: '',
    damageType: 'FORCE',
    effects: [],
  };
}

function defaultReward(type: RichClassRewardType = 'SKILL'): DraftReward {
  return {
    localId: newId(),
    rewardType: type,
    isChoice: false,
    sourceMode: 'new',
    rewardId: '',
    skill: defaultSkill(),
    feat: { name: '', description: '', prerequisites: '' },
    subclass: { name: '', description: '' },
    buffDebuff: defaultBuffDebuff('BUFF'),
  };
}

function trimOrUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function numberOrUndefined(value: string) {
  return value === '' ? undefined : Number(value);
}

function cleanBuffDebuff(value: DraftBuffDebuff): CreateBuffDebuffRequest {
  return {
    name: value.name.trim(),
    description: trimOrUndefined(value.description),
    effectType: value.effectType,
    targetStatId: value.effectType === 'STAT_MODIFIER' ? trimOrUndefined(value.targetStatId) : undefined,
    modifierValue: numberOrUndefined(value.modifierValue),
    durationRounds: numberOrUndefined(value.durationRounds),
    isBuff: value.isBuff,
  };
}

function rewardName(reward: DraftReward, t: TFn, existing?: ExistingContent) {
  if (reward.sourceMode === 'existing') return existing?.name || t('cmp2.rich.existingContent');
  if (reward.rewardType === 'SKILL') return reward.skill.name || t('cmp2.rich.newSkill');
  if (reward.rewardType === 'FEAT') return reward.feat.name || t('cmp2.rich.newFeat');
  if (reward.rewardType === 'SUBCLASS') return reward.subclass.name || t('cmp2.rich.newSubclass');
  return reward.buffDebuff.name || t('cmp2.rich.newBuff');
}

function typeLabel(type: RichClassRewardType, t: TFn) {
  const found = REWARD_TYPES.find((item) => item.value === type);
  return found ? t(found.labelKey) : type;
}

function validate(
  className: string,
  levelsByNumber: Record<number, DraftReward[]>,
  getExistingById: (type: RichClassRewardType, id: string) => ExistingContent | undefined,
  t: TFn,
): ValidationResult {
  const errors: string[] = [];
  const levelErrors: Record<number, number> = {};
  const rewardErrors: Record<string, string[]> = {};

  const addRewardError = (level: number, rewardId: string, message: string) => {
    rewardErrors[rewardId] = [...(rewardErrors[rewardId] || []), message];
    levelErrors[level] = (levelErrors[level] || 0) + 1;
  };

  if (!className.trim()) errors.push(t('cmp2.rich.err.classNameRequired'));
  if (className.trim().length > 50) errors.push(t('cmp2.rich.err.classNameMax'));

  Object.entries(levelsByNumber).forEach(([rawLevel, rewards]) => {
    const level = Number(rawLevel);
    if (level < 1 || level > 20) errors.push(t('cmp2.rich.err.invalidLevel', { level: rawLevel }));

    const seen = new Map<string, string>();
    rewards.forEach((reward) => {
      const sourceCount =
        (reward.sourceMode === 'existing' && reward.rewardId ? 1 : 0) +
        (reward.sourceMode === 'new' ? 1 : 0);

      if (sourceCount !== 1) {
        addRewardError(level, reward.localId, t('cmp2.rich.err.sourceExactlyOne'));
      }

      if (reward.sourceMode === 'existing') {
        if (!reward.rewardId) addRewardError(level, reward.localId, t('cmp2.rich.err.selectExistingPackage'));
        const duplicateKey = `${reward.rewardType}:existing:${reward.rewardId}`;
        if (reward.rewardId && seen.has(duplicateKey)) {
          addRewardError(level, reward.localId, t('cmp2.rich.err.duplicateReward'));
        }
        seen.set(duplicateKey, reward.localId);
      } else {
        const name =
          reward.rewardType === 'SKILL'
            ? reward.skill.name
            : reward.rewardType === 'FEAT'
              ? reward.feat.name
              : reward.rewardType === 'SUBCLASS'
                ? reward.subclass.name
                : reward.buffDebuff.name;

        if (!name.trim()) addRewardError(level, reward.localId, t('cmp2.rich.err.nameRequired', { type: typeLabel(reward.rewardType, t) }));

        const duplicateKey = `${reward.rewardType}:new:${name.trim().toLowerCase()}`;
        if (name.trim() && seen.has(duplicateKey)) {
          addRewardError(level, reward.localId, t('cmp2.rich.err.duplicateReward'));
        }
        seen.set(duplicateKey, reward.localId);

        if (reward.rewardType === 'BUFF_DEBUFF') {
          const bd = reward.buffDebuff;
          if (bd.effectType === 'STAT_MODIFIER' && !bd.targetStatId) {
            addRewardError(level, reward.localId, t('cmp2.rich.err.statModifierTarget'));
          }
        }

        if (reward.rewardType === 'SKILL') {
          reward.skill.effects.forEach((effect, index) => {
            const chance = Number(effect.chancePercent);
            if (Number.isNaN(chance) || chance < 0 || chance > 100) {
              addRewardError(level, reward.localId, t('cmp2.rich.err.effectChance', { n: index + 1 }));
            }

            if (effect.sourceMode === 'existing') {
              if (!effect.buffDebuffId) addRewardError(level, reward.localId, t('cmp2.rich.err.effectNeedsExistingBuff', { n: index + 1 }));
              const existing = getExistingById('BUFF_DEBUFF', effect.buffDebuffId);
              if (existing && typeof existing.isBuff === 'boolean' && existing.isBuff !== (effect.effectRole === 'BUFF')) {
                addRewardError(level, reward.localId, t('cmp2.rich.err.effectRoleMismatch', { n: index + 1 }));
              }
            } else {
              const bd = effect.buffDebuff;
              if (!bd.name.trim()) addRewardError(level, reward.localId, t('cmp2.rich.err.effectBuffNameRequired', { n: index + 1 }));
              if (bd.effectType === 'STAT_MODIFIER' && !bd.targetStatId) {
                addRewardError(level, reward.localId, t('cmp2.rich.err.effectStatModifierTarget', { n: index + 1 }));
              }
              if (bd.isBuff !== (effect.effectRole === 'BUFF')) {
                addRewardError(level, reward.localId, t('cmp2.rich.err.effectRoleMustMatch', { n: index + 1 }));
              }
            }
          });
        }
      }
    });
  });

  Object.values(rewardErrors).forEach((items) => errors.push(...items));
  return { errors, levelErrors, rewardErrors };
}

function validateImportPayload(value: unknown, t: TFn): string[] {
  const errors: string[] = [];
  const data = value as Partial<CreateRichCharacterClassRequest> | null;
  if (!data || typeof data !== 'object') return [t('cmp2.rich.err.jsonRootObject')];
  if (!data.name || typeof data.name !== 'string') errors.push(t('cmp2.rich.err.classNameRequired'));
  if (typeof data.name === 'string' && data.name.length > 50) errors.push(t('cmp2.rich.err.classNameMax'));
  if (data.levels != null && !Array.isArray(data.levels)) errors.push(t('cmp2.rich.err.levelsArray'));
  if (Array.isArray(data.levels)) {
    data.levels.forEach((level, index) => {
      if (level.level < 1 || level.level > 20) errors.push(t('cmp2.rich.err.levelRange', { i: index }));
      if (!Array.isArray(level.rewards)) errors.push(t('cmp2.rich.err.rewardsArray', { i: index }));
    });
  }
  return errors;
}

export function RichClassWizard({ open, onOpenChange, packageDetail, editingClass }: RichClassWizardProps) {
  const t = useT();
  const createMutation = useCreateRichHomebrewClass();
  const updateMutation = useUpdateRichHomebrewClass();
  const importMutation = useImportRichHomebrewClassJson();
  const { data: statTypes } = useStatTypes();
  const [hydratedKey, setHydratedKey] = useState('');
  const [importError, setImportError] = useState('');
  const [className, setClassName] = useState('');
  const [classDescription, setClassDescription] = useState('');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [levelsByNumber, setLevelsByNumber] = useState<Record<number, DraftReward[]>>({});
  const [result, setResult] = useState<RichCharacterClassResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    const key = editingClass ? `edit:${editingClass.id}` : 'create';
    if (hydratedKey === key) return;
    setClassName(editingClass?.name || '');
    setClassDescription(editingClass?.description || '');
    setSelectedLevel(1);
    setSelectedRewardId(null);
    setLevelsByNumber({});
    setResult(null);
    setImportError('');
    setHydratedKey(key);
  }, [open, editingClass, hydratedKey]);

  const getContent = useCallback(
    (type: RichClassRewardType) =>
      ((packageDetail.contentByType || {})[type as ContentType] || []) as ExistingContent[],
    [packageDetail],
  );
  const getExistingById = useCallback(
    (type: RichClassRewardType, id: string) => getContent(type).find((item) => item.id === id),
    [getContent],
  );
  const currentRewards = levelsByNumber[selectedLevel] || [];
  const selectedReward = currentRewards.find((reward) => reward.localId === selectedRewardId) || currentRewards[0] || null;

  const validation = useMemo(
    () => validate(className, levelsByNumber, getExistingById, t),
    [className, levelsByNumber, getExistingById, t],
  );
  const isSaving = createMutation.isPending || updateMutation.isPending || importMutation.isPending;
  const canSave = validation.errors.length === 0 && className.trim().length > 0 && !isSaving;

  const updateRewards = (level: number, updater: (rewards: DraftReward[]) => DraftReward[]) => {
    setLevelsByNumber((current) => {
      const nextRewards = updater(current[level] || []);
      return { ...current, [level]: nextRewards };
    });
  };

  const updateSelectedReward = (updater: (reward: DraftReward) => DraftReward) => {
    if (!selectedReward) return;
    updateRewards(selectedLevel, (rewards) =>
      rewards.map((reward) => (reward.localId === selectedReward.localId ? updater(reward) : reward)),
    );
  };

  const addReward = () => {
    const reward = defaultReward();
    updateRewards(selectedLevel, (rewards) => [...rewards, reward]);
    setSelectedRewardId(reward.localId);
  };

  const removeReward = (id: string) => {
    updateRewards(selectedLevel, (rewards) => rewards.filter((reward) => reward.localId !== id));
    if (selectedRewardId === id) setSelectedRewardId(null);
  };

  const resetWizard = () => {
    setHydratedKey('');
    setImportError('');
    setClassName('');
    setClassDescription('');
    setSelectedLevel(1);
    setSelectedRewardId(null);
    setLevelsByNumber({});
    setResult(null);
  };

  const buildPayload = (): CreateRichCharacterClassRequest => ({
    name: className.trim(),
    description: trimOrUndefined(classDescription),
    levels: LEVELS
      .map((level) => ({
        level,
        rewards: (levelsByNumber[level] || []).map((reward) => {
          if (reward.sourceMode === 'existing') {
            return {
              rewardType: reward.rewardType,
              isChoice: reward.isChoice,
              rewardId: reward.rewardId,
            };
          }

          if (reward.rewardType === 'SKILL') {
            return {
              rewardType: reward.rewardType,
              isChoice: reward.isChoice,
              skill: {
                name: reward.skill.name.trim(),
                description: trimOrUndefined(reward.skill.description),
                skillType: trimOrUndefined(reward.skill.skillType),
                damageDice: trimOrUndefined(reward.skill.damageDice),
                damageBonus: numberOrUndefined(reward.skill.damageBonus),
                damageType: trimOrUndefined(reward.skill.damageType),
                effects: reward.skill.effects.map((effect) => ({
                  effectRole: effect.effectRole,
                  chancePercent: Number(effect.chancePercent),
                  buffDebuffId: effect.sourceMode === 'existing' ? effect.buffDebuffId : undefined,
                  buffDebuff: effect.sourceMode === 'new' ? cleanBuffDebuff(effect.buffDebuff) : undefined,
                })),
              },
            };
          }

          if (reward.rewardType === 'FEAT') {
            return {
              rewardType: reward.rewardType,
              isChoice: reward.isChoice,
              feat: {
                name: reward.feat.name.trim(),
                description: trimOrUndefined(reward.feat.description),
                prerequisites: trimOrUndefined(reward.feat.prerequisites),
              },
            };
          }

          if (reward.rewardType === 'SUBCLASS') {
            return {
              rewardType: reward.rewardType,
              isChoice: reward.isChoice,
              subclass: {
                name: reward.subclass.name.trim(),
                description: trimOrUndefined(reward.subclass.description),
              },
            };
          }

          return {
            rewardType: reward.rewardType,
            isChoice: reward.isChoice,
            buffDebuff: cleanBuffDebuff(reward.buffDebuff),
          };
        }),
      }))
      .filter((level) => level.rewards.length > 0),
  });

  const handleSave = () => {
    if (!canSave) return;
    const data = buildPayload();
    if (editingClass) {
      updateMutation.mutate(
        { packageId: packageDetail.id, classId: editingClass.id, data },
        {
          onSuccess: (response) => {
            if (response.data) setResult(response.data);
          },
        },
      );
    } else {
      createMutation.mutate(
        { packageId: packageDetail.id, data },
        {
          onSuccess: (response) => {
            if (response.data) setResult(response.data);
          },
        },
      );
    }
  };

  const handleImportJson = async (file: File | undefined) => {
    if (!file) return;
    setImportError('');
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const errors = validateImportPayload(parsed, t);
      if (errors.length > 0) {
        setImportError(errors.join(' '));
        return;
      }
      importMutation.mutate(
        { packageId: packageDetail.id, data: parsed as CreateRichCharacterClassRequest },
        {
          onSuccess: (response) => {
            if (response.data) setResult(response.data);
          },
        },
      );
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t('cmp2.rich.toastImportFailed'));
    }
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetWizard();
  };

  const renderBuffDebuffForm = (
    value: DraftBuffDebuff,
    onChange: (next: DraftBuffDebuff) => void,
    lockNature?: SkillEffectRole,
  ) => (
    <div className={s.grid10}>
      <input
        className="ao-input"
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        placeholder={t('cmp2.rich.buffName')}
      />
      <textarea
        className="ao-input"
        value={value.description}
        onChange={(event) => onChange({ ...value, description: event.target.value })}
        rows={3}
        placeholder={t('cmp2.rich.description')}
      />
      <div className={cn('ao-rgrid', s.cols2)}>
        <select
          className="ao-input"
          value={value.effectType}
          onChange={(event) => onChange({ ...value, effectType: event.target.value })}
        >
          {EFFECT_TYPES.map((type) => (
            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          className="ao-input"
          value={value.isBuff ? 'true' : 'false'}
          disabled={!!lockNature}
          onChange={(event) => onChange({ ...value, isBuff: event.target.value === 'true' })}
        >
          <option value="true">{t('cmp2.rich.buff')}</option>
          <option value="false">{t('cmp2.rich.debuff')}</option>
        </select>
      </div>
      {value.effectType === 'STAT_MODIFIER' && (
        <select
          className="ao-input"
          value={value.targetStatId}
          onChange={(event) => onChange({ ...value, targetStatId: event.target.value })}
        >
          <option value="">{t('cmp2.rich.selectTargetStat')}</option>
          {(statTypes || []).map((stat) => (
            <option key={stat.id} value={stat.id}>{stat.name}</option>
          ))}
        </select>
      )}
      <div className={cn('ao-rgrid', s.cols2)}>
        <input
          className="ao-input"
          type="number"
          value={value.modifierValue}
          onChange={(event) => onChange({ ...value, modifierValue: event.target.value })}
          placeholder={t('cmp2.rich.modifier')}
        />
        <input
          className="ao-input"
          type="number"
          value={value.durationRounds}
          onChange={(event) => onChange({ ...value, durationRounds: event.target.value })}
          placeholder={t('cmp2.rich.durationRounds')}
        />
      </div>
    </div>
  );

  const renderInlineForm = (reward: DraftReward) => {
    if (reward.rewardType === 'SKILL') {
      return (
        <div className={s.grid12}>
          <input
            className="ao-input"
            value={reward.skill.name}
            onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, name: event.target.value } }))}
            placeholder={t('cmp2.rich.skillName')}
          />
          <textarea
            className="ao-input"
            value={reward.skill.description}
            onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, description: event.target.value } }))}
            rows={3}
            placeholder={t('cmp2.rich.skillDescription')}
          />
          <div className={cn('ao-rgrid', s.cols2)}>
            <input
              className="ao-input"
              value={reward.skill.skillType}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, skillType: event.target.value } }))}
              placeholder={t('cmp2.rich.skillType')}
            />
            <select
              className="ao-input"
              value={reward.skill.damageType}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, damageType: event.target.value } }))}
            >
              <option value="">{t('cmp2.rich.noDamageType')}</option>
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className={cn('ao-rgrid', s.cols2)}>
            <input
              className="ao-input"
              value={reward.skill.damageDice}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, damageDice: event.target.value } }))}
              placeholder={t('cmp2.rich.damageDiceEg')}
            />
            <input
              className="ao-input"
              type="number"
              value={reward.skill.damageBonus}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, damageBonus: event.target.value } }))}
              placeholder={t('cmp2.rich.damageBonus')}
            />
          </div>

          <div className="ao-row ao-between">
            <div>
              <div className={cn('ao-label', s.labelFlush)}>{t('cmp2.rich.effects')}</div>
              <div className="ao-codex">{t('cmp2.rich.effectsHintPackage')}</div>
            </div>
            <button
              className="ao-btn ao-btn--sm"
              onClick={() =>
                updateSelectedReward((item) => ({
                  ...item,
                  skill: { ...item.skill, effects: [...item.skill.effects, defaultSkillEffect('DEBUFF')] },
                }))
              }
            >
              <Plus size={13} /> {t('cmp2.rich.add')}
            </button>
          </div>

          {reward.skill.effects.map((effect, index) => (
            <div key={effect.localId} className={s.effectCard}>
              <div className={cn('ao-rgrid', s.effectHead)}>
                <select
                  className="ao-input"
                  value={effect.effectRole}
                  onChange={(event) =>
                    updateSelectedReward((item) => ({
                      ...item,
                      skill: {
                        ...item.skill,
                        effects: item.skill.effects.map((row) =>
                          row.localId === effect.localId
                            ? {
                                ...row,
                                effectRole: event.target.value as SkillEffectRole,
                                buffDebuff: { ...row.buffDebuff, isBuff: event.target.value === 'BUFF' },
                              }
                            : row,
                        ),
                      },
                    }))
                  }
                >
                  <option value="BUFF">{t('cmp2.rich.buff')}</option>
                  <option value="DEBUFF">{t('cmp2.rich.debuff')}</option>
                </select>
                <input
                  className="ao-input"
                  type="number"
                  min={0}
                  max={100}
                  value={effect.chancePercent}
                  onChange={(event) =>
                    updateSelectedReward((item) => ({
                      ...item,
                      skill: {
                        ...item.skill,
                        effects: item.skill.effects.map((row) =>
                          row.localId === effect.localId ? { ...row, chancePercent: event.target.value } : row,
                        ),
                      },
                    }))
                  }
                  placeholder={t('cmp2.rich.chancePercent')}
                />
                <button
                  className={cn('ao-iconbtn', s.iconDanger40)}
                  onClick={() =>
                    updateSelectedReward((item) => ({
                      ...item,
                      skill: {
                        ...item.skill,
                        effects: item.skill.effects.filter((row) => row.localId !== effect.localId),
                      },
                    }))
                  }
                  title={t('cmp2.rich.removeEffect')}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="ao-row ao-gap-6">
                {(['existing', 'new'] as SourceMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={cn('ao-btn ao-btn--sm ao-grow', effect.sourceMode === mode ? 'ao-btn--primary' : 'ao-btn--ghost')}
                    onClick={() =>
                      updateSelectedReward((item) => ({
                        ...item,
                        skill: {
                          ...item.skill,
                          effects: item.skill.effects.map((row) =>
                            row.localId === effect.localId ? { ...row, sourceMode: mode } : row,
                          ),
                        },
                      }))
                    }
                  >
                    {mode === 'existing' ? t('cmp2.rich.existing') : t('cmp2.rich.new')}
                  </button>
                ))}
              </div>
              {effect.sourceMode === 'existing' ? (
                <select
                  className="ao-input"
                  value={effect.buffDebuffId}
                  onChange={(event) =>
                    updateSelectedReward((item) => ({
                      ...item,
                      skill: {
                        ...item.skill,
                        effects: item.skill.effects.map((row) =>
                          row.localId === effect.localId ? { ...row, buffDebuffId: event.target.value } : row,
                        ),
                      },
                    }))
                  }
                >
                  <option value="">{t('cmp2.rich.selectPackageBuff')}</option>
                  {getContent('BUFF_DEBUFF').map((content) => (
                    <option key={content.id} value={content.id}>{content.name}</option>
                  ))}
                </select>
              ) : (
                renderBuffDebuffForm(
                  effect.buffDebuff,
                  (next) =>
                    updateSelectedReward((item) => ({
                      ...item,
                      skill: {
                        ...item.skill,
                        effects: item.skill.effects.map((row) =>
                          row.localId === effect.localId ? { ...row, buffDebuff: next } : row,
                        ),
                      },
                    })),
                  effect.effectRole,
                )
              )}
              <div className="ao-codex">{t('cmp2.rich.effect', { n: index + 1 })}</div>
            </div>
          ))}
        </div>
      );
    }

    if (reward.rewardType === 'FEAT') {
      return (
        <div className={s.grid10}>
          <input className="ao-input" value={reward.feat.name} onChange={(event) => updateSelectedReward((item) => ({ ...item, feat: { ...item.feat, name: event.target.value } }))} placeholder={t('cmp2.rich.featName')} />
          <textarea className="ao-input" value={reward.feat.description} onChange={(event) => updateSelectedReward((item) => ({ ...item, feat: { ...item.feat, description: event.target.value } }))} rows={3} placeholder={t('cmp2.rich.description')} />
          <input className="ao-input" value={reward.feat.prerequisites} onChange={(event) => updateSelectedReward((item) => ({ ...item, feat: { ...item.feat, prerequisites: event.target.value } }))} placeholder={t('cmp2.rich.prerequisites')} />
        </div>
      );
    }

    if (reward.rewardType === 'SUBCLASS') {
      return (
        <div className={s.grid10}>
          <input className="ao-input" value={reward.subclass.name} onChange={(event) => updateSelectedReward((item) => ({ ...item, subclass: { ...item.subclass, name: event.target.value } }))} placeholder={t('cmp2.rich.subclassName')} />
          <textarea className="ao-input" value={reward.subclass.description} onChange={(event) => updateSelectedReward((item) => ({ ...item, subclass: { ...item.subclass, description: event.target.value } }))} rows={4} placeholder={t('cmp2.rich.description')} />
        </div>
      );
    }

    return renderBuffDebuffForm(reward.buffDebuff, (next) => updateSelectedReward((item) => ({ ...item, buffDebuff: next })));
  };

  if (result) {
    const groups = result.createdContent || {};
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[920px]">
          <DialogHeader>
            <DialogTitle>{t('cmp2.rich.createdTitle')}</DialogTitle>
          </DialogHeader>
          <div className={s.grid16}>
            <div className={cn('ao-panel', s.pad16)}>
              <div className="ao-h5">{result.characterClass.name}</div>
              <div className={cn('ao-codex', s.mt4)}>{t('cmp2.rich.rewardsCreated', { count: result.rewards.length })}</div>
            </div>
            <div className={cn('ao-rgrid', s.cols5)}>
              {(['CHARACTER_CLASS', 'SKILL', 'FEAT', 'SUBCLASS', 'BUFF_DEBUFF'] as ContentType[]).map((type) => (
                <div key={type} className={cn('ao-panel--inset', s.summaryCell)}>
                  <div className={cn('ao-overline', s.overline9)}>{type.replace(/_/g, ' ')}</div>
                  <div className={cn('ao-h6', s.mt4)}>{(groups[type] || []).length}</div>
                  {(groups[type] || []).slice(0, 3).map((item) => (
                    <div key={item.id} className={cn('ao-codex', s.ellipsis)}>
                      {item.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="ao-row ao-justify-end">
              <button className="ao-btn ao-btn--primary" onClick={() => handleClose(false)}>{t('cmp2.rich.done')}</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[96vw] h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b border-border">
          <div className={s.headerRow}>
            <div className={s.headerInfo}>
              <DialogTitle>{editingClass ? t('cmp2.rich.editTitleHb') : t('cmp2.rich.createTitleHb')}</DialogTitle>
              <div className={cn('ao-codex', s.mt5)}>{t('cmp2.rich.hbSubtitle', { title: packageDetail.title })}</div>
            </div>
            <div className="ao-row ao-gap-8">
              <label className={cn('ao-btn ao-btn--ghost', isSaving && s.notAllowed)}>
                <FileUp size={14} />
                {t('cmp2.rich.importJson')}
                <input
                  type="file"
                  accept="application/json,.json"
                  disabled={isSaving}
                  onChange={(event) => {
                    handleImportJson(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                  className={s.hidden}
                />
              </label>
              <button className="ao-btn ao-btn--ghost" onClick={() => handleClose(false)}>{t('common.cancel')}</button>
              <button className="ao-btn ao-btn--primary" onClick={handleSave} disabled={!canSave}>
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('cmp2.rich.saveClass')}
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className={cn('ao-rgrid', s.layout)}>
          <aside className={cn('ao-scroll', s.railLevels)}>
            <div className={s.railPad}>
              {LEVELS.map((level) => {
                const count = (levelsByNumber[level] || []).length;
                const active = selectedLevel === level;
                const hasError = validation.levelErrors[level] > 0;
                return (
                  <button
                    key={level}
                    className={cn('ao-btn ao-btn--sm', active ? 'ao-btn--primary' : 'ao-btn--ghost', s.levelBtn, hasError && s.hasError)}
                    onClick={() => {
                      setSelectedLevel(level);
                      setSelectedRewardId((levelsByNumber[level] || [])[0]?.localId || null);
                    }}
                  >
                    <span>{t('cmp2.rich.level', { level })}</span>
                    <span className="ao-codex">{hasError ? '!' : count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className={cn('ao-scroll', s.mainPane)}>
            <div className={cn('ao-panel', s.classPanel)}>
              <div className={cn('ao-rgrid', s.classCols)}>
                <div>
                  <label className="ao-label">{t('cmp2.rich.className')}</label>
                  <input
                    className="ao-input"
                    value={className}
                    maxLength={50}
                    onChange={(event) => setClassName(event.target.value.slice(0, 50))}
                    placeholder={t('cmp2.rich.classNamePlaceholder')}
                  />
                </div>
                <div>
                  <label className="ao-label">{t('cmp2.rich.description')}</label>
                  <input
                    className="ao-input"
                    value={classDescription}
                    onChange={(event) => setClassDescription(event.target.value)}
                    placeholder={t('cmp2.rich.classDescriptionHbPlaceholder')}
                  />
                </div>
              </div>
              {validation.errors.length > 0 && (
                <div className={s.grid4}>
                  {validation.errors.slice(0, 5).map((error, index) => (
                    <div key={`${error}-${index}`} className={cn('ao-codex', s.err)}>{error}</div>
                  ))}
                  {validation.errors.length > 5 && <div className="ao-codex">{t('cmp2.rich.moreIssues', { count: validation.errors.length - 5 })}</div>}
                </div>
              )}
              {editingClass && (
                <div className={cn('ao-codex', s.warnGold)}>
                  {t('cmp2.rich.editReplaceWarning')}
                </div>
              )}
              {importError && <div className={cn('ao-codex', s.err)}>{importError}</div>}
            </div>

            <div className="ao-row ao-between">
              <div>
                <div className="ao-h5">{t('cmp2.rich.levelRewards', { level: selectedLevel })}</div>
                <div className="ao-codex">{t('cmp2.rich.levelRewardsHintHb')}</div>
              </div>
              <button className="ao-btn ao-btn--primary" onClick={addReward}>
                <Plus size={14} /> {t('cmp2.rich.addReward')}
              </button>
            </div>

            {currentRewards.length === 0 ? (
              <div className={cn('ao-panel--inset', s.emptyRewards)}>
                <div className="ao-italic">{t('cmp2.rich.noRewards')}</div>
              </div>
            ) : (
              <div className={s.grid8}>
                {currentRewards.map((reward, index) => {
                  const existing = reward.sourceMode === 'existing' ? getExistingById(reward.rewardType, reward.rewardId) : undefined;
                  const selected = selectedReward?.localId === reward.localId;
                  const rowErrors = validation.rewardErrors[reward.localId] || [];
                  return (
                    <button
                      key={reward.localId}
                      className={cn('ao-panel', s.rewardRow, rowErrors.length ? s.error : selected && s.selected)}
                      onClick={() => setSelectedRewardId(reward.localId)}
                    >
                      <div className={cn('ao-rgrid', s.rewardGrid)}>
                        <div className={cn('ao-slot', s.slot32)}>
                          <Rune kind={reward.rewardType === 'SKILL' ? 'eye' : reward.rewardType === 'FEAT' ? 'sigil-3' : reward.rewardType === 'SUBCLASS' ? 'cross-pat' : 'hex'} size={14} />
                        </div>
                        <div className={s.min0}>
                          <div className={s.rewardName}>
                            {index + 1}. {rewardName(reward, t, existing)}
                          </div>
                          <div className={cn('ao-codex', s.ellipsis)}>
                            {typeLabel(reward.rewardType, t)} / {reward.sourceMode === 'existing' ? t('cmp2.rich.sourceExisting') : t('cmp2.rich.sourceInline')}
                          </div>
                        </div>
                        <div className="ao-row ao-gap-6">
                          {reward.isChoice && <OrdoChip tone="arcane">{t('cmp2.rich.choice')}</OrdoChip>}
                          {rowErrors.length > 0 && <OrdoChip tone="ember">{t('cmp2.rich.issue', { count: rowErrors.length })}</OrdoChip>}
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeReward(reward.localId);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                event.stopPropagation();
                                removeReward(reward.localId);
                              }
                            }}
                            className={cn('ao-iconbtn', s.iconDanger)}
                            title={t('cmp2.rich.removeReward')}
                          >
                            <Trash2 size={14} />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </main>

          <aside className={cn('ao-scroll', s.railInspect)}>
            {!selectedReward ? (
              <div className={cn('ao-panel--inset', s.pad18)}>
                <div className="ao-italic">{t('cmp2.rich.selectOrAdd')}</div>
              </div>
            ) : (
              <div className={s.grid14}>
                <div>
                  <div className="ao-overline">{t('cmp2.rich.rewardType')}</div>
                  <div className={cn('ao-rgrid', s.typeGrid)}>
                    {REWARD_TYPES.map((type) => (
                      <button
                        key={type.value}
                        className={`ao-btn ao-btn--sm ${selectedReward.rewardType === type.value ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                        onClick={() =>
                          updateSelectedReward((reward) => ({
                            ...defaultReward(type.value),
                            localId: reward.localId,
                            isChoice: reward.isChoice,
                          }))
                        }
                      >
                        {t(type.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className={s.choiceLabel}>
                  <input
                    type="checkbox"
                    checked={selectedReward.isChoice}
                    onChange={(event) => updateSelectedReward((reward) => ({ ...reward, isChoice: event.target.checked }))}
                  />
                  <span>{t('cmp2.rich.playerChooses')}</span>
                </label>

                <div>
                  <div className="ao-overline">{t('cmp2.rich.source')}</div>
                  <div className={s.sourceRow}>
                    {(['existing', 'new'] as SourceMode[]).map((mode) => (
                      <button
                        key={mode}
                        className={cn('ao-btn ao-btn--sm ao-grow', selectedReward.sourceMode === mode ? 'ao-btn--primary' : 'ao-btn--ghost')}
                        onClick={() => updateSelectedReward((reward) => ({ ...reward, sourceMode: mode }))}
                      >
                        {mode === 'existing' ? t('cmp2.rich.existing') : t('cmp2.rich.new')}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedReward.sourceMode === 'existing' ? (
                  <div>
                    <label className="ao-label">{t('cmp2.rich.packageContent')}</label>
                    <select
                      className="ao-input"
                      value={selectedReward.rewardId}
                      onChange={(event) => updateSelectedReward((reward) => ({ ...reward, rewardId: event.target.value }))}
                    >
                      <option value="">{t('cmp2.rich.selectExistingContent')}</option>
                      {getContent(selectedReward.rewardType).map((content) => (
                        <option key={content.id} value={content.id}>{content.name}</option>
                      ))}
                    </select>
                    <div className={cn('ao-codex', s.mt6)}>
                      {t('cmp2.rich.onlyPackageContent')}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className={cn('ao-overline', s.mb8)}>{t('cmp2.rich.inline', { type: typeLabel(selectedReward.rewardType, t) })}</div>
                    {renderInlineForm(selectedReward)}
                  </div>
                )}

                {(validation.rewardErrors[selectedReward.localId] || []).length > 0 && (
                  <div className={cn('ao-panel--inset', s.errorBox)}>
                    {(validation.rewardErrors[selectedReward.localId] || []).map((error, index) => (
                      <div key={`${error}-${index}`} className={cn('ao-codex', s.err)}>{error}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
