import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoField, Rune, OrdoDivider } from '@/components/ordo';
import { useTransferItem } from '@/hooks/useInventory';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ItemInstanceResponse, CampaignMember } from '@/types';
import s from './ItemTransferModal.module.css';

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
    <div className="ao-row ao-justify-end ao-gap-8">
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
      <div className={s.body}>
        {/* Recipient selection */}
        <OrdoField label={t('cmp.transfer.recipient')} required>
          <div className={s.list}>
            {recipients.length === 0 ? (
              <div className={cn('ao-italic', s.empty)}>
                {t('cmp.transfer.noMembers')}
              </div>
            ) : (
              recipients.map((member) => {
                const selected = selectedRecipient === member.userId;
                return (
                  <label
                    key={member.userId}
                    className={cn(s.opt, selected && s.selected)}
                  >
                    <input
                      type="radio"
                      name="transfer-recipient"
                      value={member.userId}
                      checked={selected}
                      onChange={() => setSelectedRecipient(member.userId)}
                      className={s.radio}
                    />
                    <div className={s.optInfo}>
                      <div className={s.optName}>{member.username}</div>
                      <div className={cn('ao-codex', s.optRole)}>
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
            <div className={s.warn}>
              <Rune kind="flame" size={14} color="var(--ember)" />
              <div>
                <div className={cn('ao-label', s.warnLabel)}>
                  {t('cmp.transfer.equippedItem')}
                </div>
                <div className={cn('ao-italic', s.warnText)}>
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
