import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Rune } from '@/components/ordo';
import { useBuffsDebuffs } from '@/hooks/useAdmin';
import { effectNature, effectSummary } from '@/lib/effects';
import type { BuffDebuffResponse } from '@/types';
import s from './ItemBuffPickerDialog.module.css';

interface ItemBuffPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSave: (ids: string[]) => void;
  saving?: boolean;
  title?: string;
  itemName?: string;
}

export function ItemBuffPickerDialog({
  open,
  onOpenChange,
  selectedIds,
  onSave,
  saving = false,
  title = 'Configure item buffs',
  itemName,
}: ItemBuffPickerDialogProps) {
  const [query, setQuery] = useState('');
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const { data, isLoading, isError, refetch } = useBuffsDebuffs(undefined, open);
  const selectedIdsKey = selectedIds.join('|');

  useEffect(() => {
    if (open) {
      setDraftIds(selectedIds);
      setQuery('');
    }
  }, [open, selectedIdsKey]);

  const draftSet = useMemo(() => new Set(draftIds), [draftIds]);

  const effects = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (data ?? []).slice().sort((a, b) => {
      if (a.isBuff !== b.isBuff) return a.isBuff ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    if (!q) return list;
    return list.filter((effect) => {
      const haystack = [
        effect.name,
        effect.description,
        effect.effectType,
        effect.targetStatName,
        effectNature(effect),
        effectSummary(effect),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [data, query]);

  const toggle = (effect: BuffDebuffResponse) => {
    setDraftIds((current) =>
      current.includes(effect.id)
        ? current.filter((id) => id !== effect.id)
        : [...current, effect.id],
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={s.modal}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className={s.body}>
          {itemName && <div className="ao-italic">{itemName}</div>}
          <div className={s.search}>
            <Rune kind="search" size={14} color="var(--ink-faint)" />
            <input
              className={s.searchInput}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search buffs and debuffs"
            />
          </div>

          {isLoading ? (
            <div className={s.state}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading effects
            </div>
          ) : isError ? (
            <div className={s.state}>
              <button type="button" className="ao-btn ao-btn--ghost" onClick={() => refetch()}>
                <Rune kind="arrow-r" size={11} /> Retry loading effects
              </button>
            </div>
          ) : effects.length === 0 ? (
            <div className={s.state}>No effects found</div>
          ) : (
            <div className={s.list}>
              {effects.map((effect) => {
                const checked = draftSet.has(effect.id);
                return (
                  <button
                    key={effect.id}
                    type="button"
                    className={cn(s.effect, checked && s.effectOn)}
                    onClick={() => toggle(effect)}
                    aria-pressed={checked}
                    style={{ '--c': effect.isBuff ? '#7a9866' : '#c0584a' } as CSSProperties}
                  >
                    <span className={cn(s.box, checked && s.boxOn)}>
                      {checked && <Rune kind="check" size={13} color="var(--stone)" />}
                    </span>
                    <span className={s.main}>
                      <span className={s.nameLine}>
                        <span className={s.name}>{effect.name}</span>
                        <span className={s.kind}>{effectNature(effect)}</span>
                      </span>
                      <span className={cn('ao-italic', s.summary)}>
                        {effectSummary(effect) || effect.description || effect.effectType}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className={s.footerNote}>{draftIds.length} selected</div>
          <button type="button" className="ao-btn ao-btn--ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="ao-btn ao-btn--primary" onClick={() => onSave(draftIds)} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
