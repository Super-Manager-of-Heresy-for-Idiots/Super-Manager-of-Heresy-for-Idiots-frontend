/**
 * Battle → tactical-map picker. The GM opens this from the battle flow to attach a
 * prepared map (or branch off to upload / build a new one) before tactical play.
 *
 * Selecting a map creates a battle-linked map session via the map-service
 * (`externalBattleId = Battle.id`) and navigates to the tactical workspace with the
 * new session. Upload / blank-grid choices route to the existing map editor; the
 * "continue without map" choice simply closes and keeps the classic `/battle` flow.
 *
 * No map library state is duplicated here — the list comes from {@link useCampaignMaps}.
 */

import { Loader2 } from 'lucide-react';
import { ModalScene, OrdoInterfaceIcon } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { MapAssetImage } from '../components';
import { useCampaignMaps, useCreateMapSession } from '../hooks';
import { isForbidden, isMapSessionClosed, isNotFound, isUnauthorized } from '../utils';
import type { MapDefinitionDto, UUID } from '../types';
import {
  battleTabRoute,
  mapSourceType,
  resolveMapSelectionAction,
  type MapSelectionChoice,
} from './battleMapSelection';
import s from './BattleMapSelectionModal.module.css';

interface BattleMapSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: UUID;
  battleId: UUID;
  battleName?: string;
}

export function BattleMapSelectionModal({
  open,
  onOpenChange,
  campaignId,
  battleId,
  battleName,
}: BattleMapSelectionModalProps) {
  const t = useT();
  const navigate = useNavigate();
  const { data: maps, isLoading, error, refetch } = useCampaignMaps(campaignId);
  const createSession = useCreateMapSession();

  const dispatch = (choice: MapSelectionChoice) => {
    const action = resolveMapSelectionAction(choice, { campaignId, battleId });
    switch (action.kind) {
      case 'create-session':
        createSession.mutate(action.request, {
          onSuccess: (session) => {
            onOpenChange(false);
            navigate(battleTabRoute(campaignId, session.id));
          },
        });
        break;
      case 'navigate':
        onOpenChange(false);
        navigate(action.to);
        break;
      case 'dismiss':
        onOpenChange(false);
        break;
    }
  };

  const canRetry =
    !error ||
    (!isForbidden(error) &&
      !isNotFound(error) &&
      !isUnauthorized(error) &&
      !isMapSessionClosed(error));

  const busy = createSession.isPending;

  return (
    <ModalScene
      open={open}
      onOpenChange={onOpenChange}
      rune="sigil-3"
      icon="tactical-map"
      overline={t('tactical.mapSelect.overline')}
      title={t('tactical.mapSelect.title')}
      sub={battleName}
      width={560}
      footer={
        <div className={s.footer}>
          <button
            className="ao-btn ao-btn--sm"
            onClick={() => dispatch({ type: 'upload' })}
            disabled={busy}
          >
            {t('tactical.mapSelect.upload')}
          </button>
          <button
            className="ao-btn ao-btn--sm"
            onClick={() => dispatch({ type: 'blank' })}
            disabled={busy}
          >
            {t('tactical.mapSelect.blank')}
          </button>
          <button
            className="ao-btn ao-btn--ghost ao-btn--sm"
            onClick={() => dispatch({ type: 'without-map' })}
            disabled={busy}
          >
            {t('tactical.mapSelect.without')}
          </button>
        </div>
      }
    >
      <p className={cn('ao-overline', s.listTitle)}>{t('tactical.mapSelect.listTitle')}</p>

      {isLoading ? (
        <div className={s.note}>{t('tactical.mapSelect.loading')}</div>
      ) : error ? (
        <div className={s.note}>
          <p className="ao-italic">{t('map.list.loadError')}</p>
          {canRetry && (
            <button className="ao-btn ao-btn--sm" onClick={() => refetch()} disabled={busy}>
              {t('common.retry')}
            </button>
          )}
        </div>
      ) : !maps || maps.length === 0 ? (
        <div className={s.note}>
          <p className="ao-italic">{t('tactical.mapSelect.empty')}</p>
        </div>
      ) : (
        <ul className={cn('ao-scroll', s.list)}>
          {maps.map((map) => (
            <MapRow key={map.id} map={map} disabled={busy} onSelect={() => dispatch({ type: 'select-map', mapId: map.id })} />
          ))}
        </ul>
      )}
    </ModalScene>
  );
}

function MapRow({
  map,
  disabled,
  onSelect,
}: {
  map: MapDefinitionDto;
  disabled: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  const source = mapSourceType(map);
  return (
    <li>
      <button type="button" className={s.row} onClick={onSelect} disabled={disabled}>
        <span className={s.thumb}>
          {map.imageAssetId ? (
            <MapAssetImage className={s.thumbImg} assetId={map.imageAssetId} alt="" />
          ) : (
            <OrdoInterfaceIcon icon={source === 'IMAGE' ? 'map-image' : 'grid-square'} size={20} className={s.thumbIcon} />
          )}
        </span>
        <span className={s.rowMain}>
          <span className={s.rowName}>{map.name}</span>
          <span className={s.rowMeta}>
            {t(source === 'IMAGE' ? 'tactical.mapSelect.sourceImage' : 'tactical.mapSelect.sourceGrid')}
            {' · '}
            {map.gridConfig.cellWorldSize} {map.gridConfig.cellWorldUnit} · {map.gridType}
          </span>
        </span>
        {disabled ? (
          <Loader2 className={s.spin} size={14} aria-hidden="true" />
        ) : (
          <span className={cn('ao-chip ao-chip--gold', s.selectChip)}>
            {t('tactical.mapSelect.select')}
          </span>
        )}
      </button>
    </li>
  );
}
