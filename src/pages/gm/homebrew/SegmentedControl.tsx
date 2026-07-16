import { cn } from '@/lib/utils';
import { OrdoInterfaceIcon } from '@/components/ordo';
import s from './SegmentedControl.module.css';

/** Одна опция сегмент-контрола. */
export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Необязательная иконка Ordo (ключ файла в /ordo-icons/interface). */
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

/**
 * Сегмент-контрол на токенах `.ao-*` — единый примитив выбора одного варианта из словаря (экономика действия,
 * тип дистанции/длительности, вид предмета). Заменяет разрозненные inline-табы конструктора homebrew.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, ariaLabel }: SegmentedControlProps<T>) {
  return (
    <div className={s.group} role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={cn(s.segment, value === opt.value && s.segmentOn)}
          onClick={() => onChange(opt.value)}
        >
          {opt.icon && <OrdoInterfaceIcon icon={opt.icon} size={13} className={s.segIcon} />}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
