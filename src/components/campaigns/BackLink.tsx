import { useNavigate } from 'react-router-dom';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './BackLink.module.css';

interface BackLinkProps {
  to?: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Consistent "back" CTA used across campaign pages.
 * If `to` is provided — navigates to that route. Otherwise — uses browser history.
 */
export function BackLink({ to, label, size = 'sm', className, style }: BackLinkProps) {
  const navigate = useNavigate();
  const t = useT();
  const resolvedLabel = label ?? t('cmp2.back');
  const baseClass = size === 'sm' ? 'ao-btn ao-btn--ghost ao-btn--sm' : 'ao-btn ao-btn--ghost';

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button className={cn(baseClass, className)} onClick={handleClick} style={style}>
      <Rune kind="arrow-l" size={size === 'sm' ? 11 : 13} color="currentColor" />
      <span className={s.label}>{resolvedLabel}</span>
    </button>
  );
}
