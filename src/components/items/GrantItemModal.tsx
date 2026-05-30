import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField, Rune } from '@/components/ordo';
import { useGrantItem } from '@/hooks/useInventoryV2';

/* ── Props ─────────────────────────────────────────────────────── */

interface GrantItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
}

/* ── Component ─────────────────────────────────────────────────── */

export function GrantItemModal({
  open,
  onOpenChange,
  characterId,
}: GrantItemModalProps) {
  const grantMutation = useGrantItem();

  const [templateId, setTemplateId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [isUnique, setIsUnique] = useState(false);

  const resetForm = () => {
    setTemplateId('');
    setQuantity(1);
    setCustomName('');
    setIsUnique(false);
  };

  const handleGrant = () => {
    if (!templateId) return;

    grantMutation.mutate(
      {
        characterId,
        data: {
          templateId,
          quantity,
          customName: customName.trim() || undefined,
          isUnique: isUnique || undefined,
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

  /* ── Footer ── */

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <button
        className="ao-btn ao-btn--ghost"
        onClick={() => handleOpenChange(false)}
        disabled={grantMutation.isPending}
      >
        Withhold
      </button>
      <button
        className="ao-btn ao-btn--primary"
        onClick={handleGrant}
        disabled={!templateId || grantMutation.isPending}
      >
        {grantMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Grant Item
      </button>
    </div>
  );

  /* ── Render ── */

  return (
    <ModalScene
      open={open}
      onOpenChange={handleOpenChange}
      overline="Bestow"
      title="Grant Item from Template"
      rune="plus"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Template selector (placeholder search / select) */}
        <OrdoField label="Item Template" required hint="Search or paste a template ID">
          <div style={{ position: 'relative' }}>
            <input
              className="ao-input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              placeholder="Enter template ID..."
              style={{ paddingLeft: 32 }}
            />
            <Rune
              kind="search"
              size={12}
              color="var(--ink-faint)"
              className="ao-input-icon"
            />
          </div>
        </OrdoField>

        {/* Quantity */}
        <OrdoField label="Quantity" hint="Number of items to grant">
          <input
            className="ao-input"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          />
        </OrdoField>

        {/* Custom name */}
        <OrdoField label="Custom Name" hint="Optional override name for this instance">
          <input
            className="ao-input"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Leave blank to use template name"
          />
        </OrdoField>

        {/* Mark as unique */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          <input
            type="checkbox"
            checked={isUnique}
            onChange={(e) => setIsUnique(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: 'var(--arcane)',
            }}
          />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              className="ao-label"
              style={{ marginBottom: 0, fontSize: 12 }}
            >
              Mark as unique
            </span>
            <span
              className="ao-codex"
              style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}
            >
              Unique items cannot be stacked and are tracked individually
            </span>
          </span>
        </label>
      </div>
    </ModalScene>
  );
}
