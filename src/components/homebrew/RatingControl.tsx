import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './RatingControl.module.css';

interface RatingControlProps {
  likes: number;
  dislikes: number;
  mine?: 'like' | 'dislike';
  size?: 'sm' | 'md';
  onRate?: (rating: 1 | -1) => void;
}

export function RatingControl({
  likes,
  dislikes,
  mine,
  size = 'md',
  onRate,
}: RatingControlProps) {
  const t = useT();
  const net = likes - dislikes;
  const isSm = size === 'sm';
  const iconSize = isSm ? 10 : 13;

  const netColor = net > 0 ? 'var(--gold-pale)' : net < 0 ? '#d8896a' : 'var(--ink-quiet)';

  return (
    <div className={cn(s.wrap, isSm && s.sm)}>
      <button
        onClick={() => onRate?.(1)}
        className={cn(s.btn, s.up, mine === 'like' && s.on, onRate && s.clickable)}
        title={t('cmp2.rating.like')}
      >
        <Rune kind="arrow-up" size={iconSize} color={mine === 'like' ? '#8fbc8f' : 'var(--ink-quiet)'} />
        <span className={cn('ao-num', s.num)}>{likes}</span>
      </button>

      <div className={s.net}>
        <span className={cn('ao-num', s.netNum)} style={{ color: netColor }}>
          {net > 0 ? `+${net}` : net}
        </span>
      </div>

      <button
        onClick={() => onRate?.(-1)}
        className={cn(s.btn, s.down, mine === 'dislike' && s.on, onRate && s.clickable)}
        title={t('cmp2.rating.dislike')}
      >
        <span className={cn('ao-num', s.num)}>{dislikes}</span>
        <span className={s.flip}>
          <Rune kind="arrow-up" size={iconSize} color={mine === 'dislike' ? '#d8896a' : 'var(--ink-quiet)'} />
        </span>
      </button>
    </div>
  );
}
