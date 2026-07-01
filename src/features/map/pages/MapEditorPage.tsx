/**
 * GM map editor. Two modes from one route family:
 *  - CREATE (`/maps/new`): name + optional background image upload + grid calibration,
 *    persisted with a single `mapApi.maps.create`.
 *  - EDIT (`/maps/:mapId/edit`): the map's name/image are read-only (the backend only
 *    exposes a grid-config update over REST); the GM recalibrates the grid and saves
 *    via `updateGridConfig`.
 *
 * The live preview is a {@link MapViewport} whose in-world child is the draggable
 * {@link GridOverlay} origin handle; the {@link GridCalibrationPanel} owns the form.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react';
import { ErrorAltar } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { MapViewport, type MapToolbarLabels } from '../components';
import {
  CalibrationClickLayer,
  CALIBRATION_GRID_TYPE,
  GridCalibrationPanel,
  GridOverlay,
  editableFromGridConfig,
  gridConfigFromEditable,
  isGridConfigValid,
  DEFAULT_GRID_VISUAL,
  type EditableGridConfig,
  type CalibrationClickTarget,
  type GridCalibrationLabels,
} from '../calibration';
import {
  useCreateMap,
  useMapDefinition,
  useUpdateMapGridConfig,
  useUploadMapAsset,
} from '../hooks';
import type { UUID } from '../types';
import s from './MapEditorPage.module.css';

const DEFAULT_EDITABLE: EditableGridConfig = {
  type: 'SQUARE',
  cellWorldSize: 5,
  cellWorldUnit: 'ft',
  visual: DEFAULT_GRID_VISUAL,
  calibration: {
    mode: 'SIMPLE',
    origin: { imageX: 0, imageY: 0 },
    cellWidthPx: 64,
    cellHeightPx: 64,
    rotationDeg: 0,
  },
};

export default function MapEditorPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId, mapId } = useParams<{ campaignId: string; mapId?: string }>();
  const isEdit = !!mapId && mapId !== 'new';

  const mapQuery = useMapDefinition(isEdit ? mapId : undefined);
  const createMap = useCreateMap();
  const updateGrid = useUpdateMapGridConfig();
  const uploadAsset = useUploadMapAsset();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [assetId, setAssetId] = useState<UUID | null>(null);
  const [editable, setEditable] = useState<EditableGridConfig>(DEFAULT_EDITABLE);
  const [baseline, setBaseline] = useState<EditableGridConfig>(DEFAULT_EDITABLE);
  const [activeClickTarget, setActiveClickTarget] = useState<CalibrationClickTarget | null>(null);

  // Seed the form from the loaded definition (edit mode only).
  useEffect(() => {
    if (!isEdit || !mapQuery.data) return;
    const m = mapQuery.data;
    setName(m.name);
    setAssetId(m.imageAssetId);
    const ed = editableFromGridConfig(m.gridConfig);
    setEditable(ed);
    setBaseline(ed);
  }, [isEdit, mapQuery.data]);

  const gridConfig = useMemo(() => gridConfigFromEditable(editable), [editable]);
  const isDirty = useMemo(
    () => JSON.stringify(editable) !== JSON.stringify(baseline),
    [editable, baseline],
  );
  const isSaving = createMap.isPending || updateGrid.isPending;

  const calLabels = useMemo<GridCalibrationLabels>(
    () => ({
      title: t('map.cal.title'),
      save: t('map.cal.save'),
      saving: t('map.cal.saving'),
      reset: t('map.cal.reset'),
      backgroundWarning: t('map.cal.backgroundWarning'),
      errorPositive: t('map.cal.errorPositive'),
      errorFinite: t('map.cal.errorFinite'),
    }),
    [t],
  );

  const toolbarLabels = useMemo<MapToolbarLabels>(
    () => ({
      zoomIn: t('map.toolbar.zoomIn'),
      zoomOut: t('map.toolbar.zoomOut'),
      fit: t('map.toolbar.fit'),
      reset: t('map.toolbar.reset'),
      toggleGrid: t('map.toolbar.toggleGrid'),
    }),
    [t],
  );

  const onPickImage = async (file: File) => {
    if (!campaignId) return;
    try {
      const asset = await uploadAsset.mutateAsync({ campaignId, file });
      setAssetId(asset.id);
    } catch {
      // The mutation displays the localized error toast.
    }
  };

  const onSave = () => {
    if (!campaignId || !isGridConfigValid(editable)) return;
    if (isEdit && mapId) {
      updateGrid.mutate(
        { mapId, request: { gridType: CALIBRATION_GRID_TYPE, gridConfig } },
        { onSuccess: () => setBaseline(editable) },
      );
    } else {
      createMap.mutate(
        {
          campaignId,
          name: name.trim(),
          imageAssetId: assetId,
          gridType: CALIBRATION_GRID_TYPE,
          gridConfig,
        },
        { onSuccess: (map) => navigate(`/campaigns/${campaignId}/maps/${map.id}/edit`) },
      );
    }
  };

  const activeClickInstruction = activeClickTarget
    ? {
        BOUNDS_TOP_LEFT: 'Click top-left grid intersection',
        BOUNDS_BOTTOM_RIGHT: 'Click bottom-right grid intersection',
        FOUR_TOP_LEFT: 'Click top-left grid corner',
        FOUR_TOP_RIGHT: 'Click top-right grid corner',
        FOUR_BOTTOM_RIGHT: 'Click bottom-right grid corner',
        FOUR_BOTTOM_LEFT: 'Click bottom-left grid corner',
      }[activeClickTarget]
    : null;

  const applyCalibrationClick = (target: CalibrationClickTarget, point: { imageX: number; imageY: number }) => {
    setEditable((current) => {
      const calibration = current.calibration;
      if (calibration.mode === 'BOUNDS') {
        if (target === 'BOUNDS_TOP_LEFT') {
          return { ...current, calibration: { ...calibration, topLeft: point } };
        }
        if (target === 'BOUNDS_BOTTOM_RIGHT') {
          return { ...current, calibration: { ...calibration, bottomRight: point } };
        }
      }
      if (calibration.mode === 'FOUR_CORNER') {
        if (target === 'FOUR_TOP_LEFT') {
          return {
            ...current,
            calibration: { ...calibration, corners: { ...calibration.corners, topLeft: point } },
          };
        }
        if (target === 'FOUR_TOP_RIGHT') {
          return {
            ...current,
            calibration: { ...calibration, corners: { ...calibration.corners, topRight: point } },
          };
        }
        if (target === 'FOUR_BOTTOM_RIGHT') {
          return {
            ...current,
            calibration: { ...calibration, corners: { ...calibration.corners, bottomRight: point } },
          };
        }
        if (target === 'FOUR_BOTTOM_LEFT') {
          return {
            ...current,
            calibration: { ...calibration, corners: { ...calibration.corners, bottomLeft: point } },
          };
        }
      }
      return current;
    });
  };

  const back = () => navigate(`/campaigns/${campaignId}/maps`);

  if (isEdit && mapQuery.isLoading) {
    return (
      <div className={cn('ao-panel ao-breathe', s.loading)}>
        <Loader2 className={s.spin} size={20} aria-hidden="true" />
      </div>
    );
  }

  if (isEdit && mapQuery.error) {
    return (
      <ErrorAltar
        title={t('map.editor.loadError')}
        error={mapQuery.error}
        onRetry={() => mapQuery.refetch()}
        retryLabel={t('common.retry')}
      />
    );
  }

  const canSave = isEdit ? isDirty : name.trim().length > 0;

  return (
    <div>
      <div className={s.topbar}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={back}>
          <ArrowLeft size={14} aria-hidden="true" /> {t('map.editor.back')}
        </button>
        <h3 className="ao-h3">{isEdit ? t('map.editor.editTitle') : t('map.editor.newTitle')}</h3>
      </div>

      <div className={s.layout}>
        <div className={s.canvas}>
          <MapViewport
            imageAssetId={assetId}
            grid={gridConfig}
            showSystemGrid
            toolbarLabels={toolbarLabels}
            emptyLabel={t('map.editor.noImage')}
          >
            <GridOverlay
              grid={gridConfig}
              label={t('map.editor.originHandle')}
              onOriginChange={(originX, originY) =>
                setEditable((e) => {
                  if (e.calibration.mode !== 'SIMPLE') return e;
                  return {
                    ...e,
                    calibration: {
                      ...e.calibration,
                      origin: { imageX: originX, imageY: originY },
                    },
                  };
                })
              }
            />
            {activeClickTarget && activeClickInstruction && (
              <CalibrationClickLayer
                instruction={activeClickInstruction}
                onPick={(point) => {
                  applyCalibrationClick(activeClickTarget, point);
                  setActiveClickTarget(null);
                }}
              />
            )}
          </MapViewport>
        </div>

        <aside className={s.side}>
          <section className={cn('ao-panel', s.identity)}>
            <div className="ao-field">
              <label className="ao-label" htmlFor="map-name">
                {t('map.editor.name')}
              </label>
              <input
                id="map-name"
                className="ao-input"
                value={name}
                disabled={isEdit}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('map.editor.namePlaceholder')}
              />
            </div>

            {!isEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className={s.hiddenFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void onPickImage(file);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className="ao-btn ao-btn--ghost ao-btn--block"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadAsset.isPending}
                >
                  {uploadAsset.isPending ? (
                    <Loader2 className={s.spin} size={14} aria-hidden="true" />
                  ) : (
                    <ImagePlus size={14} aria-hidden="true" />
                  )}{' '}
                  {assetId ? t('map.editor.changeImage') : t('map.editor.uploadImage')}
                </button>
              </>
            )}
          </section>

          <GridCalibrationPanel
            value={editable}
            isSaving={isSaving}
            isDirty={isDirty}
            canSave={canSave}
            onChange={setEditable}
            onSave={onSave}
            onReset={() => setEditable(baseline)}
            activeClickTarget={activeClickTarget}
            onStartPointCapture={setActiveClickTarget}
            labels={calLabels}
          />
        </aside>
      </div>
    </div>
  );
}
