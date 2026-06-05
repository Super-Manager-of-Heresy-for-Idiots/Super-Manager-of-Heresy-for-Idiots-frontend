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
  Bar,
} from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import {
  HPRailPanel,
  ResourcesPanel,
  MulticlassPanel,
  AbilityCheckPanel,
  DamageHealModal,
} from '@/components/characters/v2';
import {
  useCharacterV2,
  useCharacterResources,
  useAbilityCheck,
} from '@/hooks/useCharacterV2';
import { useCharacterEffects } from '@/hooks/useEffects';
import { useEquippedInventory } from '@/hooks/useInventoryV2';
import type {
  CharacterStatResponse,
  ItemInstanceResponse,
} from '@/types';

/* ── helpers ─────────────────────────────────────────────────── */

function abilityMod(stat: CharacterStatResponse): number {
  const eff = stat.effectiveValue ?? stat.value;
  return Math.floor((eff - 10) / 2);
}

const WEAPON_SLOTS = ['MAIN_HAND', 'OFF_HAND'];

/* A section whose data the current API does not provide. Rendered as an
   empty, clearly-marked placeholder so the Folio layout matches the design
   while never inventing data. */
function VoidSection({
  title,
  glyph,
  tone,
  note,
}: {
  title: string;
  glyph: string;
  tone?: 'gold' | 'arcane' | 'ember';
  note: string;
}) {
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader
        title={title}
        glyph={glyph}
        tone={tone}
        right={<span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>TODO</span>}
      />
      <div style={{ padding: '28px 24px', textAlign: 'center' }}>
        <Sigil size={36} glyph="sigil-1" color="var(--ink-faint)" />
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
          {note}
        </p>
      </div>
    </OrdoPanel>
  );
}

function PanelWrap({ title, glyph, tone, right, children }: {
  title: string; glyph: string; tone?: 'gold' | 'arcane' | 'ember'; right?: ReactNode; children: ReactNode;
}) {
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={title} glyph={glyph} tone={tone} right={right} />
      <div style={{ padding: 16 }}>{children}</div>
    </OrdoPanel>
  );
}

/* ── page ────────────────────────────────────────────────────── */

