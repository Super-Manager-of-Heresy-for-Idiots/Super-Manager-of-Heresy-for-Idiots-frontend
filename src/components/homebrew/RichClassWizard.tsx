import { useEffect, useMemo, useState } from 'react';
import { FileUp, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { Rune, OrdoChip } from '@/components/ordo';
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

const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);
const REWARD_TYPES: { value: RichClassRewardType; label: string }[] = [
  { value: 'SKILL', label: 'Spell/Skill' },
  { value: 'FEAT', label: 'Feat' },
  { value: 'SUBCLASS', label: 'Subclass' },
  { value: 'BUFF_DEBUFF', label: 'Buff/Debuff' },
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

function rewardName(reward: DraftReward, existing?: ExistingContent) {
  if (reward.sourceMode === 'existing') return existing?.name || 'Existing content';
  if (reward.rewardType === 'SKILL') return reward.skill.name || 'New skill';
  if (reward.rewardType === 'FEAT') return reward.feat.name || 'New feat';
  if (reward.rewardType === 'SUBCLASS') return reward.subclass.name || 'New subclass';
  return reward.buffDebuff.name || 'New buff/debuff';
}

function typeLabel(type: RichClassRewardType) {
  return REWARD_TYPES.find((item) => item.value === type)?.label || type;
}

function validate(
  className: string,
  levelsByNumber: Record<number, DraftReward[]>,
  getExistingById: (type: RichClassRewardType, id: string) => ExistingContent | undefined,
): ValidationResult {
  const errors: string[] = [];
  const levelErrors: Record<number, number> = {};
  const rewardErrors: Record<string, string[]> = {};

  const addRewardError = (level: number, rewardId: string, message: string) => {
    rewardErrors[rewardId] = [...(rewardErrors[rewardId] || []), message];
    levelErrors[level] = (levelErrors[level] || 0) + 1;
  };

  if (!className.trim()) errors.push('Class name is required.');
  if (className.trim().length > 50) errors.push('Class name must be 50 characters or less.');

  Object.entries(levelsByNumber).forEach(([rawLevel, rewards]) => {
    const level = Number(rawLevel);
    if (level < 1 || level > 20) errors.push(`Invalid level ${rawLevel}.`);

    const seen = new Map<string, string>();
    rewards.forEach((reward) => {
      const sourceCount =
        (reward.sourceMode === 'existing' && reward.rewardId ? 1 : 0) +
        (reward.sourceMode === 'new' ? 1 : 0);

      if (sourceCount !== 1) {
        addRewardError(level, reward.localId, 'Reward must have exactly one source.');
      }

      if (reward.sourceMode === 'existing') {
        if (!reward.rewardId) addRewardError(level, reward.localId, 'Select existing package content.');
        const duplicateKey = `${reward.rewardType}:existing:${reward.rewardId}`;
        if (reward.rewardId && seen.has(duplicateKey)) {
          addRewardError(level, reward.localId, 'Duplicate reward in this level.');
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

        if (!name.trim()) addRewardError(level, reward.localId, `${typeLabel(reward.rewardType)} name is required.`);

        const duplicateKey = `${reward.rewardType}:new:${name.trim().toLowerCase()}`;
        if (name.trim() && seen.has(duplicateKey)) {
          addRewardError(level, reward.localId, 'Duplicate reward in this level.');
        }
        seen.set(duplicateKey, reward.localId);

        if (reward.rewardType === 'BUFF_DEBUFF') {
          const bd = reward.buffDebuff;
          if (bd.effectType === 'STAT_MODIFIER' && !bd.targetStatId) {
            addRewardError(level, reward.localId, 'STAT_MODIFIER requires a target stat.');
          }
        }

        if (reward.rewardType === 'SKILL') {
          reward.skill.effects.forEach((effect, index) => {
            const chance = Number(effect.chancePercent);
            if (Number.isNaN(chance) || chance < 0 || chance > 100) {
              addRewardError(level, reward.localId, `Effect ${index + 1} chance must be 0-100.`);
            }

            if (effect.sourceMode === 'existing') {
              if (!effect.buffDebuffId) addRewardError(level, reward.localId, `Effect ${index + 1} needs an existing buff/debuff.`);
              const existing = getExistingById('BUFF_DEBUFF', effect.buffDebuffId);
              if (existing && typeof existing.isBuff === 'boolean' && existing.isBuff !== (effect.effectRole === 'BUFF')) {
                addRewardError(level, reward.localId, `Effect ${index + 1} role does not match selected buff/debuff.`);
              }
            } else {
              const bd = effect.buffDebuff;
              if (!bd.name.trim()) addRewardError(level, reward.localId, `Effect ${index + 1} buff/debuff name is required.`);
              if (bd.effectType === 'STAT_MODIFIER' && !bd.targetStatId) {
                addRewardError(level, reward.localId, `Effect ${index + 1} STAT_MODIFIER requires a target stat.`);
              }
              if (bd.isBuff !== (effect.effectRole === 'BUFF')) {
                addRewardError(level, reward.localId, `Effect ${index + 1} role must match buff/debuff nature.`);
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

function validateImportPayload(value: unknown): string[] {
  const errors: string[] = [];
  const data = value as Partial<CreateRichCharacterClassRequest> | null;
  if (!data || typeof data !== 'object') return ['JSON root must be an object.'];
  if (!data.name || typeof data.name !== 'string') errors.push('Class name is required.');
  if (typeof data.name === 'string' && data.name.length > 50) errors.push('Class name must be 50 characters or less.');
  if (data.levels != null && !Array.isArray(data.levels)) errors.push('levels must be an array.');
  if (Array.isArray(data.levels)) {
    data.levels.forEach((level, index) => {
      if (level.level < 1 || level.level > 20) errors.push(`levels[${index}].level must be 1-20.`);
      if (!Array.isArray(level.rewards)) errors.push(`levels[${index}].rewards must be an array.`);
    });
  }
  return errors;
}

export function RichClassWizard({ open, onOpenChange, packageDetail, editingClass }: RichClassWizardProps) {
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

  const contentByType = packageDetail.contentByType || {};
  const getContent = (type: RichClassRewardType) => (contentByType[type as ContentType] || []) as ExistingContent[];
  const getExistingById = (type: RichClassRewardType, id: string) =>
    getContent(type).find((item) => item.id === id);
  const currentRewards = levelsByNumber[selectedLevel] || [];
  const selectedReward = currentRewards.find((reward) => reward.localId === selectedRewardId) || currentRewards[0] || null;

  const validation = useMemo(
    () => validate(className, levelsByNumber, getExistingById),
    [className, levelsByNumber, packageDetail],
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
      const errors = validateImportPayload(parsed);
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
      setImportError(error instanceof Error ? error.message : 'Failed to import JSON');
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
    <div style={{ display: 'grid', gap: 10 }}>
      <input
        className="ao-input"
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        placeholder="Buff/debuff name"
      />
      <textarea
        className="ao-input"
        value={value.description}
        onChange={(event) => onChange({ ...value, description: event.target.value })}
        rows={3}
        placeholder="Description"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
          <option value="true">Buff</option>
          <option value="false">Debuff</option>
        </select>
      </div>
      {value.effectType === 'STAT_MODIFIER' && (
        <select
          className="ao-input"
          value={value.targetStatId}
          onChange={(event) => onChange({ ...value, targetStatId: event.target.value })}
        >
          <option value="">Select target stat...</option>
          {(statTypes || []).map((stat) => (
            <option key={stat.id} value={stat.id}>{stat.name}</option>
          ))}
        </select>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input
          className="ao-input"
          type="number"
          value={value.modifierValue}
          onChange={(event) => onChange({ ...value, modifierValue: event.target.value })}
          placeholder="Modifier"
        />
        <input
          className="ao-input"
          type="number"
          value={value.durationRounds}
          onChange={(event) => onChange({ ...value, durationRounds: event.target.value })}
          placeholder="Duration rounds"
        />
      </div>
    </div>
  );

  const renderInlineForm = (reward: DraftReward) => {
    if (reward.rewardType === 'SKILL') {
      return (
        <div style={{ display: 'grid', gap: 12 }}>
          <input
            className="ao-input"
            value={reward.skill.name}
            onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, name: event.target.value } }))}
            placeholder="Skill name"
          />
          <textarea
            className="ao-input"
            value={reward.skill.description}
            onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, description: event.target.value } }))}
            rows={3}
            placeholder="Skill description"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              className="ao-input"
              value={reward.skill.skillType}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, skillType: event.target.value } }))}
              placeholder="Skill type"
            />
            <select
              className="ao-input"
              value={reward.skill.damageType}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, damageType: event.target.value } }))}
            >
              <option value="">No damage type</option>
              {DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              className="ao-input"
              value={reward.skill.damageDice}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, damageDice: event.target.value } }))}
              placeholder="Damage dice, e.g. 1d8"
            />
            <input
              className="ao-input"
              type="number"
              value={reward.skill.damageBonus}
              onChange={(event) => updateSelectedReward((item) => ({ ...item, skill: { ...item.skill, damageBonus: event.target.value } }))}
              placeholder="Damage bonus"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="ao-label" style={{ marginBottom: 0 }}>Effects</div>
              <div className="ao-codex">Use package buff/debuff content or create one inline.</div>
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
              <Plus size={13} /> Add
            </button>
          </div>

          {reward.skill.effects.map((effect, index) => (
            <div
              key={effect.localId}
              style={{ border: '1px solid var(--rule)', background: 'var(--abyss)', padding: 10, display: 'grid', gap: 10 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
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
                  <option value="BUFF">Buff</option>
                  <option value="DEBUFF">Debuff</option>
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
                  placeholder="Chance %"
                />
                <button
                  className="ao-iconbtn"
                  style={{ width: 40, height: 40, color: 'var(--ember)' }}
                  onClick={() =>
                    updateSelectedReward((item) => ({
                      ...item,
                      skill: {
                        ...item.skill,
                        effects: item.skill.effects.filter((row) => row.localId !== effect.localId),
                      },
                    }))
                  }
                  title="Remove effect"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['existing', 'new'] as SourceMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`ao-btn ao-btn--sm ${effect.sourceMode === mode ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                    style={{ flex: 1 }}
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
                    {mode === 'existing' ? 'Existing' : 'New'}
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
                  <option value="">Package buff/debuff...</option>
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
              <div className="ao-codex">Effect {index + 1}</div>
            </div>
          ))}
        </div>
      );
    }

    if (reward.rewardType === 'FEAT') {
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          <input className="ao-input" value={reward.feat.name} onChange={(event) => updateSelectedReward((item) => ({ ...item, feat: { ...item.feat, name: event.target.value } }))} placeholder="Feat name" />
          <textarea className="ao-input" value={reward.feat.description} onChange={(event) => updateSelectedReward((item) => ({ ...item, feat: { ...item.feat, description: event.target.value } }))} rows={3} placeholder="Description" />
          <input className="ao-input" value={reward.feat.prerequisites} onChange={(event) => updateSelectedReward((item) => ({ ...item, feat: { ...item.feat, prerequisites: event.target.value } }))} placeholder="Prerequisites" />
        </div>
      );
    }

    if (reward.rewardType === 'SUBCLASS') {
      return (
        <div style={{ display: 'grid', gap: 10 }}>
          <input className="ao-input" value={reward.subclass.name} onChange={(event) => updateSelectedReward((item) => ({ ...item, subclass: { ...item.subclass, name: event.target.value } }))} placeholder="Subclass name" />
          <textarea className="ao-input" value={reward.subclass.description} onChange={(event) => updateSelectedReward((item) => ({ ...item, subclass: { ...item.subclass, description: event.target.value } }))} rows={4} placeholder="Description" />
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
            <DialogTitle>Class Created</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="ao-panel" style={{ padding: 16 }}>
              <div className="ao-h5">{result.characterClass.name}</div>
              <div className="ao-codex" style={{ marginTop: 4 }}>{result.rewards.length} level rewards created</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
              {(['CHARACTER_CLASS', 'SKILL', 'FEAT', 'SUBCLASS', 'BUFF_DEBUFF'] as ContentType[]).map((type) => (
                <div key={type} className="ao-panel--inset" style={{ padding: 12, minHeight: 96 }}>
                  <div className="ao-overline" style={{ fontSize: 9 }}>{type.replace(/_/g, ' ')}</div>
                  <div className="ao-h6" style={{ marginTop: 4 }}>{(groups[type] || []).length}</div>
                  {(groups[type] || []).slice(0, 3).map((item) => (
                    <div key={item.id} className="ao-codex" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ao-btn ao-btn--primary" onClick={() => handleClose(false)}>Done</button>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingRight: 36 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <DialogTitle>{editingClass ? 'Edit Rich Homebrew Class' : 'Rich Homebrew Class'}</DialogTitle>
              <div className="ao-codex" style={{ marginTop: 5 }}>{packageDetail.title} / package-scoped content only</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="ao-btn ao-btn--ghost" style={{ cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                <FileUp size={14} />
                Import JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  disabled={isSaving}
                  onChange={(event) => {
                    handleImportJson(event.target.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                  style={{ display: 'none' }}
                />
              </label>
              <button className="ao-btn ao-btn--ghost" onClick={() => handleClose(false)}>Cancel</button>
              <button className="ao-btn ao-btn--primary" onClick={handleSave} disabled={!canSave}>
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Class
              </button>
            </div>
          </div>
        </DialogHeader>

        <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(360px, 1fr) 380px', height: 'calc(90vh - 76px)' }}>
          <aside className="ao-scroll" style={{ borderRight: '1px solid var(--rule)', overflow: 'auto', background: 'var(--abyss)' }}>
            <div style={{ padding: 12, display: 'grid', gap: 6 }}>
              {LEVELS.map((level) => {
                const count = (levelsByNumber[level] || []).length;
                const active = selectedLevel === level;
                const hasError = validation.levelErrors[level] > 0;
                return (
                  <button
                    key={level}
                    className={`ao-btn ao-btn--sm ${active ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                    style={{ justifyContent: 'space-between', width: '100%', borderColor: hasError ? 'var(--ember)' : undefined }}
                    onClick={() => {
                      setSelectedLevel(level);
                      setSelectedRewardId((levelsByNumber[level] || [])[0]?.localId || null);
                    }}
                  >
                    <span>Level {level}</span>
                    <span className="ao-codex">{hasError ? '!' : count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="ao-scroll" style={{ overflow: 'auto', padding: 18, display: 'grid', alignContent: 'start', gap: 16 }}>
            <div className="ao-panel" style={{ padding: 16, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 360px) 1fr', gap: 10 }}>
                <div>
                  <label className="ao-label">Class Name</label>
                  <input
                    className="ao-input"
                    value={className}
                    maxLength={50}
                    onChange={(event) => setClassName(event.target.value.slice(0, 50))}
                    placeholder="Chronomancer"
                  />
                </div>
                <div>
                  <label className="ao-label">Description</label>
                  <input
                    className="ao-input"
                    value={classDescription}
                    onChange={(event) => setClassDescription(event.target.value)}
                    placeholder="A class focused on time magic."
                  />
                </div>
              </div>
              {validation.errors.length > 0 && (
                <div style={{ display: 'grid', gap: 4 }}>
                  {validation.errors.slice(0, 5).map((error, index) => (
                    <div key={`${error}-${index}`} className="ao-codex" style={{ color: 'var(--ember)' }}>{error}</div>
                  ))}
                  {validation.errors.length > 5 && <div className="ao-codex">{validation.errors.length - 5} more validation issues</div>}
                </div>
              )}
              {editingClass && (
                <div className="ao-codex" style={{ color: 'var(--gold-pale)' }}>
                  Saving replaces the class level rewards with the plan currently shown in this editor.
                </div>
              )}
              {importError && <div className="ao-codex" style={{ color: 'var(--ember)' }}>{importError}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="ao-h5">Level {selectedLevel} Rewards</div>
                <div className="ao-codex">Add fixed rewards or player choice entries for this level.</div>
              </div>
              <button className="ao-btn ao-btn--primary" onClick={addReward}>
                <Plus size={14} /> Add Reward
              </button>
            </div>

            {currentRewards.length === 0 ? (
              <div className="ao-panel--inset" style={{ padding: 28, textAlign: 'center' }}>
                <div className="ao-italic">No rewards for this level.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {currentRewards.map((reward, index) => {
                  const existing = reward.sourceMode === 'existing' ? getExistingById(reward.rewardType, reward.rewardId) : undefined;
                  const selected = selectedReward?.localId === reward.localId;
                  const rowErrors = validation.rewardErrors[reward.localId] || [];
                  return (
                    <button
                      key={reward.localId}
                      className="ao-panel"
                      style={{
                        padding: 12,
                        textAlign: 'left',
                        borderColor: rowErrors.length ? 'var(--ember)' : selected ? 'var(--brass)' : 'var(--rule)',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedRewardId(reward.localId)}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 10, alignItems: 'center' }}>
                        <div className="ao-slot" style={{ width: 32, height: 32 }}>
                          <Rune kind={reward.rewardType === 'SKILL' ? 'eye' : reward.rewardType === 'FEAT' ? 'sigil-3' : reward.rewardType === 'SUBCLASS' ? 'cross-pat' : 'hex'} size={14} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--ink-bright)' }}>
                            {index + 1}. {rewardName(reward, existing)}
                          </div>
                          <div className="ao-codex" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {typeLabel(reward.rewardType)} / {reward.sourceMode === 'existing' ? 'existing package content' : 'inline creation'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          {reward.isChoice && <OrdoChip tone="arcane">Choice</OrdoChip>}
                          {rowErrors.length > 0 && <OrdoChip tone="ember">{rowErrors.length} issue</OrdoChip>}
                          <span
                            className="ao-iconbtn"
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
                            style={{ color: 'var(--ember)' }}
                            title="Remove reward"
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

          <aside className="ao-scroll" style={{ borderLeft: '1px solid var(--rule)', overflow: 'auto', padding: 16, background: 'var(--stone)' }}>
            {!selectedReward ? (
              <div className="ao-panel--inset" style={{ padding: 18 }}>
                <div className="ao-italic">Select or add a reward to edit it.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <div className="ao-overline">Reward Type</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
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
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--ink)' }}>
                  <input
                    type="checkbox"
                    checked={selectedReward.isChoice}
                    onChange={(event) => updateSelectedReward((reward) => ({ ...reward, isChoice: event.target.checked }))}
                  />
                  <span>Player chooses one of this reward group</span>
                </label>

                <div>
                  <div className="ao-overline">Source</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {(['existing', 'new'] as SourceMode[]).map((mode) => (
                      <button
                        key={mode}
                        className={`ao-btn ao-btn--sm ${selectedReward.sourceMode === mode ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                        style={{ flex: 1 }}
                        onClick={() => updateSelectedReward((reward) => ({ ...reward, sourceMode: mode }))}
                      >
                        {mode === 'existing' ? 'Existing' : 'New'}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedReward.sourceMode === 'existing' ? (
                  <div>
                    <label className="ao-label">Package Content</label>
                    <select
                      className="ao-input"
                      value={selectedReward.rewardId}
                      onChange={(event) => updateSelectedReward((reward) => ({ ...reward, rewardId: event.target.value }))}
                    >
                      <option value="">Select existing content...</option>
                      {getContent(selectedReward.rewardType).map((content) => (
                        <option key={content.id} value={content.id}>{content.name}</option>
                      ))}
                    </select>
                    <div className="ao-codex" style={{ marginTop: 6 }}>
                      Only content already attached to this package is listed.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="ao-overline" style={{ marginBottom: 8 }}>Inline {typeLabel(selectedReward.rewardType)}</div>
                    {renderInlineForm(selectedReward)}
                  </div>
                )}

                {(validation.rewardErrors[selectedReward.localId] || []).length > 0 && (
                  <div className="ao-panel--inset" style={{ padding: 10, borderColor: 'var(--ember)' }}>
                    {(validation.rewardErrors[selectedReward.localId] || []).map((error, index) => (
                      <div key={`${error}-${index}`} className="ao-codex" style={{ color: 'var(--ember)' }}>{error}</div>
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
