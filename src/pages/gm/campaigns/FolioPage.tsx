import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CSSProperties, ReactNode } from 'react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  Sigil,
  OrdoChip,
  OrdoDivider,
  Placeholder,
  OrdoAssetIcon,
} from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { CompatibilityBanner } from '@/components/CompatibilityBanner';
import { ExpandChevron, ExpandablePanel } from '@/components/common/ExpandableRow';
import { SpellDetailCard } from '@/components/spells/SpellDetailCard';
import {
  MulticlassPanel,
  AbilityCheckPanel,
  DamageHealModal,
  SpellbookAddModal,
  FeatureEffectsPanel,
  FeatureActionsPanel,
  PendingPromptsPanel,
  KnownFormsPanel,
  CompanionsPanel,
  FeatureChoicesPanel,
  CharacterFeatsPanel,
  EditableSheetField,
  SpellSlotsPanel,
} from '@/components/characters';
import {
  useCharacter,
  useCharacterResources,
  useCharacterWallet,
  useAbilityCheck,
  useUpdateCharacter,
  useRest,
} from '@/hooks/useCharacter';
import { useCharacterEffects } from '@/hooks/useEffects';
import { useEquippedInventory } from '@/hooks/useInventory';
import { useCharacterRewards } from '@/hooks/useLevelUp';
import { useCapabilityProfile, useClassFeatures } from '@/hooks/useCapabilityProfile';
import { useForgetSpell } from '@/hooks/useSpellbook';
import { useGlobalReferenceContent } from '@/hooks/useTemplates';
import { useAuthStore } from '@/store/authStore';
import { useT, useI18n } from '@/i18n/I18nContext';
import { useGameTerms } from '@/i18n/gameTerms';
import { REWARD_TYPE_LABELS } from '@/types';
import type { CharacterStatResponse, ItemInstanceResponse } from '@/types';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import s from './FolioPage.module.css';

/* ── helpers ─────────────────────────────────────────────────── */

function abilityMod(stat: CharacterStatResponse): number {
  const eff = stat.effectiveValue ?? stat.value;
  return Math.floor((eff - 10) / 2);
}

const WEAPON_SLOTS = ['MAIN_HAND', 'OFF_HAND'];

type TabId = 'spells' | 'features' | 'skills' | 'biography' | 'rewards';

const TABS: { id: TabId }[] = [
  { id: 'spells' },
  { id: 'features' },
  { id: 'skills' },
  { id: 'biography' },
  { id: 'rewards' },
];

/* A field whose value the character API does not (yet) expose. */
const NA = '—';

function IdentityField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="ao-overline">{label}</div>
      <div className={cn('ao-h6', s.idValue)}>{value}</div>
      {sub && <div className={cn('ao-codex', s.idSub)}>{sub}</div>}
    </div>
  );
}

/* Read-only proficiency row: a diamond pip + label + computed bonus. */
function ProfRow({ proficient, label, value }: { proficient: boolean; label: string; value: string }) {
  return (
    <div className={s.profRow}>
      <Rune kind="diamond-fill" size={8} color={proficient ? 'var(--gold-pale)' : 'var(--ink-ghost)'} />
      <span className={cn(s.profLabel, proficient && s.on)}>{label}</span>
      <span className={cn('ao-num', s.profValue, proficient && s.on)}>{value}</span>
    </div>
  );
}

