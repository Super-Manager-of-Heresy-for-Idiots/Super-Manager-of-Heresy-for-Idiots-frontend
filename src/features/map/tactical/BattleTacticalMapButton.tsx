/**
 * GM entry point from the battle flow into tactical-map selection. Renders a button
 * that opens {@link BattleMapSelectionModal}; hidden entirely for non-managers so the
 * map-service is never called without permission (the backend stays authoritative).
 */

import { useState } from 'react';
import { OrdoInterfaceIcon } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { BattleMapSelectionModal } from './BattleMapSelectionModal';
import { canManageBattleMaps } from './battleMapSelection';
import type { UUID } from '../types';

interface BattleTacticalMapButtonProps {
  campaignId: UUID;
  battleId: UUID;
  battleName?: string;
  className?: string;
  block?: boolean;
}

export function BattleTacticalMapButton({
  campaignId,
  battleId,
  battleName,
  className,
  block,
}: BattleTacticalMapButtonProps) {
  const t = useT();
  const role = useAuthStore((st) => st.user?.role);
  const [open, setOpen] = useState(false);

  if (!canManageBattleMaps(role)) return null;

  return (
    <>
      <button
        type="button"
        className={cn('ao-btn ao-btn--ghost', block && 'ao-btn--block', className)}
        onClick={() => setOpen(true)}
      >
        <OrdoInterfaceIcon icon="tactical-map" size={14} />
        <span>{t('tactical.mapSelect.button')}</span>
      </button>

      <BattleMapSelectionModal
        open={open}
        onOpenChange={setOpen}
        campaignId={campaignId}
        battleId={battleId}
        battleName={battleName}
      />
    </>
  );
}
