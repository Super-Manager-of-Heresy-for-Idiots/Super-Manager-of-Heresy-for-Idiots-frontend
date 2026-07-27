import { useMemo, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaignMaps } from '@/features/map/hooks/useMapQueries';
import { MapViewport, MapTransitionLayer, type TransitionMarker } from '@/features/map/components';
import type { GridCoord } from '@/features/map/engine';
import type { MapDefinitionDto } from '@/features/map/types';
import {
  useMapTransitions,
  useCreateMapTransition,
  useUpdateMapTransition,
  useDeleteMapTransition,
} from '@/hooks/useWorld';
import type { MapCell } from '@/types';
import s from './MapTransitionEditor.module.css';

interface Props {
  campaignId: string;
  /** Локация, в которую ведёт создаваемый переход (текущая в панели мира). */
  toLocationId?: string;
}

const sameCell = (a: MapCell, b: MapCell) => a.gridX === b.gridX && a.gridY === b.gridY;

/**
 * Визуальный редактор переходов между картами (WORLD_PLAN Этап 5). Мастер отмечает
 * ключевые клетки прямо на карте: слева — откуда игрок уходит (можно несколько клеток,
 * например вся ширина двери), справа — куда он попадёт. Ручной ввод координат больше
 * не нужен: клик по клетке добавляет/снимает отметку.
 */