/* Empty, clearly-marked section for data the API does not serve. */
function VoidBody({ note }: { note: string }) {
  return (
    <div className={s.voidBody}>
      <Sigil size={36} glyph="sigil-1" color="var(--ink-faint)" />
      <p className={cn('ao-italic', s.voidNote)}>
        {note}
      </p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */

export default function FolioPage() {
  const t = useT();
  const { lang } = useI18n();
  const gt = useGameTerms();
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
  const { user } = useAuthStore();

  const { data: character, isLoading, error, refetch } = useCharacter(campaignId!, characterId!);
  const { data: resources } = useCharacterResources(campaignId!, characterId!);
  const { data: wallet } = useCharacterWallet(campaignId!, characterId!);
  const { data: effects } = useCharacterEffects(campaignId!, characterId!);
  const { data: equipped } = useEquippedInventory(campaignId!, characterId!);
  const { data: rewards } = useCharacterRewards(characterId!);
  const { data: capability } = useCapabilityProfile(characterId);
  const { data: classFeatures } = useClassFeatures(characterId);
  const { data: refContent } = useGlobalReferenceContent();
  const abilityCheck = useAbilityCheck();
  const updateCharacter = useUpdateCharacter();
  const rest = useRest();
  const forgetSpell = useForgetSpell(campaignId!, characterId!);

  const saveSheetField = (field: 'proficiencies' | 'equipment', next: string) => {
    if (!campaignId || !characterId) return;
    updateCharacter.mutate({ campaignId, characterId, data: { [field]: next } });
  };

  const [tab, setTab] = useState<TabId>('spells');
  const [hpModalOpen, setHpModalOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<{ statName: string; total: number; breakdown: { source: string; value: number }[] } | null>(null);
  const [activeStatId, setActiveStatId] = useState<string | null>(null);
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const [spellbookOpen, setSpellbookOpen] = useState(false);

  const weapons = useMemo<ItemInstanceResponse[]>(
    () => (equipped ?? []).filter((i) => i.slot && WEAPON_SLOTS.includes(i.slot)),
    [equipped],
  );

  function runCheck(stat: CharacterStatResponse) {
    if (!campaignId || !characterId) return;
    setActiveStatId(stat.statTypeId);
    abilityCheck.mutate(
      { campaignId, characterId, statId: stat.statTypeId },
      {
        onSuccess: (res) => {
          const d = res.data;
          if (!d) return;
          setCheckResult({
            statName: d.statName,
            total: d.totalModifier,
            breakdown: [
              { source: t('camp2.folio.checkBase', { stat: d.statName }), value: d.modifier },
              { source: t('camp2.folio.checkLitany'), value: d.buffBonus },
              { source: t('camp2.folio.checkArsenal'), value: d.equipmentBonus },
            ],
          });
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.loadingPanel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.phTitle)} />
        <div className={cn('ao-ph', s.phLine1)} />
        <div className={cn('ao-ph', s.phLine2)} />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('camp2.folio.unsealed')}
        </p>
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        )}
      </div>
    );
  }

  const primaryClass = character.classLevels?.[0];
  // Owner / Chronicler (GM) / admin may spend & restore slots — viewers see them read-only.
  const isOwner = !!user && user.id === character.ownerId;
  const isChronicler = user?.role === 'GAME_MASTER' || user?.role === 'ADMIN';
  const canManageSlots = (isOwner || isChronicler) && character.status !== 'DEAD';
  const stats = character.stats ?? [];
  const currentHp = character.currentHp ?? 0;
  const maxHp = character.maxHp ?? 0;
  const hpPct = maxHp > 0 ? Math.min(100, (currentHp / maxHp) * 100) : 0;
  const snap = character.raceSnapshot;
  const lineageName = snap?.lineageName ?? null;
  const walkSpeed = snap?.speed?.walk ?? null;
  const extraSpeeds = snap
    ? ([
        ['Fly', snap.speed.fly],
        ['Swim', snap.speed.swim],
        ['Climb', snap.speed.climb],
        ['Burrow', snap.speed.burrow],
      ] as const).filter(([, v]) => v != null && v > 0)
    : [];
  const raceTraits = snap?.traitNames ?? [];

  /* ── rich sheet fields (served inline by CharacterResponse) ── */
  const tempHp = character.tempHp ?? 0;
  const armorClass = character.armorClass ?? null;
  const alignment = character.alignment ?? null;
  const background = character.background ?? null;
  const biography = character.biography ?? null;
  const features = character.features ?? null;
  const attacks = character.attacks ?? [];
  const knownSpells = character.knownSpells ?? [];
  const skillProficiencies = character.skillProficiencies ?? [];
  const savingThrows = character.savingThrowProficiencyStatNames ?? [];
  const inspiration = character.inspiration ?? false;
  const deathSuccesses = character.deathSaveSuccesses ?? 0;
  const deathFailures = character.deathSaveFailures ?? 0;
  const hitDiceLabel = character.hitDiceTotal ?? character.hitDiceType ?? NA;

  const profBonus = Math.floor((character.totalLevel - 1) / 4) + 2;
  const statByName = new Map(stats.map((st) => [st.statTypeName.toLowerCase(), st]));
  const dexStat = statByName.get('dexterity') ?? stats.find((st) => st.statTypeName.toLowerCase().startsWith('dex'));
  const initiative = dexStat ? abilityMod(dexStat) : null;
  // skillId → governing stat name, from reference skills.
  const skillGovernByName = new Map((refContent?.skills ?? []).map((sk) => [sk.id, sk.governingStatName]));

  function skillModifier(skillId: string): number | null {
    const govName = skillGovernByName.get(skillId);
    if (!govName) return null;
    const stat = statByName.get(govName.toLowerCase());
    if (!stat) return null;
    return abilityMod(stat) + profBonus;
  }
  const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

  /* ── read-only mirror of the template/forge sheet ─────────── */
  const proficiencies = character.proficiencies ?? null;
  const equipment = character.equipment ?? null;
  const refSkills = refContent?.skills ?? [];
  const profSkillIds = new Set(skillProficiencies.map((sp) => sp.skillId));
  const saveProfByName = new Set(savingThrows.map((n) => n.toLowerCase()));
  // skills grouped under the stat that governs them
  function skillsForStat(statName: string) {
    const key = statName.toLowerCase();
    return refSkills.filter((sk) => (sk.governingStatName ?? '').toLowerCase() === key);
  }
  // passive perception = 10 + WIS mod + (proficient ? prof : 0)
  const perceptionSkill = refSkills.find((sk) => sk.name.toLowerCase().includes('percept'));
  const wisStat = statByName.get('wisdom') ?? stats.find((st) => st.statTypeName.toLowerCase().startsWith('wis'));
  const wisMod = wisStat ? abilityMod(wisStat) : 0;
  const perceptionProf = perceptionSkill ? profSkillIds.has(perceptionSkill.id) : false;
  const passivePerception = 10 + wisMod + (perceptionProf ? profBonus : 0);

  /* ── class-aware tab visibility ───────────────────────────── */
  // The Spells tab is shown only for spellcasters. A non-caster (Barbarian/Monk/Rogue…) never sees it.
  // Fallback to knownSpells so a legacy/racial caster with spells but no resolved class profile keeps it.
  const isCaster = capability?.spellcasting?.caster ?? false;
  const showSpellsTab = isCaster || knownSpells.length > 0;
  const visibleTabs = TABS.filter((td) => td.id !== 'spells' || showSpellsTab);
  const effectiveTab: TabId = visibleTabs.some((td) => td.id === tab)
    ? tab
    : (visibleTabs[0]?.id ?? 'features');

  /* ── tab content (left main column) ───────────────────────── */
  function renderTab(): ReactNode {
    if (!character) return null;
    switch (effectiveTab) {
      case 'spells': {
        const sc = capability?.spellcasting;
        const cantrips = knownSpells.filter((sp) => sp.level === 0);
        const leveled = [...knownSpells].filter((sp) => sp.level > 0).sort((a, b) => a.level - b.level);
        const abilityName = sc
          ? (lang === 'ru' ? sc.abilityNameRu : sc.abilityNameEn) ?? sc.abilityNameEn ?? sc.abilityNameRu
          : null;
        const casterTypeKnown = ['FULL', 'HALF', 'THIRD', 'PACT', 'MULTI'].includes(sc?.casterType ?? '');
        const renderSpellRow = (sp: (typeof knownSpells)[number]) => {
          const isOpen = expandedSpellId === sp.spellId;
          return (
            <div key={sp.spellId}>
              <div
                className={cn(s.spellRow, s.spellRowClickable, isOpen && s.spellRowOpen)}
                onClick={() => setExpandedSpellId(isOpen ? null : sp.spellId)}
              >
                <ExpandChevron open={isOpen} size={13} />
                <span className={s.spellIcon} aria-hidden="true">
                  <OrdoAssetIcon
                    names={[sp.name]}
                    source="spells"
                    fallback={<Rune kind="hex" size={12} color="var(--arcane)" />}
                  />
                </span>
                <span className={cn('ao-num', s.spellLevel)}>
                  {sp.level === 0 ? t('camp2.folio.spells.cantrip') : t('camp2.folio.spells.levelShort', { level: sp.level })}
                </span>
                <span className={s.spellName}>{sp.name}</span>
                {sp.school && <span className={cn('ao-italic', s.spellSchool)}>{sp.school}</span>}
                {canManageSlots && (
                  <button
                    className={cn('ao-btn', 'ao-btn--ghost', 'ao-btn--sm', s.spellRemoveBtn)}
                    title={t('spellbook.forget')}
                    aria-label={t('spellbook.forget')}
                    disabled={forgetSpell.isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      forgetSpell.mutate(sp.spellId);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              <ExpandablePanel open={isOpen} innerClassName={s.spellDetailInner}>
                <SpellDetailCard spellId={sp.spellId} campaignId={campaignId} />
              </ExpandablePanel>
            </div>
          );
        };
        return (
          <>
            <PanelHeader title={t('camp2.folio.spells.title')} sub={t('camp2.folio.spells.sub', { count: knownSpells.length })} glyph="hex" tone="arcane" />
            {canManageSlots && sc?.caster && (
              <div className={s.spellToolbar}>
                <button className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--primary')} onClick={() => setSpellbookOpen(true)}>
                  {t('spellbook.button.add')}
                </button>
              </div>
            )}
            {sc?.caster && (
              <div className={s.spellStatBar}>
                <div className={s.spellStatCell}>
                  <div className="ao-overline">{t('camp2.folio.spells.stat.ability')}</div>
                  <div className={s.spellStatValueSm}>{abilityName ?? NA}</div>
                </div>
                <div className={s.spellStatCell}>
                  <div className="ao-overline">{t('camp2.folio.spells.stat.dc')}</div>
                  <div className={s.spellStatValue}>{sc.spellSaveDc ?? NA}</div>
                </div>
                <div className={s.spellStatCell}>
                  <div className="ao-overline">{t('camp2.folio.spells.stat.attack')}</div>
                  <div className={s.spellStatValue}>{sc.spellAttackBonus != null ? fmtMod(sc.spellAttackBonus) : NA}</div>
                </div>
                <div className={s.spellStatCell}>
                  <div className="ao-overline">{t('camp2.folio.spells.stat.caster')}</div>
                  <div className={s.spellStatValueSm}>
                    {casterTypeKnown ? t(`camp2.folio.spells.casterType.${sc.casterType}`) : (sc.casterType || NA)}
                  </div>
                </div>
                {sc.preparation && (
                  <div className={s.spellStatCell}>
                    <div className="ao-overline">{t('camp2.folio.spells.stat.preparation')}</div>
                    <div className={s.spellStatValueSm}>{t(`camp2.folio.spells.preparation.${sc.preparation}`)}</div>
                  </div>
                )}
              </div>
            )}
            {cantrips.length > 0 && (
              <div className={s.spellsKnown}>
                <div className={cn('ao-overline', s.mb10)}>{t('camp2.folio.spells.cantrips')}</div>
                <div className={s.spellList}>{cantrips.map(renderSpellRow)}</div>
              </div>
            )}
            {leveled.length > 0 && (
              <div className={s.spellsKnown}>
                <div className={cn('ao-overline', s.mb10)}>{t('camp2.folio.spells.known')}</div>
                <div className={s.spellList}>{leveled.map(renderSpellRow)}</div>
              </div>
            )}
            {knownSpells.length === 0 && <VoidBody note={t('camp2.folio.spells.void')} />}
            <SpellSlotsPanel characterId={characterId!} canManage={canManageSlots} className={s.slotsBlock} />
          </>
        );
      }
      case 'features':
        return (
          <>
            <PanelHeader
              title={t('camp2.folio.features.title')}
              sub={t('camp2.folio.features.sub')}
              glyph="sigil-3"
              right={
                <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/rewards`)}>
                  <Rune kind="arrow-r" size={9} /> {t('camp2.folio.features.rewards')}
                </button>
              }
            />
            {!character.classLevels || character.classLevels.length === 0 ? (
              <VoidBody note={t('camp2.folio.features.void')} />
            ) : (
              <div className={s.colFlex}>
                {character.classLevels.map((c, i) => (
                  <div key={c.classId} className={cn(s.classRow, i < character.classLevels.length - 1 && s.divided)}>
                    <div className={s.classRowHead}>
                      <span className={cn('ao-h6', s['h6-15'])}>{c.className}</span>
                      <span className={cn('ao-num', s.classLevel)}>{t('camp2.folio.features.classLevel', { level: c.classLevel })}</span>
                    </div>
                  </div>
                ))}
                {(classFeatures ?? []).length > 0 && (
                  <div className={s.featuresBlock}>
                    <div className={cn('ao-overline', s.mb10)}>{t('camp2.folio.features.abilities')}</div>
                    <div className={s.spellList}>
                      {(classFeatures ?? []).map((f) => {
                        const isOpen = expandedFeatureId === f.id;
                        return (
                          <div key={f.id}>
                            <div
                              className={cn(s.spellRow, s.spellRowClickable, isOpen && s.spellRowOpen)}
                              onClick={() => setExpandedFeatureId(isOpen ? null : f.id)}
                            >
                              <ExpandChevron open={isOpen} size={13} />
                              {f.level != null && (
                                <span className={cn('ao-num', s.spellLevel)}>{t('camp2.folio.spells.levelShort', { level: f.level })}</span>
                              )}
                              <span className={s.spellName}>{f.title}</span>
                            </div>
                            <ExpandablePanel open={isOpen} innerClassName={s.spellDetailInner}>
                              <p className={cn('ao-italic', s.featuresText)}>{f.description || NA}</p>
                            </ExpandablePanel>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {features && (
                  <div className={s.featuresBlock}>
                    <div className={cn('ao-overline', s.mb8)}>{t('camp2.folio.features.recorded')}</div>
                    <p className={cn('ao-italic', s.featuresText)}>
                      {features}
                    </p>
                  </div>
                )}
                <div className={s.featuresBlock}>
                  <CharacterFeatsPanel
                    campaignId={campaignId!}
                    characterId={characterId!}
                    canManage={canManageSlots}
                  />
                </div>
              </div>
            )}
          </>
        );
      case 'skills':
        return (
          <>
            <PanelHeader title={t('camp2.folio.skills.title')} sub={t('camp2.folio.skills.sub', { count: skillProficiencies.length, bonus: profBonus })} glyph="eye" />
            {skillProficiencies.length === 0 ? (
              <VoidBody note={t('camp2.folio.skills.void')} />
            ) : (
              <table className="ao-table">
                <thead>
                  <tr><th>{t('camp2.folio.skills.col.skill')}</th><th>{t('camp2.folio.skills.col.source')}</th><th className={s.thRight}>{t('camp2.folio.skills.col.mod')}</th></tr>
                </thead>
                <tbody>
                  {[...skillProficiencies].sort((a, b) => a.skillName.localeCompare(b.skillName)).map((sp) => {
                    const mod = skillModifier(sp.skillId);
                    return (
                      <tr key={sp.skillId}>
                        <td className={s.skillName}>{gt.skill(sp.skillName)}</td>
                        <td className={cn('ao-italic', s.skillSource)}>{sp.source.toLowerCase()}</td>
                        <td className={cn('ao-num', s.skillMod, mod == null && s.na)}>
                          {mod != null ? fmtMod(mod) : NA}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        );
      case 'biography':
        return (
          <>
            <PanelHeader title={t('camp2.folio.bio.title')} sub={t('camp2.folio.bio.sub')} glyph="book" />
            <div className={s.bioBody}>
              <div className={cn('ao-rgrid', s.grid2)}>
                <IdentityField label={t('camp2.folio.bio.background')} value={background?.name ?? NA} sub={background?.skillProficiencyNames?.length ? background.skillProficiencyNames.join(', ') : t('camp2.folio.bio.noGrantedSkills')} />
                <IdentityField label={t('camp2.folio.bio.alignment')} value={alignment ? gt.alignment(alignment) : NA} sub={t('camp2.folio.bio.moralCompass')} />
                {snap && (
                  <>
                    <IdentityField label={t('camp2.folio.bio.race')} value={snap.raceName} sub={lineageName ?? t('camp2.folio.bio.noLineage')} />
                    <IdentityField label={t('camp2.folio.bio.size')} value={gt.size(snap.size)} sub={snap.darkvisionRange ? t('camp2.folio.darkvision', { range: snap.darkvisionRange }) : t('camp2.folio.noDarkvision')} />
                    <IdentityField label={t('camp2.folio.bio.speed')} value={walkSpeed != null ? t('camp2.folio.ft', { n: walkSpeed }) : NA} sub={extraSpeeds.length ? extraSpeeds.map(([k, v]) => `${gt.movement(k)} ${t('camp2.folio.ft', { n: v ?? 0 })}`).join(' · ') : t('camp2.folio.bio.walking')} />
                    <IdentityField label={t('camp2.folio.bio.asiBonuses')} value={snap.allowAbilityScoreBonuses ? t('camp2.folio.bio.allowed') : t('camp2.folio.bio.fixed')} sub={t('camp2.folio.bio.lineageRule')} />
                  </>
                )}
              </div>

              {background?.description && (
                <div>
                  <div className={cn('ao-overline', s.mb6)}>{t('camp2.folio.bio.background')}</div>
                  <p className={cn('ao-italic', s.bioText)}>{background.description}</p>
                </div>
              )}

              {biography && (biography.personalityTraits || biography.ideals || biography.bonds || biography.flaws) && (
                <div className={cn('ao-rgrid', s.grid2)}>
                  {([
                    ['camp2.folio.bio.personalityTraits', biography.personalityTraits],
                    ['camp2.folio.bio.ideals', biography.ideals],
                    ['camp2.folio.bio.bonds', biography.bonds],
                    ['camp2.folio.bio.flaws', biography.flaws],
                  ] as const).filter(([, v]) => !!v).map(([label, v]) => (
                    <div key={label}>
                      <div className={cn('ao-overline', s.mb6)}>{t(label)}</div>
                      <p className={cn('ao-italic', s.bioTextPre)}>{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {raceTraits.length > 0 && (
                <div>
                  <div className={cn('ao-overline', s.mb8)}>{t('camp2.folio.bio.racialTraits')}</div>
                  <div className={s.chipWrap}>
                    {raceTraits.map((trait) => (
                      <OrdoChip key={trait} tone="gold" glyph="diamond-fill">{trait}</OrdoChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        );
      case 'rewards':
        return (
          <>
            <PanelHeader title={t('camp2.folio.rewards.title')} sub={t('camp2.folio.rewards.sub')} glyph="sigil-3" tone="gold" />
            {!rewards || rewards.classBreakdown.length === 0 ? (
              <VoidBody note={t('camp2.folio.rewards.void')} />
            ) : (
              <div className={s.colFlex}>
                {rewards.classBreakdown.map((cls, ci) => (
                  <div key={cls.classId} className={cn(s.rewardClass, ci < rewards.classBreakdown.length - 1 && s.divided)}>
                    <div className={s.rewardClassHead}>
                      <span className={cn('ao-h6', s['h6-15'])}>{cls.className}</span>
                      <span className={cn('ao-num', s.classLevel)}>
                        {t('camp2.folio.features.classLevel', { level: cls.classLevel })}{cls.subclass ? ` · ${cls.subclass.name}` : ''}
                      </span>
                    </div>
                    {Object.keys(cls.rewardsByType || {}).length === 0 ? (
                      <p className={cn('ao-italic', s.rewardNoClass)}>{t('camp2.folio.rewards.noClass')}</p>
                    ) : (
                      Object.entries(cls.rewardsByType).map(([type, rwds]) => (
                        <div key={type} className={s.rewardType}>
                          <div className={cn('ao-overline', s.mb6)}>{REWARD_TYPE_LABELS[type] ?? type}</div>
                          {rwds.map((r, idx) => (
                            <div key={`${r.name}-${idx}`} className={s.rewardItem}>
                              <Rune kind="diamond-fill" size={9} color="var(--gold-pale)" />
                              <span className={s.rewardName}>{r.name}</span>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      <CompatibilityBanner character={character} />
      {/* ── Page header (TopBar) ───────────────────────────────── */}
      <div className={s.topBar}>
        <div>
          <p className={cn('ao-overline', s.titleOverline)}>{t('camp2.folio.overline')}</p>
          <div className={s.titleRow}>
            <h3 className="ao-h3">{character.name}</h3>
            <CharStatusBadge status={character.status ?? 'ACTIVE'} />
          </div>
          <p className={cn('ao-codex', s.titleCodex)}>№ {character.id.slice(0, 8)} · {character.ownerUsername}</p>
        </div>
        <div className={s.headerActions}>
          <button className="ao-btn ao-btn--primary" onClick={() => setHpModalOpen(true)}>
            <Rune kind="flame" size={11} /> <span className={s.btnLabel}>{t('camp2.folio.adjustVitae')}</span>
          </button>
          {canManageSlots && (
            <>
              <button
                className="ao-btn ao-btn--ghost"
                disabled={rest.isPending}
                onClick={() => rest.mutate({ campaignId: campaignId!, characterId: characterId!, type: 'long' })}
              >
                <span className={s.btnLabel}>{t('camp2.folio.rest.long')}</span>
              </button>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                disabled={rest.isPending}
                onClick={() => rest.mutate({ campaignId: campaignId!, characterId: characterId!, type: 'short' })}
              >
                {t('camp2.folio.rest.short')}
              </button>
            </>
          )}
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}`)}>
            <Rune kind="arrow-l" size={13} /> <span className={s.btnLabel}>{t('camp2.back.character')}</span>
          </button>
        </div>
      </div>

      {/* ── Mobile section nav (sticky in-page jumps) ──────────── */}
      <nav className={s.sectionNav} aria-label={t('camp2.folio.nav.label')}>
        <a className={s.sectionNavLink} href="#folio-identity">{t('camp2.folio.nav.identity')}</a>
        <a className={s.sectionNavLink} href="#folio-holdings">{t('camp2.folio.nav.holdings')}</a>
        <a className={s.sectionNavLink} href="#folio-abilities">{t('camp2.folio.nav.abilities')}</a>
        <a className={s.sectionNavLink} href="#folio-proficiencies">{t('camp2.folio.nav.proficiencies')}</a>
        <a className={s.sectionNavLink} href="#folio-codex">{t('camp2.folio.nav.codex')}</a>
      </nav>

      {/* ── HEADER ROW: Identity + Oath ────────────────────────── */}
      <div id="folio-identity" className={cn('ao-rgrid', s.headerGrid)}>
        {/* Identity */}
        <OrdoPanel frame padding={0}>
          <div className={s.idBody}>
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                className={s.portrait}
              />
            ) : (
              <Placeholder className={s.portraitPh}>{t('camp2.folio.portrait')}</Placeholder>
            )}
            <div className={s.idMain}>
              <div className={s.idChips}>
                <span className="ao-codex">№ {character.id.slice(0, 8)}</span>
                <CharStatusBadge status={character.status ?? 'ACTIVE'} />
                {alignment && <OrdoChip tone="gold" glyph="diamond-fill">{alignment}</OrdoChip>}
              </div>
              <div className={cn('ao-h3', s.idName)}>{character.name}</div>
              <div className={cn('ao-italic', s.idSubtitle)}>
                {character.race?.name ?? t('camp2.folio.unknown')}{lineageName ? ` (${lineageName})` : ''} {primaryClass ? `· ${primaryClass.className}` : ''}{background ? ` · ${background.name}` : ''}
              </div>

              <OrdoDivider glyph="diamond-fill" color="var(--bronze)" />

              <div className={cn('ao-rgrid', 'ao-rgrid--keep2', s.idGrid4)}>
                <IdentityField label={t('camp2.folio.id.label')} value={primaryClass?.className ?? t('camp2.folio.unclassed')} sub={primaryClass ? t('camp2.folio.id.level', { level: primaryClass.classLevel }) : NA} />
                <IdentityField label={t('camp2.folio.id.race')} value={character.race?.name ?? t('camp2.folio.unknown')} sub={lineageName ?? (character.race?.description ? character.race.description.slice(0, 28) : NA)} />
                <IdentityField label={t('camp2.folio.id.size')} value={snap ? gt.size(snap.size) : NA} sub={snap?.darkvisionRange ? t('camp2.folio.darkvision', { range: snap.darkvisionRange }) : t('camp2.folio.noDarkvision')} />
                <IdentityField label={t('camp2.folio.id.speed')} value={walkSpeed != null ? t('camp2.folio.ft', { n: walkSpeed }) : NA} sub={extraSpeeds.length ? extraSpeeds.map(([k, v]) => `${gt.movement(k)} ${v}`).join(' · ') : t('camp2.folio.walk')} />
              </div>
            </div>
          </div>

          {/* Level / XP / HP rail */}
          <div className={cn('ao-rgrid', s.rail)}>
            <div className={s.railLevel}>
              <Sigil size={56} glyph="sigil-3" />
              <div>
                <div className="ao-overline">{t('camp2.folio.level')}</div>
                <div className={s.levelNum}>{character.totalLevel}</div>
              </div>
            </div>
            <button
              onClick={() => setHpModalOpen(true)}
              className={s.railHp}
              title={t('camp2.folio.adjustVitae')}
            >
              <div className={s.railLine}>
                <span className="ao-overline">{t('camp2.folio.vitaeHp')}</span>
                <span className={cn('ao-num', s.hpValue)}>{currentHp}<span className={s.hpDenom}> / {maxHp}</span></span>
              </div>
              <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--ember" style={{ width: `${hpPct}%` }} /></div>
              <div className={s.railLineFoot}>
                <span className="ao-codex">{t('camp2.folio.temp')} +{tempHp} · {t('camp2.folio.death')} {deathSuccesses}✓ / {deathFailures}✗</span>
                <span className="ao-codex">{t('camp2.folio.hitDice')} {hitDiceLabel}</span>
              </div>
            </button>
            <div className={s.railXp}>
              <div className={s.railLine}>
                <span className="ao-overline">{t('camp2.folio.ascentXp')}</span>
                <span className={cn('ao-num', s.xpValue)}>{(character.experience ?? 0).toLocaleString()}</span>
              </div>
              <div className="ao-bar"><div className={cn('ao-bar-fill ao-bar-fill--gold', s.xpBarFill)} /></div>
              <div className={s.railLineFoot}>
                <span className={cn('ao-codex', inspiration && s.inspirationOn)}>
                  {t('camp2.folio.inspiration')} {inspiration ? t('camp2.folio.yes') : t('camp2.folio.no')}
                </span>
                <span className="ao-codex">{t('camp2.folio.xpEarned', { xp: (character.experience ?? 0).toLocaleString() })}</span>
              </div>
            </div>
          </div>
        </OrdoPanel>

        {/* Saves & Tier — not served by API */}
        <OrdoPanel frame padding={0} className={s.savesPanel}>
          <PanelHeader title={t('camp2.folio.savesTier')} glyph="helm" tone="gold" />
          <div className={cn('ao-rgrid', 'ao-rgrid--keep2', s.savesGrid)}>
            {[
              { label: t('camp2.folio.armour'), value: armorClass != null ? `${armorClass}` : NA },
              { label: t('camp2.folio.init'), value: initiative != null ? fmtMod(initiative) : NA },
              { label: t('camp2.folio.speedShort'), value: walkSpeed != null ? `${walkSpeed}` : NA },
              { label: t('camp2.folio.prof'), value: `+${profBonus}` },
            ].map((c) => (
              <div key={c.label} className={s.saveCell}>
                <div className={cn('ao-overline', s.saveCellLabel)}>{c.label}</div>
                <div className={s.saveCellValue}>{c.value}</div>
              </div>
            ))}
          </div>
        </OrdoPanel>

      </div>

      {/* ── TREASURY · ARSENAL · RESOURCES ──────────────────────── */}
      <div id="folio-holdings" className={cn('ao-rgrid', s.threeGrid)}>
        {/* Treasury · Coin */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.folio.treasury')}
            sub={t('camp2.folio.treasurySub')}
            glyph="coin"
            tone="gold"
            right={
              <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/wallet`)}>
                <Rune kind="arrow-r" size={9} /> {t('camp2.folio.wallet')}
              </button>
            }
          />
          {(wallet ?? []).length === 0 ? (
            <VoidBody note={t('camp2.folio.noCoin')} />
          ) : (
            <div className={s.coinBody}>
              {(wallet ?? []).filter((entry) => entry.amount !== 0).map((entry) => (
                <div key={entry.currencyTypeId} className={s.coinRow}>
                  <Rune kind="coin" size={11} color="var(--gold-pale)" />
                  <span className={s.coinName}>{entry.currencyName}</span>
                  <span className={cn('ao-num', s.coinAmount)}>{entry.amount.toLocaleString()}</span>
                </div>
              ))}
              {/* Reduced gold-equivalent total — full ledger lives on the wallet page. */}
              <div className={s.coinTotalRow}>
                <span className={cn('ao-overline', s.coinTotalLabel)}>{t('camp.wallet.total')}</span>
                <span className={cn('ao-num', s.coinTotalValue)}>
                  {t('camp2.folio.coinTotal', { amount: (wallet ?? []).reduce((acc, w) => acc + (w.goldEquivalent ?? 0), 0).toLocaleString() })}
                </span>
              </div>
            </div>
          )}
        </OrdoPanel>

        {/* Arsenal · Sanctioned Strikes */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.folio.combat.title')}
            sub={t('camp2.folio.combat.sub', {
              attacks: `${attacks.length} ${attacks.length === 1 ? t('camp2.folio.combat.attackOne') : t('camp2.folio.combat.attackMany')}`,
              weapons: `${weapons.length} ${weapons.length === 1 ? t('camp2.folio.combat.bladeOne') : t('camp2.folio.combat.bladeMany')}`,
            })}
            glyph="sword"
            right={
              <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/inventory`)}>
                <Rune kind="arrow-r" size={9} /> {t('camp2.folio.combat.arsenal')}
              </button>
            }
          />
          {attacks.length === 0 && weapons.length === 0 ? (
            <VoidBody note={t('camp2.folio.combat.void')} />
          ) : (
            <table className="ao-table">
              <thead>
                <tr><th>{t('camp2.folio.combat.col.attack')}</th><th>{t('camp2.folio.combat.col.hit')}</th><th>{t('camp2.folio.combat.col.damage')}</th><th>{t('camp2.folio.combat.col.type')}</th></tr>
              </thead>
              <tbody>
                {attacks.map((a, i) => (
                  <tr key={`atk-${i}`}>
                    <td className={s.atkName}>{a.name}</td>
                    <td className={cn('ao-num', s.atkHit)}>{a.attackBonus}</td>
                    <td className={cn('ao-num', s.atkDamage)}>{a.damage}</td>
                    <td className={cn('ao-italic', s.atkType)}>{a.damageType}</td>
                  </tr>
                ))}
                {weapons.map((w) => (
                  <tr key={w.id}>
                    <td className={s.weaponName}>
                      {w.displayName}
                      {w.isUnique && <span className={s.attunedChip}><OrdoChip tone="gold" glyph="diamond-fill">{t('camp2.folio.combat.attuned')}</OrdoChip></span>}
                    </td>
                    <td className={cn('ao-num', s.weaponNa)}>{NA}</td>
                    <td className={cn('ao-num', s.weaponNa)}>{NA}</td>
                    <td className={cn('ao-italic', s.atkType)}>{w.itemTypeName ?? w.slot?.replace('_', ' ').toLowerCase() ?? NA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </OrdoPanel>

        {/* Resources · Reserves */}
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp2.folio.resourcesTitle')}
            sub={t('camp2.folio.resourcesSub')}
            glyph="sigil-2"
            tone="arcane"
            right={
              <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/resources`)}>
                <Rune kind="arrow-r" size={9} /> {t('camp2.folio.resourcesLink')}
              </button>
            }
          />
          {(!resources || resources.length === 0) ? (
            <VoidBody note={t('camp2.folio.noResources')} />
          ) : (
            <div className={s.resBody}>
              {resources.map((r, i) => {
                const pct = r.maxValue > 0 ? Math.min(100, (r.currentValue / r.maxValue) * 100) : 0;
                const tone = r.color || 'var(--arcane)';
                return (
                  <div key={r.id} className={cn(s.resRow, i < resources.length - 1 && s.divided)}>
                    <div className={s.resHead}>
                      <Rune kind="sigil-2" size={11} color={tone} />
                      <span className={s.resName}>{r.name}</span>
                      <span className={cn('ao-num', s.resValue)} style={{ color: tone }}>{r.currentValue}<span className={s.resDenom}> / {r.maxValue}</span></span>
                    </div>
                    <div className="ao-bar"><div className="ao-bar-fill" style={{ width: `${pct}%`, background: tone }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </OrdoPanel>
      </div>

      {/* ── ABILITIES & COMBAT ─────────────────────────────────── */}
      <div id="folio-abilities" className={s.dividerWrap}>
        <OrdoDivider glyph="diamond-fill" color="var(--bronze)">{t('camp2.folio.abilitiesCombat')}</OrdoDivider>
      </div>

      <div className={cn('ao-rgrid', s.statGrid, s.abilityGrid)}>
        {stats.length === 0 && (
          <p className={cn('ao-italic', s.spanAll)}>
            {t('camp2.folio.noAbilities')}
          </p>
        )}
        {stats.map((stat) => {
          const mod = abilityMod(stat);
          const eff = stat.effectiveValue ?? stat.value;
          const active = activeStatId === stat.statTypeId;
          return (
            <button
              key={stat.id}
              onClick={() => runCheck(stat)}
              className={cn('ao-stat ao-frame', s.statBtn, active && s.active)}
              title={t('camp2.folio.reckonCheck')}
            >
              <span className="ao-frame-c" />
              <div className="ao-stat-label">{gt.abilityAbbr(stat.statTypeName)}</div>
              <div className="ao-stat-value">{eff}</div>
              <div className={cn('ao-stat-mod', s.statMod, mod < 0 && s.neg)}>{mod >= 0 ? `+${mod}` : mod}</div>
            </button>
          );
        })}

        {/* Saving Throws */}
        <OrdoPanel padding={14}>
          <div className={cn('ao-overline', s.mb8)}>{t('camp2.folio.savingThrows')}</div>
          {savingThrows.length === 0 ? (
            <p className={cn('ao-italic', s.smallNote)}>{t('camp2.folio.noSavingThrows')}</p>
          ) : (
            <div className={s.savesList}>
              {savingThrows.map((name) => {
                const stat = statByName.get(name.toLowerCase());
                const mod = stat ? abilityMod(stat) + profBonus : null;
                return (
                  <div key={name} className={s.saveRow}>
                    <Rune kind="diamond-fill" size={9} color="var(--gold-pale)" />
                    <span className={s.saveRowLabel}>{gt.ability(name)}</span>
                    <span className={cn('ao-num', s.saveRowValue)}>{mod != null ? fmtMod(mod) : NA}</span>
                  </div>
                );
              })}
            </div>
          )}
        </OrdoPanel>
      </div>

      {/* Ability-check breakdown reveal */}
      {(abilityCheck.isPending || checkResult) && (
        <div className={s.checkReveal}>
          {abilityCheck.isPending ? (
            <OrdoPanel frame className={s.checkPanel}>
              <div className={s.checkPanelBody}>
                <p className={cn('ao-italic', s.checkPanelNote)}>{t('camp2.folio.consulting')}</p>
              </div>
            </OrdoPanel>
          ) : (
            <AbilityCheckPanel result={checkResult} />
          )}
        </div>
      )}

      {/* ── PROFICIENCIES & SKILLS (read-only mirror of the forge) ─ */}
      <div id="folio-proficiencies" className={s.dividerWrap}>
        <OrdoDivider glyph="diamond-fill" color="var(--bronze)">{t('camp2.folio.profSection')}</OrdoDivider>
      </div>

      <div className={cn('ao-rgrid', s.profGrid)}>
        {stats.length === 0 && (
          <p className={cn('ao-italic', s.spanAll)}>
            {t('camp2.folio.noAbilities')}
          </p>
        )}
        {stats.map((stat) => {
          const mod = abilityMod(stat);
          const eff = stat.effectiveValue ?? stat.value;
          const saveOn = saveProfByName.has(stat.statTypeName.toLowerCase());
          const saveBonus = mod + (saveOn ? profBonus : 0);
          const skills = skillsForStat(stat.statTypeName);
          return (
            <OrdoPanel key={`prof-${stat.id}`} frame padding={0}>
              <div className={s.profPanelHead}>
                <div className={cn('ao-overline', s.profPanelLabel)}>{gt.ability(stat.statTypeName)}</div>
                <span className={cn('ao-num', s.profStatValue)}>{eff}</span>
                <span className={cn('ao-num', s.profStatMod, mod < 0 && s.neg)}>{fmtMod(mod)}</span>
              </div>
              <div className={s.profPanelBody}>
                <ProfRow proficient={saveOn} label={t('camp2.folio.savingThrow')} value={fmtMod(saveBonus)} />
                {skills.length > 0 && <OrdoDivider />}
                {skills.map((sk) => {
                  const on = profSkillIds.has(sk.id);
                  const bonus = mod + (on ? profBonus : 0);
                  return <ProfRow key={sk.id} proficient={on} label={gt.skill(sk.name)} value={fmtMod(bonus)} />;
                })}
              </div>
            </OrdoPanel>
          );
        })}
      </div>

      <div className={cn('ao-rgrid', s.midGrid)}>
        {/* Passive perception + player */}
        <div className={s.colGap18}>
          <OrdoPanel frame padding={0}>
            <div className={s.passiveRow}>
              <div>
                <div className="ao-overline">{t('camp2.folio.passivePerception')}</div>
                <div className={cn('ao-codex', s.passiveSub)}>{t('camp2.folio.passiveSub')}</div>
              </div>
              <div className={s.passiveValue}>{passivePerception}</div>
            </div>
          </OrdoPanel>
          <OrdoPanel padding={14}>
            <IdentityField label={t('camp2.folio.playerName')} value={character.ownerUsername} sub={t('camp2.folio.playerFromOwner')} />
          </OrdoPanel>
        </div>

        {/* Proficiencies & languages */}
        <div className={s.colGap18}>
          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('camp2.folio.profsLanguages')} glyph="scroll" />
            <EditableSheetField
              value={proficiencies}
              placeholder={t('camp2.folio.noProfs')}
              saving={updateCharacter.isPending}
              onSave={(next) => saveSheetField('proficiencies', next)}
            />
          </OrdoPanel>
          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('camp2.folio.equipmentTitle')} glyph="coin" tone="gold" />
            <EditableSheetField
              value={equipment}
              placeholder={t('camp2.folio.noEquipment')}
              saving={updateCharacter.isPending}
              onSave={(next) => saveSheetField('equipment', next)}
            />
          </OrdoPanel>
        </div>
      </div>

      {/* ── TABS ───────────────────────────────────────────────── */}
      <div id="folio-codex" className={s.tabsWrap}>
        <div className="ao-tabs">
          {visibleTabs.map((tabDef) => (
            <button key={tabDef.id} className={cn('ao-tab', effectiveTab === tabDef.id && 'is-active')} onClick={() => setTab(tabDef.id)}>
              {t(`camp2.folio.tab.${tabDef.id}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={cn('ao-rgrid', s.bottomGrid)}>
        {/* LEFT — tab content */}
        <OrdoPanel frame padding={0}>
          {renderTab()}
        </OrdoPanel>

        {/* RIGHT — classes + sacred marks (always) */}
        <div className={s.colGap18}>
          {character.classLevels && character.classLevels.length > 0 && (
            <MulticlassPanel
              classLevels={character.classLevels.map((c) => ({
                classId: c.classId,
                className: c.className,
                classLevel: c.classLevel,
              }))}
            />
          )}

          {/* Class runtime: reaction prompts → choices → actions → resources → effects (shown when present) */}
          {(capability?.pendingPrompts ?? 0) > 0 && (
            <PendingPromptsPanel campaignId={campaignId!} characterId={characterId!} canManage={canManageSlots} />
          )}
          {(capability?.pendingChoices ?? 0) > 0 && (
            <FeatureChoicesPanel campaignId={campaignId!} characterId={characterId!} canManage={canManageSlots} />
          )}
          {capability?.hasFeatureActions && (
            <FeatureActionsPanel campaignId={campaignId!} characterId={characterId!} canManage={canManageSlots} />
          )}
          {capability?.hasActiveEffects && (
            <FeatureEffectsPanel campaignId={campaignId!} characterId={characterId!} canManage={canManageSlots} />
          )}
          {capability?.wildShape && (
            <KnownFormsPanel campaignId={campaignId!} characterId={characterId!} canManage={canManageSlots} />
          )}
          {capability?.hasCompanions && (
            <CompanionsPanel campaignId={campaignId!} characterId={characterId!} canManage={canManageSlots} />
          )}

          {/* Sacred Marks = active effects */}
          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('camp2.folio.sacredMarks')}
              sub={t('camp2.folio.sacredMarksSub')}
              glyph="flame"
              tone="ember"
              right={<OrdoChip tone="ember" glyph="flame">{(effects ?? []).length}</OrdoChip>}
            />
            <div className={s.marksBody}>
              {(effects ?? []).length === 0 ? (
                <p className={cn('ao-italic', s.marksEmpty)}>
                  {t('camp2.folio.noMarks')}
                </p>
              ) : (
                (effects ?? []).map((e, idx) => (
                  <div
                    key={e.id}
                    className={cn(s.markRow, idx < (effects ?? []).length - 1 && s.spaced)}
                    style={{ '--c': e.isBuff ? '#7a9866' : 'var(--ember)' } as CSSProperties}
                  >
                    <Rune kind={e.isBuff ? 'diamond-fill' : 'cross-pat'} size={10} color={e.isBuff ? '#7a9866' : 'var(--ember)'} />
                    <div className={s.markMain}>
                      <span className={s.markName}>{e.buffDebuffName}</span>
                      {e.targetStatName && (
                        <span className={cn('ao-codex', s.markStat)}>
                          {e.targetStatName}{e.modifierValue != null ? ` ${e.modifierValue >= 0 ? '+' : ''}${e.modifierValue}` : ''}
                        </span>
                      )}
                    </div>
                    {e.remainingRounds != null && (
                      <span className={cn('ao-num', s.markRounds)}>{e.remainingRounds}r</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </OrdoPanel>
        </div>
      </div>

      {/* Damage / Heal modal */}
      <DamageHealModal
        open={hpModalOpen}
        onOpenChange={setHpModalOpen}
        campaignId={campaignId!}
        characterId={characterId!}
        currentHp={currentHp}
        maxHp={maxHp}
      />

      {/* Spellbook: record newly learned spells */}
      <SpellbookAddModal
        open={spellbookOpen}
        onOpenChange={setSpellbookOpen}
        campaignId={campaignId!}
        characterId={characterId!}
        classIds={(capability?.classes ?? []).map((c) => c.classId)}
        knownSpellIds={knownSpells.map((sp) => sp.spellId)}
      />
    </div>
  );
}