export default function FolioPage() {
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();

  const { data: character, isLoading, error, refetch } = useCharacterV2(campaignId!, characterId!);
  const { data: resources } = useCharacterResources(campaignId!, characterId!);
  const { data: effects } = useCharacterEffects(campaignId!, characterId!);
  const { data: equipped } = useEquippedInventory(campaignId!, characterId!);
  const abilityCheck = useAbilityCheck();

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
              { source: 'Ability modifier', value: d.modifier },
              { source: 'Litany & oath', value: d.buffBonus },
              { source: 'Arsenal', value: d.equipmentBonus },
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
          The folio could not be unsealed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const primaryClass = character.classLevels?.[0]?.className ?? 'Unclassed';
  const raceName = character.race?.name ?? 'Unknown';
  const stats = character.stats ?? [];
  const currentHp = character.currentHp ?? 0;
  const maxHp = character.maxHp ?? 0;

  return (
    <div>
      {/* ── Header / Portrait band ─────────────────────────────── */}
      <OrdoPanel frame padding={0} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 20, padding: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* portrait silhouette */}
          <div
            style={{
              width: 84,
              height: 84,
              border: '1px solid var(--rule)',
              background: 'var(--abyss)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sigil size={48} glyph="helm" color="var(--gold)" />
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>Folio of the Soul</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
              <h3 className="ao-h3">{character.name}</h3>
              <CharStatusBadge status={character.status ?? 'ACTIVE'} />
            </div>
            <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 6 }}>
              {raceName} · {primaryClass} · LVL {character.totalLevel} · Keeper: {character.ownerUsername}
            </p>

            {/* XP rail */}
            <div style={{ marginTop: 12, maxWidth: 420 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>Ascent · Experience</span>
                <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-quiet)' }}>
                  {(character.experience ?? 0).toLocaleString()} XP
                </span>
              </div>
              <Bar value={character.experience ?? 0} max={Math.max(character.experience ?? 0, 1)} tone="gold" height={6} showNumbers={false} />
            </div>
          </div>

          <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}`)}>
            <Rune kind="arrow-l" size={14} color="currentColor" />
            <span style={{ marginLeft: 6 }}>Management</span>
          </button>
        </div>
      </OrdoPanel>

      {/* ── Body: two columns ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* ── Main column ── */}
        <div style={{ flex: '2 1 460px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Abilities & Combat */}
          <PanelWrap title="Abilities & Combat" glyph="sigil-2" tone="gold">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))', gap: 10 }}>
              {stats.length === 0 && (
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, gridColumn: '1 / -1', textAlign: 'center', padding: '12px 0' }}>
                  No abilities recorded.
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
                    className="ao-panel"
                    style={{
                      padding: '12px 6px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: `1px solid ${active ? 'var(--gold)' : 'var(--hairline)'}`,
                      background: active ? 'var(--gold)10' : 'var(--abyss)',
                    }}
                    title="Roll an ability check"
                  >
                    <div className="ao-overline" style={{ fontSize: 8, marginBottom: 4, color: 'var(--ink-quiet)' }}>
                      {stat.statTypeName}
                    </div>
                    <div className="ao-stat-value" style={{ fontSize: 22 }}>{eff}</div>
                    <div className="ao-codex" style={{ fontSize: 11, color: mod >= 0 ? 'var(--ink-quiet)' : '#d8896a', marginTop: 2 }}>
                      {mod >= 0 ? `+${mod}` : mod}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Ability-check breakdown */}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
              {abilityCheck.isPending ? (
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>Consulting the augurs…</p>
              ) : (
                <AbilityCheckPanel result={checkResult} />
              )}
            </div>
          </PanelWrap>

          {/* Combat · Attacks (equipped weapons; damage/range not in API) */}
          <PanelWrap title="Combat · Attacks" glyph="sword" tone="ember">
            {weapons.length === 0 ? (
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, textAlign: 'center', padding: '16px 0' }}>
                No weapon is bound to the hands. Equip arms in the Arsenal.
              </p>
            ) : (
              weapons.map((w, idx) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: idx < weapons.length - 1 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <Rune kind="sword" size={14} color="var(--gold)" />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{w.displayName}</span>
                    <span className="ao-codex" style={{ display: 'block', fontSize: 10, color: 'var(--ink-faint)' }}>
                      {w.slot?.replace('_', ' ')}
                    </span>
                  </div>
                  {/* damage & range are not exposed by the API */}
                  <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>dmg —</span>
                  <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-ghost)', fontFamily: 'var(--font-mono)' }}>rng —</span>
                </div>
              ))
            )}
          </PanelWrap>

          {/* Class Features (real) */}
          {character.classLevels && character.classLevels.length > 0 ? (
            <MulticlassPanel
              classLevels={character.classLevels.map((c) => ({
                classId: c.classId,
                className: c.className,
                classLevel: c.classLevel,
              }))}
            />
          ) : (
            <VoidSection title="Classes & Oaths" glyph="shield" note="No class progression recorded." />
          )}

          {/* Oath & Tenets — not in API */}
          <VoidSection
            title="Oath & Tenets"
            glyph="scroll"
            tone="gold"
            note="Oaths, tenets and covenants are not yet served by the character API."
          />

          {/* Biography — not in API */}
          <VoidSection
            title="Biography"
            glyph="book"
            note="Background, alignment and life record await a dedicated lore endpoint."
          />
        </div>

        {/* ── Side column ── */}
        <div style={{ flex: '1 1 300px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Vitae · HP (real) */}
          <HPRailPanel
            characterId={characterId!}
            currentHp={currentHp}
            maxHp={maxHp}
            status={character.status}
            onOpenDamageHeal={() => setHpModalOpen(true)}
          />

          {/* Saves & Tier — not in API */}
          <VoidSection
            title="Saves & Tier"
            glyph="shield"
            note="Saving throws and proficiency tier are not exposed by the current API."
          />

          {/* Skills — not in API */}
          <VoidSection
            title="Skills"
            glyph="eye"
            note="Skill proficiencies are not yet provided by the character API."
          />

          {/* Litanies & Spells = resources (real) */}
          {resources && resources.length > 0 ? (
            <ResourcesPanel characterId={characterId!} resources={resources} />
          ) : (
            <VoidSection title="Litanies & Spells" glyph="hex" tone="arcane" note="No reserves or founts are tracked." />
          )}

          {/* Sacred Marks = active effects (real) */}
          <PanelWrap
            title="Sacred Marks"
            glyph="flame"
            tone="ember"
            right={<OrdoChip tone="ember" glyph="flame">{(effects ?? []).length}</OrdoChip>}
          >
            {(effects ?? []).length === 0 ? (
              <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
                No marks burn upon this soul.
              </p>
            ) : (
              (effects ?? []).map((e, idx) => (
                <div key={e.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                    <Rune kind={e.isBuff ? 'cir-dot' : 'x'} size={12} color={e.isBuff ? '#7a9866' : 'var(--ember)'} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>{e.buffDebuffName}</span>
                      {e.targetStatName && (
                        <span className="ao-codex" style={{ display: 'block', fontSize: 10, color: 'var(--ink-faint)' }}>
                          {e.targetStatName}
                          {e.modifierValue != null ? ` ${e.modifierValue >= 0 ? '+' : ''}${e.modifierValue}` : ''}
                        </span>
                      )}
                    </div>
                    {e.remainingRounds != null && (
                      <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-quiet)', fontFamily: 'var(--font-mono)' }}>
                        {e.remainingRounds}r
                      </span>
                    )}
                  </div>
                  {idx < (effects ?? []).length - 1 && <OrdoDivider glyph="diamond" color="var(--rule)" />}
                </div>
              ))
            )}
          </PanelWrap>
        </div>
      </div>

      {/* HP advanced modal */}
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
