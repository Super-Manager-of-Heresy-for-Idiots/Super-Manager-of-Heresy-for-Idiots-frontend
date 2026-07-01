/**
 * GM map library for a campaign: lists the campaign's maps and lets the GM open the
 * grid editor, create a new map, or start a live session (which navigates to the
 * session page once the map-service returns the new session id).
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, MapIcon, Pencil, Play } from 'lucide-react';
import { EmptyVault, ErrorAltar, OrdoPanel } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { MapAssetImage } from '../components';
import { useCampaignMaps, useCreateMapSession } from '../hooks';
import type { MapDefinitionDto, UUID } from '../types';
import s from './CampaignMapListPage.module.css';

export default function CampaignMapListPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: maps, isLoading, error, refetch } = useCampaignMaps(campaignId);
  const createSession = useCreateMapSession();
  const [startingId, setStartingId] = useState<UUID | null>(null);

  const goEditor = (mapId?: UUID) =>
    navigate(`/campaigns/${campaignId}/maps/${mapId ?? 'new'}${mapId ? '/edit' : ''}`);

  const startSession = (map: MapDefinitionDto) => {
    if (!campaignId) return;
    setStartingId(map.id);
    createSession.mutate(
      { campaignId, mapId: map.id },
      {
        onSuccess: (session) =>
          navigate(`/campaigns/${campaignId}/map-sessions/${session.id}`),
        onSettled: () => setStartingId(null),
      },
    );
  };

  if (isLoading) {
    return (
      <div>
        <Header t={t} onNew={() => goEditor()} />
        <div className={cn('ao-rgrid', s.grid)}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.skelThumb)} />
              <div className={cn('ao-ph', s.skelLine)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header t={t} onNew={() => goEditor()} />
        <ErrorAltar
          title={t('map.list.loadError')}
          error={error}
          onRetry={() => refetch()}
          retryLabel={t('common.retry')}
        />
      </div>
    );
  }

  return (
    <div>
      <Header t={t} onNew={() => goEditor()} />

      {!maps || maps.length === 0 ? (
        <EmptyVault
          glyph="sigil-3"
          title={t('map.list.empty.title')}
          body={t('map.list.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => goEditor()}>
              {t('map.list.new')}
            </button>
          }
        />
      ) : (
        <div className={cn('ao-rgrid', s.grid)}>
          {maps.map((map) => (
            <OrdoPanel key={map.id} frame padding={0}>
              <div className={s.cardPad}>
                <div className={s.thumb}>
                  {map.imageAssetId ? (
                    <MapAssetImage
                      className={s.thumbImg}
                      assetId={map.imageAssetId}
                      alt=""
                    />
                  ) : (
                    <MapIcon size={28} aria-hidden="true" className={s.thumbIcon} />
                  )}
                </div>
                <h5 className={cn('ao-h5', s.name)}>{map.name}</h5>
                <p className={cn('ao-italic', s.meta)}>
                  {map.gridConfig.cellWorldSize} {map.gridConfig.cellWorldUnit} · {map.gridType}
                </p>
              </div>

              <div className={s.footer}>
                <button className="ao-btn ao-btn--sm" onClick={() => goEditor(map.id)}>
                  <Pencil size={12} aria-hidden="true" /> {t('map.list.edit')}
                </button>
                <button
                  className="ao-btn ao-btn--sm ao-btn--primary"
                  onClick={() => startSession(map)}
                  disabled={startingId === map.id}
                >
                  {startingId === map.id ? (
                    <Loader2 className={s.spin} size={12} aria-hidden="true" />
                  ) : (
                    <Play size={12} aria-hidden="true" />
                  )}{' '}
                  {t('map.list.play')}
                </button>
              </div>
            </OrdoPanel>
          ))}
        </div>
      )}
    </div>
  );
}

function Header({ t, onNew }: { t: (k: string) => string; onNew: () => void }) {
  return (
    <div className={s.header}>
      <div>
        <p className={cn('ao-overline', s.overline)}>{t('map.list.overline')}</p>
        <h3 className="ao-h3">{t('map.list.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>{t('map.list.subtitle')}</p>
      </div>
      <button className="ao-btn ao-btn--primary" onClick={onNew}>
        {t('map.list.new')}
      </button>
    </div>
  );
}
