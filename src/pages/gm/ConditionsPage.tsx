import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Rune, OrdoPanel, OrdoField, OrdoChip } from '@/components/ordo';
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
} from '@/components/ui/alert-dialog';
import {
  useConditions,
  useCreateCondition,
  useUpdateCondition,
  useDeleteCondition,
  useAddConditionModifier,
  useDeleteConditionModifier,
  useApplyCondition,
  useCharacterConditions,
  useRemoveCondition,
} from '@/hooks/useConditions';
import { useStatTypes } from '@/hooks/useAdmin';
import { useCharacters } from '@/hooks/useCharacters';
import type { ConditionResponse, ConditionModifierResponse, CharacterConditionResponse } from '@/types';

type TabKey = 'edicts' | 'active';

/* ------------------------------------------------------------------ */
/*  ModifierTag                                                       */
/* ------------------------------------------------------------------ */
function ModifierTag({ mod }: { mod: ConditionModifierResponse }) {
  const pos = mod.modifierValue >= 0;
  const c = pos ? '#7a9866' : '#d8896a';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 7px',
        background: pos ? 'rgba(122,152,102,0.08)' : 'rgba(179,70,26,0.08)',
        border: `1px solid ${c}55`,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: c,
      }}
    >
      <Rune kind={pos ? 'arrow-up' : 'minus'} size={8} color={c} />
      <span style={{ letterSpacing: '0.08em', color: 'var(--ink)' }}>{mod.statTypeName}</span>
      <span style={{ color: c, fontWeight: 600 }}>
        {pos ? `+${mod.modifierValue}` : mod.modifierValue}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  EdictCard                                                         */