export function MapTransitionEditor({ campaignId, toLocationId }: Props) {
  const { data: maps = [] } = useCampaignMaps(campaignId);
  const { data: transitions = [] } = useMapTransitions(campaignId);
  const createTransition = useCreateMapTransition();
  const updateTransition = useUpdateMapTransition();
  const deleteTransition = useDeleteMapTransition();

  const [fromMapId, setFromMapId] = useState('');
  const [toMapId, setToMapId] = useState('');
  const [fromCells, setFromCells] = useState<MapCell[]>([]);
  const [toCell, setToCell] = useState<MapCell | null>(null);
  const [label, setLabel] = useState('');

  const fromMap = maps.find((m) => m.id === fromMapId);
  const toMap = maps.find((m) => m.id === toMapId);
  const mapName = (id: string) => maps.find((m) => m.id === id)?.name ?? id.slice(0, 8);

  /** Уже существующие переходы этой карты + клетки, отмеченные прямо сейчас. */
  const fromMarkers = useMemo<TransitionMarker[]>(() => {
    const existing = transitions
      .filter((tr) => tr.fromMapId === fromMapId)
      .flatMap((tr) =>
        tr.fromCells.map((cell) => ({
          gridX: cell.gridX,
          gridY: cell.gridY,
          variant: tr.enabled ? ('enabled' as const) : ('disabled' as const),
          label: tr.label,
        })),
      );
    const picked = fromCells.map((cell) => ({
      gridX: cell.gridX,
      gridY: cell.gridY,
      variant: 'picked' as const,
    }));
    return [...existing, ...picked];
  }, [transitions, fromMapId, fromCells]);

  const toMarkers = useMemo<TransitionMarker[]>(
    () => (toCell ? [{ gridX: toCell.gridX, gridY: toCell.gridY, variant: 'target' }] : []),
    [toCell],
  );

  const toggleFromCell = (cell: GridCoord) =>
    setFromCells((prev) =>
      prev.some((c) => sameCell(c, cell))
        ? prev.filter((c) => !sameCell(c, cell))
        : [...prev, { gridX: cell.gridX, gridY: cell.gridY }],
    );

  const canCreate = !!fromMapId && !!toMapId && fromCells.length > 0 && !!toCell;

  const submit = () => {
    if (!canCreate) return;
    createTransition.mutate(
      {
        campaignId,
        data: {
          fromMapId,
          toMapId,
          fromCells,
          toCell: toCell!,
          toLocationId,
          label: label.trim() || undefined,
          enabled: true,
        },
      },
      {
        onSuccess: () => {
          setFromCells([]);
          setToCell(null);
          setLabel('');
        },
      },
    );
  };

  return (
    <div className={s.body}>
      <div className={s.maps}>
        <MapPane
          title="Откуда"
          maps={maps}
          selectedId={fromMapId}
          onSelect={(id) => {
            setFromMapId(id);
            setFromCells([]);
          }}
          map={fromMap}
          markers={fromMarkers}
          onCellClick={toggleFromCell}
          hint={
            fromCells.length
              ? `Отмечено клеток: ${fromCells.length}. Повторный клик снимает отметку.`
              : 'Кликните по клетке, с которой игрок уходит (можно несколько).'
          }
        />
        <MapPane
          title="Куда"
          maps={maps}
          selectedId={toMapId}
          onSelect={(id) => {
            setToMapId(id);
            setToCell(null);
          }}
          map={toMap}
          markers={toMarkers}
          onCellClick={(cell) => setToCell({ gridX: cell.gridX, gridY: cell.gridY })}
          hint={
            toCell
              ? `Игрок появится в клетке [${toCell.gridX}, ${toCell.gridY}].`
              : 'Кликните по клетке, где игрок окажется после перехода.'
          }
        />
      </div>

      <div className={s.createRow}>
        <input
          className={cn('ao-input', s.labelInput)}
          placeholder="Метка (напр. «Дверь в подвал»)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <button
          className="ao-btn ao-btn--primary ao-btn--sm"
          disabled={!canCreate || createTransition.isPending}
          onClick={submit}
        >
          {createTransition.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Создать переход'}
        </button>
      </div>

      {!transitions.length ? (
        <p className={s.empty}>Переходов нет.</p>
      ) : (
        <ul className={s.list}>
          {transitions.map((tr) => (
            <li key={tr.id} className={s.row}>
              <div className={s.rowMain}>
                <span>{tr.label || 'Переход'}</span>
                <p className={s.rowMeta}>
                  {mapName(tr.fromMapId)}
                  {tr.fromCells[0] && ` [${tr.fromCells[0].gridX},${tr.fromCells[0].gridY}]`}
                  {tr.fromCells.length > 1 && ` +${tr.fromCells.length - 1}`}
                  {' → '}
                  {mapName(tr.toMapId)} [{tr.toCell.gridX},{tr.toCell.gridY}]
                  {!tr.enabled && ' · заперт'}
                </p>
              </div>
              <button
                className="ao-btn ao-btn--sm"
                onClick={() =>
                  updateTransition.mutate({
                    campaignId,
                    transitionId: tr.id,
                    data: { enabled: !tr.enabled },
                  })
                }
              >
                {tr.enabled ? 'Запереть' : 'Отпереть'}
              </button>
              <button
                className="ao-btn ao-btn--sm ao-btn--danger"
                aria-label="Удалить переход"
                onClick={() => deleteTransition.mutate({ campaignId, transitionId: tr.id })}
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MapPane({
  title,
  maps,
  selectedId,
  onSelect,
  map,
  markers,
  onCellClick,
  hint,
}: {
  title: string;
  maps: MapDefinitionDto[];
  selectedId: string;
  onSelect: (mapId: string) => void;
  map?: MapDefinitionDto;
  markers: TransitionMarker[];
  onCellClick: (cell: GridCoord) => void;
  hint: string;
}) {
  return (
    <div className={s.pane}>
      <div className={s.paneHead}>
        <span className={s.paneTitle}>{title}</span>
        <select className="ao-input" value={selectedId} onChange={(e) => onSelect(e.target.value)}>
          <option value="">Выберите карту…</option>
          {maps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className={s.canvas}>
        {map ? (
          <MapViewport
            imageAssetId={map.imageAssetId}
            grid={map.gridConfig}
            showSystemGrid
            onEmptyCellClick={onCellClick}
            emptyLabel="У карты нет изображения"
          >
            <MapTransitionLayer grid={map.gridConfig} markers={markers} />
          </MapViewport>
        ) : (
          <p className={s.placeholder}>Выберите карту, чтобы отметить клетки перехода.</p>
        )}
      </div>
      <p className={s.hint}>{hint}</p>
    </div>
  );
}
