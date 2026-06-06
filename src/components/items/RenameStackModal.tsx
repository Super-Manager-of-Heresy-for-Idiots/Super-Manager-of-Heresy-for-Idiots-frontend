import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField, Rune } from '@/components/ordo';
import { useRenameItem } from '@/hooks/useInventory';
import type { ItemInstanceResponse } from '@/types';

/* ── Props ─────────────────────────────────────────────────────── */

interface RenameStackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemInstanceResponse;
  campaignId: string;
  characterId: string;
}

/* ── Mode option data ──────────────────────────────────────────── */

const MODES: { value: boolean; label: string; desc: string; glyph: string }[] = [
  {
    value: true,
    label: 'Rename whole stack',
    desc: 'Applies the new name to every item in the stack.',
    glyph: 'square',
  },
  {
    value: false,
    label: 'Split one away & name it',
    desc: 'Separates a single item from the stack and gives it a unique name.',
    glyph: 'diamond',
  },
];

/* ── Component ─────────────────────────────────────────────────── */

export function RenameStackModal({
  open,
  onOpenChange,
  item,
  campaignId,
  characterId,
}: RenameStackModalProps) {
  const renameMutation = useRenameItem();

  const [renameEntireStack, setRenameEntireStack] = useState(true);
  const [newName, setNewName] = useState('');

  const resetForm = () => {
    setRenameEntireStack(true);
    setNewName('');
  };

  const handleRename = () => {
    if (!newName.trim()) return;

    renameMutation.mutate(
      {
        campaignId,
        characterId,
        instanceId: item.id,
        data: {
          customName: newName.trim(),
          renameEntireStack,
        },
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const displayName = item.customName ?? item.displayName;

  /* ── Footer ── */

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <button
        className="ao-btn ao-btn--ghost"
        onClick={() => handleOpenChange(false)}
        disabled={renameMutation.isPending}
      >
        Cancel
      </button>
      <button
        className="ao-btn ao-btn--primary"
        onClick={handleRename}
        disabled={!newName.trim() || renameMutation.isPending}
      >
        {renameMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Rename
      </button>
    </div>
  );

  /* ── Render ── */

  return (
    <ModalScene
      open={open}
      onOpenChange={handleOpenChange}
      overline="Inscription"
      title="Rename Stack"
      sub={displayName}
      rune="scroll"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Mode selection */}
        <OrdoField label="Rename Mode">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MODES.map((opt) => {
              const selected = renameEntireStack === opt.value;
              return (
                <label
                  key={String(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: selected
                      ? 'rgba(255,255,255,0.04)'
                      : 'transparent',
                    border: `1px solid ${selected ? 'var(--gold)' : 'var(--rule)'}`,
                    transition: 'all 0.12s',
                  }}
                >
                  <input
                    type="radio"
                    name="rename-mode"
                    value={String(opt.value)}
                    checked={selected}
                    onChange={() => setRenameEntireStack(opt.value)}
                    style={{
                      marginTop: 2,
                      accentColor: 'var(--gold)',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Rune kind={opt.glyph} size={10} color={selected ? 'var(--gold)' : 'var(--ink-quiet)'} />
                      <span
                        style={{
                          fontSize: 13,
                          color: selected ? 'var(--ink-bright)' : 'var(--ink)',
                          fontWeight: selected ? 600 : 400,
                        }}
                      >
                        {opt.label}
                      </span>
                    </div>
                    <div
                      className="ao-italic"
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-faint)',
                        marginTop: 4,
                        lineHeight: 1.4,
                      }}
                    >
                      {opt.desc}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </OrdoField>

        {/* New name input */}
        <OrdoField label="New Name" required>
          <input
            className="ao-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter a new name..."
            autoFocus
          />
        </OrdoField>

        {/* Preview */}
        <div
          style={{
            padding: '8px 12px',
            background: 'var(--abyss)',
            border: '1px solid var(--rule)',
          }}
        >
          <span
            className="ao-codex"
            style={{ fontSize: 9, color: 'var(--ink-faint)' }}
          >
            Preview
          </span>
          <div
            style={{
              fontSize: 14,
              color: 'var(--ink-bright)',
              marginTop: 4,
              fontFamily: 'var(--font-display)',
            }}
          >
            {newName.trim() || displayName}
          </div>
          {newName.trim() && (
            <div
              className="ao-italic"
              style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}
            >
              (originally {item.templateName})
            </div>
          )}
        </div>
      </div>
    </ModalScene>
  );
}
