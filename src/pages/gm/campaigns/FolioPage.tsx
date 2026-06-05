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
} from '@/components/characters/v2';
import {
  useCharacterV2,
  useCharacterResources,
  useAbilityCheck,
} from '@/hooks/useCharacterV2';
import { useCharacterEffects } from '@/hooks/useEffects';
import { useEquippedInventory } from '@/hooks/useInventoryV2';
import type { CharacterStatResponse, ItemInstanceResponse } from '@/types';

/* ── helpers ─────────────────────────────────────────────────── */

function abilityMod(stat: CharacterStatResponse): number {
  const eff = stat.effectiveValue ?? stat.value;
  return Math.floor((eff - 10) / 2);
}

const WEAPON_SLOTS = ['MAIN_HAND', 'OFF_HAND'];

type TabId = 'combat' | 'spells' | 'features' | 'skills' | 'biography';

const TABS: { id: TabId; label: string }[] = [
  { id: 'combat', label: 'Combat · Attacks' },
  { id: 'spells', label: 'Litanies & Spells' },
  { id: 'features', label: 'Class Features' },
  { id: 'skills', label: 'Skills' },
  { id: 'biography', label: 'Biography' },
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
  const navigate = useNavigate();
  const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();

  const { data: character, isLoading, error, refetch } = useCharacterV2(campaignId!, characterId!);
  const { data: resources } = useCharacterResources(campaignId!, characterId!);
  const { data: effects } = useCharacterEffects(campaignId!, characterId!);
  const { data: equipped } = useEquippedInventory(campaignId!, characterId!);
  const abilityCheck = useAbilityCheck();

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
              { source: `Base · ${d.statName} modifier`, value: d.modifier },
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

  const primaryClass = character.classLevels?.[0];
  const stats = character.stats ?? [];
  const currentHp = character.currentHp ?? 0;
  const maxHp = character.maxHp ?? 0;
  const hpPct = maxHp > 0 ? Math.min(100, (currentHp / maxHp) * 100) : 0;

  /* ── tab content (left main column) ───────────────────────── */
  function renderTab(): ReactNode {
    if (!character) return null;
    switch (tab) {
      case 'combat':
        return (
          <>
            <PanelHeader
              title="Sanctioned Strikes"
              sub={`${weapons.length} blade${weapons.length === 1 ? '' : 's'} bound to the hands`}
              glyph="sword"
              right={
                <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}/inventory`)}>
                  <Rune kind="arrow-r" size={9} /> Arsenal
                </button>
              }
            />
            {weapons.length === 0 ? (
              <VoidBody note="No weapon is bound to the hands. Equip arms in the Arsenal." />
            ) : (
              <table className="ao-table">
                <thead>
                  <tr><th>Weapon</th><th>Hit</th><th>Damage</th><th>Type</th><th>Range</th></tr>
                </thead>
                <tbody>
                  {weapons.map((w) => (
                    <tr key={w.id}>
                      <td style={{ color: 'var(--ink-bright)' }}>
                        {w.displayName}
                        {w.isUnique && <span style={{ marginLeft: 8 }}><OrdoChip tone="gold" glyph="diamond-fill">attuned</OrdoChip></span>}
                      </td>
                      <td className="ao-num" style={{ color: 'var(--ink-ghost)' }}>{NA}</td>
                      <td className="ao-num" style={{ color: 'var(--ink-ghost)' }}>{NA}</td>
                      <td className="ao-italic" style={{ color: 'var(--ink-faint)' }}>{w.itemTypeName ?? NA}</td>
                      <td className="ao-codex">{w.slot?.replace('_', ' ').toLowerCase()}</td>
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
            <PanelHeader title="Litanies & Spells" sub="Reserves & founts · ± at the table" glyph="hex" tone="arcane" />
            {!resources || resources.length === 0 ? (
              <VoidBody note="No reserves or founts are tracked for this soul." />
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
            <PanelHeader title="Class Features" sub="Granted by oath & tier" glyph="sigil-3" />
            {!character.classLevels || character.classLevels.length === 0 ? (
              <VoidBody note="No class progression recorded for this soul." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {character.classLevels.map((c, i) => (
                  <div key={c.classId} style={{ padding: 14, borderBottom: i < character.classLevels.length - 1 ? '1px solid var(--hairline)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span className="ao-h6" style={{ fontSize: 15 }}>{c.className}</span>
                      <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 13 }}>level {c.classLevel}</span>
                    </div>
                    <div className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)' }}>
                      Detailed feature grants await the rewards endpoint.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case 'skills':
        return (
          <>
            <PanelHeader title="Skills" sub="Proficiencies & expertise" glyph="eye" right={<span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>TODO</span>} />
            <VoidBody note="Skill proficiencies are not yet provided by the character API." />
          </>
        );
      case 'biography':
        return (
          <>
            <PanelHeader title="Biography" sub="Background, alignment & life record" glyph="book" right={<span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>TODO</span>} />
            <VoidBody note="Background and life record await a dedicated lore endpoint." />
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
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Folio of the Soul</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            <h3 className="ao-h3">{character.name}</h3>
            <CharStatusBadge status={character.status ?? 'ACTIVE'} />
          </div>
          <p className="ao-codex" style={{ marginTop: 6 }}>№ {character.id.slice(0, 8)} · {character.ownerUsername}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="ao-btn ao-btn--primary" onClick={() => setHpModalOpen(true)}>
            <Rune kind="flame" size={11} /> <span style={{ marginLeft: 6 }}>Adjust Vitae</span>
          </button>
          <button className="ao-btn ao-btn--ghost" onClick={() => navigate(`/campaigns/${campaignId}/characters/${characterId}`)}>
            <Rune kind="arrow-l" size={13} /> <span style={{ marginLeft: 6 }}>Management</span>
          </button>
        </div>
      </div>

      {/* ── HEADER ROW: Identity + Oath ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18 }}>
        {/* Identity */}
        <OrdoPanel frame padding={0}>
          <div style={{ display: 'flex', gap: 18, padding: 20 }}>
            <Placeholder style={{ width: 140, height: 180, flexShrink: 0 }}>portrait</Placeholder>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="ao-codex">№ {character.id.slice(0, 8)}</span>
                <CharStatusBadge status={character.status ?? 'ACTIVE'} />
              </div>
              <div className="ao-h3" style={{ marginTop: 8, fontSize: 32 }}>{character.name}</div>
              <div className="ao-italic" style={{ marginTop: 2, fontSize: 16, color: 'var(--ink-quiet)' }}>
                {character.race?.name ?? 'Unknown'} {primaryClass ? `· ${primaryClass.className}` : ''}
              </div>

              <OrdoDivider glyph="diamond-fill" color="var(--bronze)" />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <IdentityField label="Class" value={primaryClass?.className ?? 'Unclassed'} sub={primaryClass ? `level ${primaryClass.classLevel}` : NA} />
                <IdentityField label="Race" value={character.race?.name ?? 'Unknown'} sub={character.race?.description ? character.race.description.slice(0, 28) : NA} />
                <IdentityField label="Background" value={NA} sub="unrecorded" />
                <IdentityField label="Alignment" value={NA} sub="unrecorded" />
              </div>
            </div>
          </div>

          {/* Level / XP / HP rail */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', borderTop: '1px solid var(--rule)' }}>
            <div style={{ padding: 18, borderRight: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Sigil size={56} glyph="sigil-3" />
              <div>
                <div className="ao-overline">Level</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 44, color: 'var(--ink-bright)', lineHeight: 1 }}>{character.totalLevel}</div>
              </div>
            </div>
            <button
              onClick={() => setHpModalOpen(true)}
              style={{ padding: '18px 20px', borderRight: '1px solid var(--rule)', borderTop: 'none', borderLeft: 'none', borderBottom: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
              title="Adjust vitae"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                <span className="ao-overline">Vitae · Hit Points</span>
                <span className="ao-num" style={{ color: 'var(--ink-bright)', fontSize: 13 }}>{currentHp}<span style={{ color: 'var(--ink-faint)' }}> / {maxHp}</span></span>
              </div>
              <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--ember" style={{ width: `${hpPct}%` }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span className="ao-codex">Temp +0 · Death saves {NA}</span>
                <span className="ao-codex">Hit Dice {NA}</span>
              </div>
            </button>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
                <span className="ao-overline">Ascent · Experience</span>
                <span className="ao-num" style={{ color: 'var(--gold-pale)', fontSize: 13 }}>{(character.experience ?? 0).toLocaleString()}</span>
              </div>
              <div className="ao-bar"><div className="ao-bar-fill ao-bar-fill--gold" style={{ width: '100%', opacity: 0.35 }} /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span className="ao-codex">Inspiration {NA}</span>
                <span className="ao-codex">{(character.experience ?? 0).toLocaleString()} XP earned</span>
              </div>
            </div>
          </div>
        </OrdoPanel>

        {/* Oath & Tenets — not served by API */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="Oath & Tenets" sub="Covenants & sworn vows" glyph="flame" tone="ember" right={<span className="ao-overline" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>TODO</span>} />
          <VoidBody note="Oaths, tenets and covenants are not yet served by the character API." />
        </OrdoPanel>
      </div>

      {/* ── ABILITIES & COMBAT ─────────────────────────────────── */}
      <div style={{ margin: '24px 0 0' }}>
        <OrdoDivider glyph="diamond-fill" color="var(--bronze)">Abilities & Combat</OrdoDivider>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr)) 280px', gap: 12, marginTop: 12 }}>
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
              className="ao-stat ao-frame"
              style={{ cursor: 'pointer', borderColor: active ? 'var(--brass)' : undefined, position: 'relative' }}
              title="Reckon an ability check"
            >
              <span className="ao-frame-c" />
              <div className="ao-stat-label">{stat.statTypeName.slice(0, 3).toUpperCase()}</div>
              <div className="ao-stat-value">{eff}</div>
              <div className="ao-stat-mod" style={{ color: mod >= 0 ? 'var(--gold-pale)' : '#d8896a' }}>{mod >= 0 ? `+${mod}` : mod}</div>
            </button>
          );
        })}

        {/* Saves & Tier — not served by API */}
        <OrdoPanel padding={14}>
          <div className="ao-overline" style={{ marginBottom: 8 }}>Saves & Tier</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { label: 'Armour', value: NA },
              { label: 'Init', value: NA },
              { label: 'Speed', value: NA },
              { label: 'Prof.', value: `+${Math.max(2, Math.ceil(character.totalLevel / 4) + 1)}` },
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
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>Consulting the augurs…</p>
              </div>
            </OrdoPanel>
          ) : (
            <AbilityCheckPanel result={checkResult} />
          )}
        </div>
      )}

      {/* ── TABS ───────────────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        <div className="ao-tabs">
          {TABS.map((t) => (
            <button key={t.id} className={`ao-tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 18, marginTop: 18, alignItems: 'start' }}>
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
              title="Sacred Marks"
              sub="Active buffs & debuffs"
              glyph="flame"
              tone="ember"
              right={<OrdoChip tone="ember" glyph="flame">{(effects ?? []).length}</OrdoChip>}
            />
            <div style={{ padding: 16 }}>
              {(effects ?? []).length === 0 ? (
                <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>
                  No marks burn upon this soul.
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
