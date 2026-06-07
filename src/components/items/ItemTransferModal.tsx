import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField, Rune, OrdoDivider } from '@/components/ordo';
import { useTransferItem } from '@/hooks/useInventory';
import { useT } from '@/i18n/I18nContext';
import type { ItemInstanceResponse, CampaignMember } from '@/types';

/* ── Props ─────────────────────────────────────────────────────── */

interface ItemTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemInstanceResponse;
  campaignId: string;
  fromCharId: string;
  campaignMembers: CampaignMember[];
}

/* ── Component ─────────────────────────────────────────────────── */

export function ItemTransferModal({
  open,
  onOpenChange,
  item,
  campaignId,
  fromCharId,
  campaignMembers,
}: ItemTransferModalProps) {
  const t = useT();
  const transferMutation = useTransferItem();

  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [quantity, setQuantity] = useState(1);

  const resetForm = () => {
    setSelectedRecipient('');
    setQuantity(1);
  };

  const handleTransfer = () => {
    if (!selectedRecipient) return;

    transferMutation.mutate(
      {
        campaignId,
        fromCharId,
        instanceId: item.id,
        data: {
          toCharacterId: selectedRecipient,
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

  const displayName = item.displayName;
  const isStackable = item.quantity > 1;

  /* ── Recipient list (exclude self) ── */

  const recipients = campaignMembers.filter(
    (m) => m.userId !== fromCharId,
  );

  /* ── Footer ── */

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <button
        className="ao-btn ao-btn--ghost"
        onClick={() => handleOpenChange(false)}
        disabled={transferMutation.isPending}
      >
        {t('common.cancel')}
      </button>
      <button
        className="ao-btn ao-btn--primary"
        onClick={handleTransfer}
        disabled={!selectedRecipient || transferMutation.isPending}
      >
        {transferMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {t('cmp.transfer.transfer')}
      </button>
    </div>
  );

  /* ── Render ── */

  return (
    <ModalScene
      open={open}
      onOpenChange={handleOpenChange}
      overline={t('cmp.transfer.overline')}
      title={t('cmp.transfer.title')}
      sub={displayName}
      rune="arrow-r"
      footer={footer}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Recipient selection */}
        <OrdoField label={t('cmp.transfer.recipient')} required>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: 220,
              overflowY: 'auto',
              border: '1px solid var(--rule)',
              background: 'var(--abyss)',
              padding: 4,
            }}
          >
            {recipients.length === 0 ? (
              <div
                className="ao-italic"
                style={{
                  padding: '16px 12px',
                  textAlign: 'center',
                  color: 'var(--ink-faint)',
                  fontSize: 13,
                }}
              >
                {t('cmp.transfer.noMembers')}
              </div>
            ) : (
              recipients.map((member) => {
                const selected = selectedRecipient === member.userId;
                return (
                  <label
                    key={member.userId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: selected ? 'rgba(255,255,255,0.04)' : 'transparent',
                      border: `1px solid ${selected ? 'var(--gold)' : 'transparent'}`,
                      transition: 'all 0.12s',
                    }}
                  >
                    <input
                      type="radio"
                      name="transfer-recipient"
                      value={member.userId}
                      checked={selected}
                      onChange={() => setSelectedRecipient(member.userId)}
                      style={{ accentColor: 'var(--gold)' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: 'var(--ink-bright)' }}>
                        {member.username}
                      </div>
                      <div
                        className="ao-codex"
                        style={{ fontSize: 9, color: 'var(--ink-faint)', marginTop: 2 }}
                      >
                        {member.roleInCampaign}
                      </div>
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </OrdoField>

        {/* Quantity input (only if stackable) */}
        {isStackable && (
          <OrdoField
            label={t('cmp.transfer.quantity')}
            hint={t('cmp.transfer.available', { count: item.quantity })}
          >
            <input
              className="ao-input"
              type="number"
              min={1}
              max={item.quantity}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(item.quantity, Math.max(1, Number(e.target.value))),
                )
              }
            />
          </OrdoField>
        )}

        {/* Warning if equipped */}
        {item.slot && (
          <>
            <OrdoDivider glyph="tri" color="var(--ember)" />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '10px 12px',
                background: 'rgba(180,80,60,0.08)',
                border: '1px solid var(--ember)',
              }}
            >
              <Rune kind="flame" size={14} color="var(--ember)" />
              <div>
                <div
                  className="ao-label"
                  style={{
                    marginBottom: 2,
                    fontSize: 11,
                    color: 'var(--ember)',
                  }}
                >
                  {t('cmp.transfer.equippedItem')}
                </div>
                <div
                  className="ao-italic"
                  style={{ fontSize: 12, color: 'var(--ink-faint)' }}
                >
                  {t('cmp.transfer.equippedWarning')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ModalScene>
  );
}
