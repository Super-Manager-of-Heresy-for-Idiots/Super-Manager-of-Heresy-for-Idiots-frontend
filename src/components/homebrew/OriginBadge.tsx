import { cn } from '@/lib/utils';
import s from './OriginBadge.module.css';

/**
 * Бейдж происхождения контента (P2-5 / FE-3). Потребляет маркеры P0-4 (`source`/`homebrewTitle`).
 * Для ванильного (GLOBAL) контента не рендерит ничего — бейджем помечается только homebrew,
 * чтобы игрок сразу отличал пользовательский контент от базового в каталогах и на карточках.
 */
interface OriginBadgeProps {
  /** GLOBAL | HOMEBREW (или любой источник, где не HOMEBREW трактуется как ваниль). */
  source?: string | null;
  /** Название homebrew-пакета — показывается рядом, если передано. */
  homebrewTitle?: string | null;
  /** Компактный режим: только метка «HB» без названия пакета. */
  compact?: boolean;
  className?: string;
}

export function OriginBadge({ source, homebrewTitle, compact, className }: OriginBadgeProps) {
  if (source !== 'HOMEBREW') return null;
  return (
    <span className={cn(s.badge, className)} title={homebrewTitle ?? 'Homebrew'}>
      <span className={s.dot} />
      {compact ? 'HB' : 'Homebrew'}
      {!compact && homebrewTitle && <span className={s.title}>· {homebrewTitle}</span>}
    </span>
  );
}
