import { useNavigate } from 'react-router-dom';
import { Rune } from '@/components/ordo';

interface BackLinkProps {
  to?: string;
  label?: string;
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

/**
 * Consistent "back" CTA used across campaign pages.
 * If `to` is provided — navigates to that route. Otherwise — uses browser history.
 */
export function BackLink({ to, label = 'Назад', size = 'sm', style }: BackLinkProps) {
  const navigate = useNavigate();
  const className = size === 'sm' ? 'ao-btn ao-btn--ghost ao-btn--sm' : 'ao-btn ao-btn--ghost';

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button className={className} onClick={handleClick} style={style}>
      <Rune kind="arrow-l" size={size === 'sm' ? 11 : 13} color="currentColor" />
      <span style={{ marginLeft: 6 }}>{label}</span>
    </button>
  );
}
