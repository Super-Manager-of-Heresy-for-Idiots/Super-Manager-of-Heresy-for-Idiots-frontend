import { useMemo, useState } from 'react';
import { ModalScene } from '@/components/ordo';
import { useCampaignMonsters } from '@/hooks/useBestiary';
import { useI18n, useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { MonsterSummaryResponse } from '@/types';
import s from './FormsPanels.module.css';

interface MonsterPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  title: string;
  sub?: string;
  busy?: boolean;
  onPick: (monsterId: string) => void;
}

export function monsterDisplayName(m: MonsterSummaryResponse, lang: string): string {
  return (lang === 'ru' ? m.nameRusloc : m.nameEngloc || m.nameRusloc) || m.name || m.slug;
}

/** Shared bestiary picker for learning a Wild Shape form or summoning a companion. */
export function MonsterPickerModal({ open, onOpenChange, campaignId, title, sub, busy, onPick }: MonsterPickerModalProps) {
  const t = useT();
  const { lang } = useI18n();
  const { data: monsters, isLoading } = useCampaignMonsters(campaignId);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (monsters ?? [])
      .filter((m) => !query || monsterDisplayName(m, lang).toLowerCase().includes(query))
      .sort((a, b) => a.crValue - b.crValue || monsterDisplayName(a, lang).localeCompare(monsterDisplayName(b, lang)));
  }, [monsters, q, lang]);

  return (
    <ModalScene open={open} onOpenChange={onOpenChange} title={title} sub={sub} rune="hex" tone="var(--arcane)" width={560}>
      <input
        className={cn('ao-input', s.search)}
        placeholder={t('forms.picker.search')}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className={s.pickerList}>
        {isLoading && <div className={s.hint}>{t('common.loading')}</div>}
        {!isLoading && rows.length === 0 && <div className={s.hint}>{t('forms.picker.empty')}</div>}
        {rows.map((m) => (
          <button
            key={m.id}
            type="button"
            className={s.pickerRow}
            disabled={busy}
            onClick={() => onPick(m.id)}
          >
            <span className={s.name}>{monsterDisplayName(m, lang)}</span>
            <span className={s.cr}>{t('forms.cr', { cr: m.crRating })}</span>
          </button>
        ))}
      </div>
    </ModalScene>
  );
}
