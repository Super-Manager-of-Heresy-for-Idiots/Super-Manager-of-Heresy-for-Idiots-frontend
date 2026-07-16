import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useT } from '@/i18n/I18nContext';
import type { SpellReferenceResponse } from '@/types';
import { SpellGrantPicker } from './SpellGrantPicker';

export interface SpellPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Пул заклинаний для выбора (обычно весь каталог: ванильные + homebrew). */
  pool: SpellReferenceResponse[];
  /** Выбранные id (двусторонняя связь). */
  value: string[];
  onChange: (ids: string[]) => void;
  campaignId?: string;
  title?: string;
}

/**
 * Модалка выбора заклинаний поверх переиспользуемого {@link SpellGrantPicker} (тот же красивый
 * двухпанельный пикер, что в мастере повышения уровня): группировка по кругам и школам, фильтр
 * ванильные/homebrew, детальная панель. Без лимита выбора — подходит для списков вроде врождённых
 * заклинаний вида. Возвращает выбранные id через onChange.
 */
export function SpellPickerModal({ open, onOpenChange, pool, value, onChange, campaignId, title }: SpellPickerModalProps) {
  const t = useT();

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {title ?? t('spellPicker.title')} <span className="ao-num">({value.length})</span>
          </DialogTitle>
        </DialogHeader>

        <SpellGrantPicker
          pool={pool}
          chosen={value}
          need={Number.MAX_SAFE_INTEGER}
          onToggle={toggle}
          campaignId={campaignId}
        />

        <DialogFooter>
          <button type="button" className="ao-btn ao-btn--primary" onClick={() => onOpenChange(false)}>
            {t('common.done')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
