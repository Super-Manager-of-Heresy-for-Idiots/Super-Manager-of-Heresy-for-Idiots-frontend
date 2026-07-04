import { useMemo, useState } from 'react';
import { ModalScene } from '@/components/ordo';
import { useCampaignReferenceSpells } from '@/hooks/useHomebrewCampaign';
import { useLearnSpell } from '@/hooks/useSpellbook';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { SpellReferenceResponse } from '@/types';
import s from './SpellbookAddModal.module.css';

interface SpellbookAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  characterId: string;
  /** Character's class ids — used to offer only class-appropriate spells (empty = no class filter). */
  classIds: string[];
  /** Spell ids the character already knows — excluded from the picker. */
  knownSpellIds: string[];
}

/**
 * Spellbook picker: search the catalog (filtered to the character's classes and to spells not yet known)
 * and record a spell into the character's spellbook. This is the "record newly learned spells" flow the
 * folio was missing (e.g. a Wizard adding spells outside level-up).
 */
export function SpellbookAddModal({
  open,
  onOpenChange,
  campaignId,
  characterId,
  classIds,
  knownSpellIds,
}: SpellbookAddModalProps) {
  const t = useT();
  const { data: spells, isLoading } = useCampaignReferenceSpells(campaignId);
  const learn = useLearnSpell(campaignId, characterId);
  const [q, setQ] = useState('');
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  const known = useMemo(() => new Set(knownSpellIds), [knownSpellIds]);
  const classSet = useMemo(() => new Set(classIds), [classIds]);

  const groups = useMemo(() => {
    const query = q.trim().toLowerCase();
    const pool = (spells ?? []).filter((sp) => {
      if (known.has(sp.id) || justAdded.has(sp.id)) return false;
      // Class filter: keep spells with no class info, or that list one of the character's classes.
      if (classSet.size > 0 && sp.availableToClassIds && sp.availableToClassIds.length > 0) {
        if (!sp.availableToClassIds.some((c) => classSet.has(c))) return false;
      }
      if (query) {
        const hit = sp.name.toLowerCase().includes(query) || (sp.nameEn ?? '').toLowerCase().includes(query);
        if (!hit) return false;
      }
      return true;
    });
    const byLevel = new Map<number, SpellReferenceResponse[]>();
    for (const sp of pool) {
      const arr = byLevel.get(sp.level) ?? [];
      arr.push(sp);
      byLevel.set(sp.level, arr);
    }
    return [...byLevel.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([level, list]) => ({ level, list: list.sort((a, b) => a.name.localeCompare(b.name)) }));
  }, [spells, q, known, justAdded, classSet]);

  const recordSpell = (spellId: string) => {
    learn.mutate(spellId, {
      onSuccess: () =>
        setJustAdded((prev) => {
          const next = new Set(prev);
          next.add(spellId);
          return next;
        }),
    });
  };

  return (
    <ModalScene
      open={open}
      onOpenChange={onOpenChange}
      title={t('spellbook.add.title')}
      sub={t('spellbook.add.sub')}
      rune="hex"
      tone="var(--arcane)"
      width={560}
    >
      <input
        className={cn('ao-input', s.search)}
        placeholder={t('spellbook.add.search')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className={s.list}>
        {isLoading && <div className={s.hint}>{t('common.loading')}</div>}
        {!isLoading && groups.length === 0 && <div className={s.hint}>{t('spellbook.add.empty')}</div>}
        {groups.map((g) => (
          <div key={g.level} className={s.group}>
            <div className={cn('ao-overline', s.groupHead)}>
              {g.level === 0 ? t('spellbook.add.cantrips') : t('spellbook.add.level', { level: g.level })}
            </div>
            {g.list.map((sp) => (
              <div key={sp.id} className={s.row}>
                <span className={s.name}>{sp.name}</span>
                {sp.school && <span className={cn('ao-italic', s.school)}>{sp.school}</span>}
                <button
                  className={cn('ao-btn', 'ao-btn--sm', 'ao-btn--primary', s.addBtn)}
                  disabled={learn.isPending}
                  onClick={() => recordSpell(sp.id)}
                >
                  {t('spellbook.add.record')}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ModalScene>
  );
}