/* ------------------------------------------------------------------ */
function EdictCard({
  condition,
  onEdit,
  onDelete,
  onApply,
  onAddModifier,
  onDeleteModifier,
  addingModifierId,
  setAddingModifierId,
  modStatId,
  setModStatId,
  modValue,
  setModValue,
  addModifierPending,
  statTypes,
}: {
  condition: ConditionResponse;
  onEdit: (item: ConditionResponse) => void;
  onDelete: (id: string) => void;
  onApply: (conditionId: string) => void;
  onAddModifier: (conditionId: string) => void;
  onDeleteModifier: (conditionId: string, modifierId: string) => void;
  addingModifierId: string | null;
  setAddingModifierId: (id: string | null) => void;
  modStatId: string;
  setModStatId: (id: string) => void;
  modValue: string;
  setModValue: (v: string) => void;
  addModifierPending: boolean;
  statTypes: { id: string; name: string }[];
}) {
  return (
    <OrdoPanel frame padding={0}>
      <div style={{ padding: 18 }}>
        {/* Top row: id + name + sigil icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <div>
            <span className="ao-codex">{'\u2116'} {condition.id.slice(0, 6).toUpperCase()}</span>
            <div className="ao-h5" style={{ marginTop: 4 }}>{condition.name}</div>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              border: '1px solid var(--brass)',
              background: 'var(--abyss)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Rune kind="sigil-1" size={18} color="var(--gold-pale)" />
          </div>
        </div>

        {/* Description */}
        {condition.description && (
          <p
            className="ao-italic"
            style={{ fontSize: 13.5, marginTop: 10, color: 'var(--ink)', lineHeight: 1.5 }}
          >
            {condition.description}
          </p>
        )}

        {/* Modifiers divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
          <span className="ao-overline" style={{ fontSize: 9 }}>Modifiers</span>
          <span style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          <span className="ao-codex">{condition.modifiers.length}</span>
        </div>

        {/* Modifier tags + add button */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {condition.modifiers.map((mod) => (
            <span
              key={mod.id}
              style={{ position: 'relative', cursor: 'pointer' }}
              onClick={() => onDeleteModifier(condition.id, mod.id)}
              title="Click to remove modifier"
            >
              <ModifierTag mod={mod} />
            </span>
          ))}

          {/* Inline add modifier form or dashed add button */}
          {addingModifierId === condition.id ? (
            <div
              style={{
                width: '100%',
                marginTop: 4,
                padding: 10,
                border: '1px solid var(--rule)',
                background: 'var(--abyss)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <Select value={modStatId} onValueChange={setModStatId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stat" />
                </SelectTrigger>
                <SelectContent>
                  {statTypes.map((st) => (
                    <SelectItem key={st.id} value={st.id}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                className="ao-input"
                type="number"
                value={modValue}
                onChange={(e) => setModValue(e.target.value)}
                placeholder="Value (e.g. -2)"
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="ao-btn ao-btn--primary ao-btn--sm"
                  onClick={() => onAddModifier(condition.id)}
                  disabled={!modStatId || !modValue || addModifierPending}
                >
                  {addModifierPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Bind'}
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => {
                    setAddingModifierId(null);
                    setModStatId('');
                    setModValue('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                border: '1px dashed var(--brass)',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--brass)',
              }}
              onClick={() => {
                setAddingModifierId(condition.id);
                setModStatId('');
                setModValue('');
              }}
              title="Add modifier"
            >
              <Rune kind="plus" size={8} color="var(--brass)" />
              add
            </button>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '12px 18px',
          borderTop: '1px solid var(--hairline)',
          background: 'var(--abyss)',
        }}
      >
        <button
          className="ao-btn ao-btn--primary"
          style={{ flex: 1 }}
          onClick={() => onApply(condition.id)}
        >
          Apply to Character
        </button>
        <button className="ao-btn ao-btn--sm" onClick={() => onEdit(condition)}>
          Edit
        </button>
        <button
          className="ao-btn ao-btn--sm ao-btn--danger"
          onClick={() => onDelete(condition.id)}
        >
          Delete
        </button>
      </div>
    </OrdoPanel>
  );
}

/* ------------------------------------------------------------------ */
/*  ActiveLedger                                                      */
/* ------------------------------------------------------------------ */
interface ActiveRow {
  characterId: string;
  characterName: string;
  characterConditionId: string;
  conditionName: string;
  conditionDescription?: string;
  modifiers: ConditionModifierResponse[];
  appliedAt: string;
}

function ActiveLedger({
  rows,
  onLift,
  liftPending,
}: {
  rows: ActiveRow[];
  onLift: (characterId: string, characterConditionId: string) => void;
  liftPending: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
          No edicts are presently in force. The realm rests unburdened.
        </p>
      </div>
    );
  }

  // Group rows by character for the "grouped first row" display
  let lastCharId = '';

  return (
    <OrdoPanel frame padding={0}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--hairline)',
              background: 'var(--abyss)',
            }}
          >
            {['Character', 'Condition', 'Modifiers', 'Applied At', ''].map((h) => (
              <th
                key={h}
                className="ao-overline"
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: 9,
                  color: 'var(--brass)',
                  fontWeight: 400,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isFirstForChar = row.characterId !== lastCharId;
            lastCharId = row.characterId;

            return (
              <tr
                key={row.characterConditionId}
                style={{ borderBottom: '1px solid var(--hairline)' }}
              >
                {/* Character */}
                <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                  {isFirstForChar ? (
                    <div>
                      <div className="ao-h5" style={{ fontSize: 13 }}>{row.characterName}</div>
                      <span className="ao-codex" style={{ fontSize: 9, color: 'var(--ink-ghost)' }}>
                        {row.characterId.slice(0, 8).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--ink-ghost)', fontSize: 13, paddingLeft: 8 }}>
                      {'\u21B3'}
                    </span>
                  )}
                </td>

                {/* Condition name */}
                <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Rune kind="sigil-1" size={12} color="var(--gold-pale)" />
                    <span style={{ fontSize: 13 }}>{row.conditionName}</span>
                  </span>
                </td>

                {/* Modifiers */}
                <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {row.modifiers.map((mod) => (
                      <ModifierTag key={mod.id} mod={mod} />
                    ))}
                    {row.modifiers.length === 0 && (
                      <span className="ao-italic" style={{ fontSize: 11, color: 'var(--ink-ghost)' }}>
                        none
                      </span>
                    )}
                  </div>
                </td>

                {/* Applied At */}
                <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                  <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-quiet)' }}>
                    {new Date(row.appliedAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </td>

                {/* Lift button */}
                <td style={{ padding: '10px 14px', verticalAlign: 'top', textAlign: 'right' }}>
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm ao-btn--danger"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    onClick={() => onLift(row.characterId, row.characterConditionId)}
                    disabled={liftPending}
                    title="Lift this edict"
                  >
                    <Rune kind="x" size={10} color="currentColor" />
                    Lift
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </OrdoPanel>
  );
}

/* ================================================================== */
/*  ConditionsPage                                                    */
/* ================================================================== */
export default function ConditionsPage() {
  const { data, isLoading, error, refetch } = useConditions();
  const { data: statTypes } = useStatTypes();
  const { data: characters } = useCharacters();
  const createMutation = useCreateCondition();
  const updateMutation = useUpdateCondition();
  const deleteMutation = useDeleteCondition();
  const addModifierMutation = useAddConditionModifier();
  const deleteModifierMutation = useDeleteConditionModifier();
  const applyMutation = useApplyCondition();
  const removeMutation = useRemoveCondition();

  const [activeTab, setActiveTab] = useState<TabKey>('edicts');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ConditionResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Apply-to-character dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyConditionId, setApplyConditionId] = useState<string | null>(null);
  const [applyCharacterId, setApplyCharacterId] = useState('');

  // Form state for condition
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Inline modifier form state (per condition)
  const [addingModifierId, setAddingModifierId] = useState<string | null>(null);
  const [modStatId, setModStatId] = useState('');
  const [modValue, setModValue] = useState('');

  // Fetch character conditions for ALL characters (for the Active tab)
  const characterConditionsQueries = (characters || []).map((ch) => ({
    characterId: ch.id,
    characterName: ch.name,
    // eslint-disable-next-line react-hooks/rules-of-hooks
    query: useCharacterConditions(ch.id),
  }));

  // Build flat active-rows from all character conditions
  const activeRows = useMemo<ActiveRow[]>(() => {
    const rows: ActiveRow[] = [];
    for (const entry of characterConditionsQueries) {
      const conditions = entry.query.data;
      if (!conditions) continue;
      for (const cc of conditions) {
        if (!cc.active) continue;
        rows.push({
          characterId: entry.characterId,
          characterName: entry.characterName,
          characterConditionId: cc.id,
          conditionName: cc.conditionName,
          conditionDescription: cc.conditionDescription,
          modifiers: cc.modifiers,
          appliedAt: cc.appliedAt,
        });
      }
    }
    // Sort by character name then applied date
    rows.sort((a, b) => {
      if (a.characterName !== b.characterName) return a.characterName.localeCompare(b.characterName);
      return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
    });
    return rows;
  }, [characterConditionsQueries]);

  const activeCount = activeRows.length;

  /* ---------- handlers ---------- */

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
  };

  const handleAdd = () => {
    setEditing(null);
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (item: ConditionResponse) => {
    setEditing(item);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: formName,
      description: formDescription || undefined,
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

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  const handleAddModifier = (conditionId: string) => {
    if (!modStatId || !modValue) return;
    addModifierMutation.mutate(
      {
        conditionId,
        data: {
          statTypeId: modStatId,
          modifierValue: Number(modValue),
        },
      },
      {
        onSuccess: () => {
          setAddingModifierId(null);
          setModStatId('');
          setModValue('');
        },
      }
    );
  };

  const handleDeleteModifier = (conditionId: string, modifierId: string) => {
    deleteModifierMutation.mutate({ conditionId, modifierId });
  };

  const handleApplyOpen = (conditionId: string) => {
    setApplyConditionId(conditionId);
    setApplyCharacterId('');
    setApplyDialogOpen(true);
  };

  const handleApplySubmit = () => {
    if (!applyConditionId || !applyCharacterId) return;
    applyMutation.mutate(
      {
        characterId: applyCharacterId,
        data: { conditionId: applyConditionId },
      },
      {
        onSuccess: () => {
          setApplyDialogOpen(false);
          setApplyConditionId(null);
          setApplyCharacterId('');
        },
      }
    );
  };

  const handleLift = (characterId: string, characterConditionId: string) => {
    removeMutation.mutate({ characterId, characterConditionId });
  };

  /* ---------- loading / error ---------- */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Buffs &amp; Banes</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>The Edicts</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 160 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '60%', height: 18, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '80%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The edicts could not be retrieved. The seals remain unbroken.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const edictCount = data?.length ?? 0;

  /* ---------- render ---------- */

  return (
    <div>
      {/* ---- Header row ---- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {/* Left: titles */}
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Buffs &amp; Banes</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>The Edicts</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
            Decrees of influence upon the mortal frame
          </p>
        </div>

        {/* Right: tabs + button + chip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--rule)' }}>
            {([
              { key: 'edicts' as TabKey, label: 'Edicts', count: edictCount },
              { key: 'active' as TabKey, label: 'Active', count: activeCount },
            ]).map((tab) => (
              <button
                key={tab.key}
                className="ao-tab"
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  color: activeTab === tab.key ? 'var(--gold)' : 'var(--ink-quiet)',
                  borderBottom: activeTab === tab.key ? '2px solid var(--gold)' : '2px solid transparent',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottomWidth: 2,
                  borderBottomStyle: 'solid',
                  borderBottomColor: activeTab === tab.key ? 'var(--gold)' : 'transparent',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label} {'\u00B7'} {tab.count}
              </button>
            ))}
          </div>

          {/* Draft New Edict */}
          <button className="ao-btn ao-btn--primary" onClick={handleAdd}>
            <Rune kind="plus" size={14} color="currentColor" />
            <span style={{ marginLeft: 6 }}>Draft New Edict</span>
          </button>

          {/* Role chip */}
          <OrdoChip tone="arcane" glyph="sigil-1">Game-Master</OrdoChip>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  Edicts Tab                                                      */}
      {/* ================================================================ */}
      {activeTab === 'edicts' && (
        <>
          {!data || data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                No edicts have been inscribed. The court awaits thy decrees.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
              }}
            >
              {data.map((condition) => (
                <EdictCard
                  key={condition.id}
                  condition={condition}
                  onEdit={handleEdit}
                  onDelete={(id) => setDeleteId(id)}
                  onApply={handleApplyOpen}
                  onAddModifier={handleAddModifier}
                  onDeleteModifier={handleDeleteModifier}
                  addingModifierId={addingModifierId}
                  setAddingModifierId={setAddingModifierId}
                  modStatId={modStatId}
                  setModStatId={setModStatId}
                  modValue={modValue}
                  setModValue={setModValue}
                  addModifierPending={addModifierMutation.isPending}
                  statTypes={statTypes || []}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ================================================================ */}
      {/*  Active Tab                                                      */}
      {/* ================================================================ */}
      {activeTab === 'active' && (
        <ActiveLedger
          rows={activeRows}
          onLift={handleLift}
          liftPending={removeMutation.isPending}
        />
      )}

      {/* ---- Create / Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Amend Edict' : 'Draft New Edict'}</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Edict name"
              />
            </OrdoField>

            <OrdoField label="Description">
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the edict"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Withhold
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleSubmit}
              disabled={!formName || createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Seal
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Apply-to-Character Dialog ---- */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Edict to Character</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Character" required>
              <Select value={applyCharacterId} onValueChange={setApplyCharacterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select character" />
                </SelectTrigger>
                <SelectContent>
                  {(characters || []).map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setApplyDialogOpen(false)}
              disabled={applyMutation.isPending}
            >
              Withhold
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleApplySubmit}
              disabled={!applyCharacterId || applyMutation.isPending}
            >
              {applyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Apply
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation ---- */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmake this Edict?</AlertDialogTitle>
            <AlertDialogDescription>
              This rite cannot be undone. The edict and all its modifiers shall be purged from the codex.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Unmake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
