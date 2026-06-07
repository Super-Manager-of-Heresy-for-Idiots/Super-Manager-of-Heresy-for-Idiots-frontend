import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  Sigil,
  OrdoChip,
  OrdoDivider,
  Placeholder,
} from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import {
  MulticlassPanel,
  AbilityCheckPanel,
  DamageHealModal,
  EditableSheetField,
} from '@/components/characters';
import {
  useCharacter,
  useCharacterResources,
  useCharacterWallet,
  useAbilityCheck,
  useUpdateCharacter,
} from '@/hooks/useCharacter';
import { useCharacterEffects } from '@/hooks/useEffects';
import { useEquippedInventory } from '@/hooks/useInventory';
import { useGlobalReferenceContent } from '@/hooks/useTemplates';
import { useT } from '@/i18n/I18nContext';
import { useGameTerms } from '@/i18n/gameTerms';
import type { CharacterStatResponse, ItemInstanceResponse } from '@/types';

/* ── helpers ─────────────────────────────────────────────────── */

function abilityMod(stat: CharacterStatResponse): number {
  const eff = stat.effectiveValue ?? stat.value;
  return Math.floor((eff - 10) / 2);
}

const WEAPON_SLOTS = ['MAIN_HAND', 'OFF_HAND'];

type TabId = 'combat' | 'spells' | 'features' | 'skills' | 'biography';

const TABS: { id: TabId }[] = [
  { id: 'combat' },
  { id: 'spells' },
  { id: 'features' },
  { id: 'skills' },
  { id: 'biography' },
];

/* A field whose value the character API does not (yet) expose. */
const NA = '—';

