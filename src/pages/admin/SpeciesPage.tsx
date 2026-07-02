import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { referenceApi } from '@/api/reference.api';
import { OrdoPanel } from '@/components/ordo';
import { PanelHeader } from '@/components/ordo';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { SpeciesDetail } from '@/types';
import s from './AdminCrud.module.css';

function speciesName(species: SpeciesDetail): string {
  return species.nameRu || species.nameEn || species.name;
}

function speciesSpeed(species: SpeciesDetail): string {
  const speeds = species.speeds
    .map((speed) => {
      const type = speed.type || 'walk';
      const amount = speed.amountFt == null ? speed.rawText : `${speed.amountFt} ft`;
      return amount ? `${type}: ${amount}` : null;
    })
    .filter(Boolean);
  return speeds.length ? speeds.join(', ') : '-';
}

function labelList(items: { name?: string | null; nameRu?: string | null; nameEn?: string | null }[]): string {
  return items.map((item) => item.nameRu || item.nameEn || item.name).filter(Boolean).join(', ') || '-';
}

export default function SpeciesPage() {
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['admin', 'species'],
    queryFn: async () => (await referenceApi.getSpecies()).data ?? [],
  });

  const species = useMemo(() => query.data ?? [], [query.data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return species;
    return species.filter((row) => {
      const haystack = [
        row.name,
        row.nameRu,
        row.nameEn,
        row.slug,
        row.creatureType?.name,
        row.creatureType?.nameRu,
        row.creatureType?.nameEn,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [search, species]);

  if (query.isLoading) {
    return (
      <div>
        <div className={s.header}>
          <div>
            <div className="ao-overline">Content model</div>
            <div className={cn('ao-h3', s.titleH3)}>Species</div>
          </div>
        </div>
        <div className={s.skelCol}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-ph', s.skelRow)} />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          Failed to load species from <code>/reference/species</code>.
        </p>
        {isRetryableError(query.error) && (
          <button className="ao-btn" onClick={() => query.refetch()}>Retry</button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className={s.header}>
        <div>
          <div className="ao-overline">Content model</div>
          <div className={cn('ao-h3', s.titleH3)}>Species</div>
        </div>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader
          title="Species"
          sub={`${species.length} records from /reference/species`}
          glyph="hex"
          right={
            <div className={s.panelSearch}>
              <input
                className={cn('ao-input', s.searchInput)}
                placeholder="Search species..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />

        <table className="ao-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Creature type</th>
              <th>Sizes</th>
              <th>Speed</th>
              <th>Traits</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td className={s.cellName}>
                  {speciesName(row)}
                  {row.slug && <div className="ao-codex">{row.slug}</div>}
                </td>
                <td>{row.creatureType?.nameRu || row.creatureType?.nameEn || row.creatureType?.name || '-'}</td>
                <td>{labelList(row.sizeOptions)}</td>
                <td>{speciesSpeed(row)}</td>
                <td>{row.traits.length}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className={s.emptyCell}>
                  <span className={cn('ao-italic', s.emptyText)}>No species match the filters.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className={s.footer}>
          <span className="ao-codex">{filtered.length} of {species.length}</span>
          <span className="ao-codex">read-only reference data</span>
        </div>
      </OrdoPanel>
    </div>
  );
}
