/**
 * GM auras (Phase 3.1): attach a radius aura to a token. It renders as an AURA session element that
 * follows the token on the board (the map center reads the token's live position). Reuses the AoE 2.3
 * geometry/rendering; here we just create/remove and list. Enter/exit events are a follow-up.
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMapSessionStore } from '../../state';
import { mapSessionApi } from '../../api';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { TacticalTokenView } from '../tacticalView';
import s from './workspace.module.css';

export function AuraPanel({
  sessionId,
  tacticalTokens,
}: {
  sessionId: string;
  tacticalTokens: TacticalTokenView[];
}) {
  const t = useT();
  const mapElements = useMapSessionStore((st) => st.mapElements);
  const [tokenId, setTokenId] = useState('');
  const [radiusStr, setRadiusStr] = useState('10');
  const [busy, setBusy] = useState(false);

  const placed = tacticalTokens.filter((tk) => tk.isPlaced);
  const auras = mapElements.filter(
    (el) => el.mapSessionId != null && (el.properties as Record<string, unknown>)?.aura === true,
  );
  const nameOfToken = (id: string | undefined) =>
    tacticalTokens.find((tk) => tk.tokenId === id)?.displayName ?? '—';

  const radius = parseInt(radiusStr, 10);
  const valid = !!tokenId && Number.isFinite(radius) && radius > 0;

  const create = () => {
    if (!valid || busy) return;
    setBusy(true);
    mapSessionApi
      .createAura(sessionId, { tokenId, sizeFt: radius })
      .then(() => setTokenId(''))
      .catch(() => toast.error(t('tactical.aura.failed')))
      .finally(() => setBusy(false));
  };
  const remove = (elementId: string) => {
    setBusy(true);
    mapSessionApi
      .deleteAura(sessionId, elementId)
      .catch(() => toast.error(t('tactical.aura.failed')))
      .finally(() => setBusy(false));
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.aura.title')}</div>
      <div className={cn('ao-col ao-gap-4', s.mt8)}>
        <select className={cn('ao-input', s.condSelect)} value={tokenId} onChange={(e) => setTokenId(e.target.value)}>
          <option value="">{t('tactical.aura.pickToken')}</option>
          {placed.map((tk) => (
            <option key={tk.tokenId} value={tk.tokenId}>
              {tk.displayName}
            </option>
          ))}
        </select>
        <div className="ao-row ao-gap-4">
          <input
            className={cn('ao-input', s.numField)}
            inputMode="numeric"
            value={radiusStr}
            placeholder={t('tactical.aura.radius')}
            onChange={(e) => setRadiusStr(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <button type="button" className="ao-btn ao-btn--sm ao-btn--primary" disabled={!valid || busy} onClick={create}>
            {t('tactical.aura.create')}
          </button>
        </div>
      </div>
      {auras.length > 0 && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          {auras.map((el) => (
            <div key={el.id} className="ao-row ao-between ao-gap-8">
              <span className={s.optName}>
                {nameOfToken((el.properties as Record<string, unknown>)?.attachedTokenId as string)} ·{' '}
                {String((el.properties as Record<string, unknown>)?.sizeFt ?? '')} ft
              </span>
              <button
                type="button"
                className="ao-btn ao-btn--sm ao-btn--ghost"
                disabled={busy}
                onClick={() => remove(el.id)}
              >
                {t('tactical.aura.remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