function IdentityField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="ao-overline">{label}</div>
      <div className="ao-h6" style={{ fontSize: 16 }}>{value}</div>
      {sub && <div className="ao-codex" style={{ marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* Read-only proficiency row: a diamond pip + label + computed bonus. */
function ProfRow({ proficient, label, value }: { proficient: boolean; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <Rune kind="diamond-fill" size={8} color={proficient ? 'var(--gold-pale)' : 'var(--ink-ghost)'} />
      <span style={{ flex: 1, fontSize: 12.5, color: proficient ? 'var(--ink-bright)' : 'var(--ink-quiet)' }}>{label}</span>
      <span className="ao-num" style={{ fontSize: 12.5, color: proficient ? 'var(--gold-pale)' : 'var(--ink-quiet)' }}>{value}</span>
    </div>
  );
}

/* Empty, clearly-marked section for data the API does not serve. */
function VoidBody({ note }: { note: string }) {
  return (
    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
      <Sigil size={36} glyph="sigil-1" color="var(--ink-faint)" />
      <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
        {note}
      </p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */

export default function FolioPage() {
  const t = useT();
  const gt = useGameTerms();
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();

  const { data: character, isLoading, error, refetch } = useCharacter(campaignId!, characterId!);
  const { data: resources } = useCharacterResources(campaignId!, characterId!);
  const { data: wallet } = useCharacterWallet(campaignId!, characterId!);
  const { data: effects } = useCharacterEffects(campaignId!, characterId!);
  const { data: equipped } = useEquippedInventory(campaignId!, characterId!);
  const { data: refContent } = useGlobalReferenceContent();
  const abilityCheck = useAbilityCheck();
  const updateCharacter = useUpdateCharacter();

  const saveSheetField = (field: 'proficiencies' | 'equipment', next: string) => {
    if (!campaignId || !characterId) return;
    updateCharacter.mutate({ campaignId, characterId, data: { [field]: next } });
  };

  const [tab, setTab] = useState<TabId>('combat');
  const [hpModalOpen, setHpModalOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<{ statName: string; total: number; breakdown: { source: string; value: number }[] } | null>(null);
  const [activeStatId, setActiveStatId] = useState<string | null>(null);

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
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '40%', height: 22, marginBottom: 18 }} />
        <div className="ao-ph" style={{ width: '70%', height: 12, marginBottom: 10 }} />
        <div className="ao-ph" style={{ width: '55%', height: 12 }} />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {t('camp2.folio.unsealed')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  const primaryClass = character.classLevels?.[0];
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
  const statByName = new Map(stats.map((s) => [s.statTypeName.toLowerCase(), s]));
  const dexStat = statByName.get('dexterity') ?? stats.find((s) => s.statTypeName.toLowerCase().startsWith('dex'));
  const initiative = dexStat ? abilityMod(dexStat) : null;
  // skillId → governing stat name, from reference skills.
  const skillGovernByName = new Map((refContent?.skills ?? []).map((s) => [s.id, s.governingStatName]));

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
    return refSkills.filter((s) => (s.governingStatName ?? '').toLowerCase() === key);
  }
  // passive perception = 10 + WIS mod + (proficient ? prof : 0)
  const perceptionSkill = refSkills.find((s) => s.name.toLowerCase().includes('percept'));
  const wisStat = statByName.get('wisdom') ?? stats.find((s) => s.statTypeName.toLowerCase().startsWith('wis'));
  const wisMod = wisStat ? abilityMod(wisStat) : 0;
  const perceptionProf = perceptionSkill ? profSkillIds.has(perceptionSkill.id) : false;
  const passivePerception = 10 + wisMod + (perceptionProf ? profBonus : 0);

  /* ── tab content (left main column) ───────────────────────── */
  function renderTab(): ReactNode {
    if (!character) return null;
    switch (tab) {
      case 'combat':
        return (
          <>
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
                      <td style={{ color: 'var(--ink-bright)' }}>{a.name}</td>
                      <td className="ao-num" style={{ color: 'var(--gold-pale)' }}>{a.attackBonus}</td>
                      <td className="ao-num" style={{ color: 'var(--ink-bright)' }}>{a.damage}</td>
                      <td className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{a.damageType}</td>
                    </tr>
                  ))}
                  {weapons.map((w) => (
                    <tr key={w.id}>
                      <td style={{ color: 'var(--ink-quiet)' }}>
                        {w.displayName}
                        {w.isUnique && <span style={{ marginLeft: 8 }}><OrdoChip tone="gold" glyph="diamond-fill">{t('camp2.folio.combat.attuned')}</OrdoChip></span>}
                      </td>
                      <td className="ao-num" style={{ color: 'var(--ink-ghost)' }}>{NA}</td>
                      <td className="ao-num" style={{ color: 'var(--ink-ghost)' }}>{NA}</td>
                      <td className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{w.itemTypeName ?? w.slot?.replace('_', ' ').toLowerCase() ?? NA}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        );
      case 'spells':
        return (
          <>
            <PanelHeader title={t('camp2.folio.spells.title')} sub={t('camp2.folio.spells.sub', { count: knownSpells.length })} glyph="hex" tone="arcane" />
            {knownSpells.length > 0 && (
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--hairline)' }}>
                <div className="ao-overline" style={{ marginBottom: 10 }}>{t('camp2.folio.spells.known')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[...knownSpells].sort((a, b) => a.level - b.level).map((sp) => (
                    <div key={sp.spellId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="ao-num" style={{ width: 30, flexShrink: 0, color: 'var(--arcane)', fontSize: 12 }}>
                        {sp.level === 0 ? t('camp2.folio.spells.cantrip') : t('camp2.folio.spells.levelShort', { level: sp.level })}
                      </span>
                      <span style={{ flex: 1, color: 'var(--ink-bright)', fontSize: 13 }}>{sp.name}</span>
                      {sp.school && <span className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 11 }}>{sp.school}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!resources || resources.length === 0) ? (
              knownSpells.length === 0 ? <VoidBody note={t('camp2.folio.spells.void')} /> : null
            ) : (
              <div style={{ padding: 16 }}>
                {resources.map((r, i) => {
                  const pct = r.maxValue > 0 ? Math.min(100, (r.currentValue / r.maxValue) * 100) : 0;
                  return (
                    <div key={r.resourceTypeId} style={{ padding: '11px 0', borderBottom: i < resources.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Rune kind="sigil-2" size={11} color="var(--arcane)" />
                        <span style={{ flex: 1, color: 'var(--ink-bright)', fontSize: 13.5 }}>{r.resourceName}</span>
                        <span className="ao-num" style={{ color: 'var(--arcane)', fontSize: 14 }}>{r.currentValue}<span style={{ color: 'var(--ink-faint)' }}> / {r.maxValue}</span></span>
                      </div>
                      <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--arcane" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        );
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
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {character.classLevels.map((c, i) => (
                  <div key={c.classId} style={{ padding: 14, borderBottom: i < character.classLevels.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="ao-h6" style={{ fontSize: 15 }}>{c.className}</span>
                      <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 13 }}>{t('camp2.folio.features.classLevel', { level: c.classLevel })}</span>
                    </div>
                  </div>
                ))}
                {features && (
                  <div style={{ padding: 16, borderTop: '1px solid var(--rule)' }}>
                    <div className="ao-overline" style={{ marginBottom: 8 }}>{t('camp2.folio.features.recorded')}</div>
                    <p className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                      {features}
                    </p>
                  </div>
                )}
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
                  <tr><th>{t('camp2.folio.skills.col.skill')}</th><th>{t('camp2.folio.skills.col.source')}</th><th style={{ textAlign: 'right' }}>{t('camp2.folio.skills.col.mod')}</th></tr>
                </thead>
                <tbody>
                  {[...skillProficiencies].sort((a, b) => a.skillName.localeCompare(b.skillName)).map((sp) => {
                    const mod = skillModifier(sp.skillId);
                    return (
                      <tr key={sp.skillId}>
                        <td style={{ color: 'var(--ink-bright)' }}>{gt.skill(sp.skillName)}</td>
                        <td className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{sp.source.toLowerCase()}</td>
                        <td className="ao-num" style={{ textAlign: 'right', color: mod != null ? 'var(--gold-pale)' : 'var(--ink-ghost)' }}>
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
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
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
                  <div className="ao-overline" style={{ marginBottom: 6 }}>{t('camp2.folio.bio.background')}</div>
                  <p className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', lineHeight: 1.55 }}>{background.description}</p>
                </div>
              )}

              {biography && (biography.personalityTraits || biography.ideals || biography.bonds || biography.flaws) && (
                <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  {([
                    ['camp2.folio.bio.personalityTraits', biography.personalityTraits],
                    ['camp2.folio.bio.ideals', biography.ideals],
                    ['camp2.folio.bio.bonds', biography.bonds],
                    ['camp2.folio.bio.flaws', biography.flaws],
                  ] as const).filter(([, v]) => !!v).map(([label, v]) => (
                    <div key={label}>
                      <div className="ao-overline" style={{ marginBottom: 6 }}>{t(label)}</div>
                      <p className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {raceTraits.length > 0 && (
                <div>
                  <div className="ao-overline" style={{ marginBottom: 8 }}>{t('camp2.folio.bio.racialTraits')}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {raceTraits.map((trait) => (
                      <OrdoChip key={trait} tone="gold" glyph="diamond-fill">{trait}</OrdoChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div>
      {/* ── Page header (TopBar) ───────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.folio.overline')}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <h3 className="ao-h3">{character.name}</h3>
            <CharStatusBadge status={character.status ?? 'ACTIVE'} />
          </div>
          <p className="ao-codex" style={{ marginTop: 6 }}>№ {character.id.slice(0, 8)} · {character.ownerUsername}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="ao-btn ao-btn--primary" onClick={() => setHpModalOpen(true)}>
            <Rune kind="flame" size={11} /> <span style={{ marginLeft: 6 }}>{t('camp2.folio.adjustVitae')}</span>
          </button>
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}`)}>
            <Rune kind="arrow-l" size={13} /> <span style={{ marginLeft: 6 }}>{t('camp2.folio.management')}</span>
          </button>
        </div>
      </div>

      {/* ── HEADER ROW: Identity + Oath ────────────────────────── */}
      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18 }}>
        {/* Identity */}
        <OrdoPanel frame padding={0}>
          <div style={{ display: 'flex', gap: 18, padding: 20 }}>
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                style={{ width: 140, height: 180, flexShrink: 0, objectFit: 'cover', border: '1px solid var(--rule)', background: 'var(--abyss)' }}
              />
            ) : (
              <Placeholder style={{ width: 140, height: 180, flexShrink: 0 }}>{t('camp2.folio.portrait')}</Placeholder>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="ao-codex">№ {character.id.slice(0, 8)}</span>
                <CharStatusBadge status={character.status ?? 'ACTIVE'} />
                {alignment && <OrdoChip tone="gold" glyph="diamond-fill">{alignment}</OrdoChip>}
              </div>
              <div className="ao-h3" style={{ marginTop: 8, fontSize: 32 }}>{character.name}</div>
              <div className="ao-italic" style={{ marginTop: 2, fontSize: 16, color: 'var(--ink-quiet)' }}>
                {character.race?.name ?? t('camp2.folio.unknown')}{lineageName ? ` (${lineageName})` : ''} {primaryClass ? `· ${primaryClass.className}` : ''}{background ? ` · ${background.name}` : ''}
              </div>

              <OrdoDivider glyph="diamond-fill" color="var(--bronze)" />

              <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <IdentityField label={t('camp2.folio.id.label')} value={primaryClass?.className ?? t('camp2.folio.unclassed')} sub={primaryClass ? t('camp2.folio.id.level', { level: primaryClass.classLevel }) : NA} />
                <IdentityField label={t('camp2.folio.id.race')} value={character.race?.name ?? t('camp2.folio.unknown')} sub={lineageName ?? (character.race?.description ? character.race.description.slice(0, 28) : NA)} />
                <IdentityField label={t('camp2.folio.id.size')} value={snap ? gt.size(snap.size) : NA} sub={snap?.darkvisionRange ? t('camp2.folio.darkvision', { range: snap.darkvisionRange }) : t('camp2.folio.noDarkvision')} />
                <IdentityField label={t('camp2.folio.id.speed')} value={walkSpeed != null ? t('camp2.folio.ft', { n: walkSpeed }) : NA} sub={extraSpeeds.length ? extraSpeeds.map(([k, v]) => `${gt.movement(k)} ${v}`).join(' · ') : t('camp2.folio.walk')} />
              </div>
            </div>
          </div>

          {/* Level / XP / HP rail */}
          <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', borderTop: '1px solid var(--rule)' }}>
            <div style={{ padding: 18, borderRight: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Sigil size={56} glyph="sigil-3" />
              <div>
                <div className="ao-overline">{t('camp2.folio.level')}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 44, color: 'var(--ink-bright)', lineHeight: 1 }}>{character.totalLevel}</div>
              </div>
            </div>
            <button
              onClick={() => setHpModalOpen(true)}
              style={{ padding: '18px 20px', borderRight: '1px solid var(--rule)', borderTop: 'none', borderLeft: 'none', borderBottom: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              title={t('camp2.folio.adjustVitae')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                <span className="ao-overline">{t('camp2.folio.vitaeHp')}</span>
                <span className="ao-num" style={{ color: 'var(--ink-bright)', fontSize: 13 }}>{currentHp}<span style={{ color: 'var(--ink-faint)' }}> / {maxHp}</span></span>
              </div>
              <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--ember" style={{ width: `${hpPct}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span className="ao-codex">{t('camp2.folio.temp')} +{tempHp} · {t('camp2.folio.death')} {deathSuccesses}✓ / {deathFailures}✗</span>
                <span className="ao-codex">{t('camp2.folio.hitDice')} {hitDiceLabel}</span>
              </div>
            </button>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                <span className="ao-overline">{t('camp2.folio.ascentXp')}</span>
                <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 13 }}>{(character.experience ?? 0).toLocaleString()}</span>
              </div>
              <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--gold" style={{ width: '100%', opacity: 0.35 }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span className="ao-codex" style={{ color: inspiration ? 'var(--gold-pale)' : undefined }}>
                  {t('camp2.folio.inspiration')} {inspiration ? t('camp2.folio.yes') : t('camp2.folio.no')}
                </span>
                <span className="ao-codex">{t('camp2.folio.xpEarned', { xp: (character.experience ?? 0).toLocaleString() })}</span>
              </div>
            </div>
          </div>
        </OrdoPanel>

        {/* Saving Throws */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.folio.savingThrows')} sub={t('camp2.folio.savingThrowsSub')} glyph="flame" tone="ember" />
          {savingThrows.length === 0 ? (
            <VoidBody note={t('camp2.folio.noSavingThrows')} />
          ) : (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {savingThrows.map((name) => {
                const stat = statByName.get(name.toLowerCase());
                const mod = stat ? abilityMod(stat) + profBonus : null;
                return (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--abyss)', border: '1px solid var(--hairline)' }}>
                    <Rune kind="diamond-fill" size={9} color="var(--gold-pale)" />
                    <span style={{ flex: 1, color: 'var(--ink-bright)', fontSize: 13 }}>{gt.ability(name)}</span>
                    <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 13 }}>{mod != null ? fmtMod(mod) : NA}</span>
                  </div>
                );
              })}
            </div>
          )}
        </OrdoPanel>

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
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(wallet ?? []).map((entry) => (
                <div key={entry.currencyTypeId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--abyss)', border: '1px solid var(--hairline)' }}>
                  <Rune kind="coin" size={11} color="var(--gold-pale)" />
                  <span style={{ flex: 1, color: 'var(--ink-bright)', fontSize: 13 }}>{entry.currencyName}</span>
                  <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 14 }}>{entry.amount.toLocaleString()}</span>
                </div>
              ))}
              {/* Reduced gold-equivalent total — full ledger lives on the wallet page. */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, marginTop: 2, borderTop: '1px solid var(--hairline)' }}>
                <span className="ao-overline" style={{ color: 'var(--ink-faint)' }}>{t('camp.wallet.total')}</span>
                <span className="ao-num" style={{ color: 'var(--gold)', fontSize: 14 }}>
                  {t('camp2.folio.coinTotal', { amount: (wallet ?? []).reduce((s, w) => s + (w.goldEquivalent ?? 0), 0).toLocaleString() })}
                </span>
              </div>
            </div>
          )}
        </OrdoPanel>
      </div>

      {/* ── ABILITIES & COMBAT ─────────────────────────────────── */}
      <div style={{ margin: '24px 0 0' }}>
        <OrdoDivider glyph="diamond-fill" color="var(--bronze)">{t('camp2.folio.abilitiesCombat')}</OrdoDivider>
      </div>

      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr)) 280px', gap: 12, marginTop: 12 }}>
        {stats.length === 0 && (
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, gridColumn: '1 / -1', textAlign: 'center', padding: '12px 0' }}>
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
              className="ao-stat ao-frame"
              style={{ cursor: 'pointer', borderColor: active ? 'var(--brass)' : undefined, position: 'relative' }}
              title={t('camp2.folio.reckonCheck')}
            >
              <span className="ao-frame-c" />
              <div className="ao-stat-label">{gt.abilityAbbr(stat.statTypeName)}</div>
              <div className="ao-stat-value">{eff}</div>
              <div className="ao-stat-mod" style={{ color: mod >= 0 ? 'var(--gold-pale)' : '#d8896a' }}>{mod >= 0 ? `+${mod}` : mod}</div>
            </button>
          );
        })}

        {/* Saves & Tier — not served by API */}
        <OrdoPanel padding={14}>
          <div className="ao-overline" style={{ marginBottom: 8 }}>{t('camp2.folio.savesTier')}</div>
          <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { label: t('camp2.folio.armour'), value: armorClass != null ? `${armorClass}` : NA },
              { label: t('camp2.folio.init'), value: initiative != null ? fmtMod(initiative) : NA },
              { label: t('camp2.folio.speedShort'), value: walkSpeed != null ? `${walkSpeed}` : NA },
              { label: t('camp2.folio.prof'), value: `+${profBonus}` },
            ].map((c) => (
              <div key={c.label} style={{ padding: 8, background: 'var(--abyss)', border: '1px solid var(--rule)', textAlign: 'center' }}>
                <div className="ao-overline" style={{ fontSize: 9 }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink-bright)', lineHeight: 1.1 }}>{c.value}</div>
              </div>
            ))}
          </div>
        </OrdoPanel>
      </div>

      {/* Ability-check breakdown reveal */}
      {(abilityCheck.isPending || checkResult) && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-start' }}>
          {abilityCheck.isPending ? (
            <OrdoPanel frame style={{ width: 380 }}>
              <div style={{ padding: 32, textAlign: 'center' }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>{t('camp2.folio.consulting')}</p>
              </div>
            </OrdoPanel>
          ) : (
            <AbilityCheckPanel result={checkResult} />
          )}
        </div>
      )}

      {/* ── PROFICIENCIES & SKILLS (read-only mirror of the forge) ─ */}
      <div style={{ margin: '24px 0 0' }}>
        <OrdoDivider glyph="diamond-fill" color="var(--bronze)">{t('camp2.folio.profSection')}</OrdoDivider>
      </div>

      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginTop: 12 }}>
        {stats.length === 0 && (
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, gridColumn: '1 / -1', textAlign: 'center', padding: '12px 0' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: '1px solid var(--rule)' }}>
                <div className="ao-overline" style={{ flex: 1 }}>{gt.ability(stat.statTypeName)}</div>
                <span className="ao-num" style={{ fontSize: 18, color: 'var(--ink-bright)' }}>{eff}</span>
                <span className="ao-num" style={{ fontSize: 13, color: mod >= 0 ? 'var(--gold-pale)' : '#d8896a' }}>{fmtMod(mod)}</span>
              </div>
              <div style={{ padding: '8px 14px 12px' }}>
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

      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 18, marginTop: 18, alignItems: 'start' }}>
        {/* Passive perception + player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <OrdoPanel frame padding={0}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px' }}>
              <div>
                <div className="ao-overline">{t('camp2.folio.passivePerception')}</div>
                <div className="ao-codex" style={{ fontSize: 10 }}>{t('camp2.folio.passiveSub')}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 34, color: 'var(--ink-bright)', lineHeight: 1 }}>{passivePerception}</div>
            </div>
          </OrdoPanel>
          <OrdoPanel padding={14}>
            <IdentityField label={t('camp2.folio.playerName')} value={character.ownerUsername} sub={t('camp2.folio.playerFromOwner')} />
          </OrdoPanel>
        </div>

        {/* Proficiencies & languages + equipment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
      <div style={{ marginTop: 24 }}>
        <div className="ao-tabs">
          {TABS.map((tabDef) => (
            <button key={tabDef.id} className={`ao-tab ${tab === tabDef.id ? 'is-active' : ''}`} onClick={() => setTab(tabDef.id)}>
              {t(`camp2.folio.tab.${tabDef.id}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18, marginTop: 18, alignItems: 'start' }}>
        {/* LEFT — tab content */}
        <OrdoPanel frame padding={0}>
          {renderTab()}
        </OrdoPanel>

        {/* RIGHT — classes + sacred marks (always) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {character.classLevels && character.classLevels.length > 0 && (
            <MulticlassPanel
              classLevels={character.classLevels.map((c) => ({
                classId: c.classId,
                className: c.className,
                classLevel: c.classLevel,
              }))}
            />
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
            <div style={{ padding: 16 }}>
              {(effects ?? []).length === 0 ? (
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
                  {t('camp2.folio.noMarks')}
                </p>
              ) : (
                (effects ?? []).map((e, idx) => (
                  <div
                    key={e.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      background: 'var(--abyss)',
                      border: '1px solid var(--hairline)',
                      borderLeft: `2px solid ${e.isBuff ? '#7a9866' : 'var(--ember)'}`,
                      marginBottom: idx < (effects ?? []).length - 1 ? 8 : 0,
                    }}
                  >
                    <Rune kind={e.isBuff ? 'diamond-fill' : 'cross-pat'} size={10} color={e.isBuff ? '#7a9866' : 'var(--ember)'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{e.buffDebuffName}</span>
                      {e.targetStatName && (
                        <span className="ao-codex" style={{ display: 'block', fontSize: 10, color: 'var(--ink-faint)' }}>
                          {e.targetStatName}{e.modifierValue != null ? ` ${e.modifierValue >= 0 ? '+' : ''}${e.modifierValue}` : ''}
                        </span>
                      )}
                    </div>
                    {e.remainingRounds != null && (
                      <span className="ao-num" style={{ fontSize: 11, color: 'var(--ink-quiet)' }}>{e.remainingRounds}r</span>
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
    </div>
  );
}
