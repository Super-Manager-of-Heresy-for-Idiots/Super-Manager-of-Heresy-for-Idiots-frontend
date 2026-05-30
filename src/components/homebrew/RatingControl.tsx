import { Rune } from '@/components/ordo';

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
  const net = likes - dislikes;
  const isSm = size === 'sm';
  const iconSize = isSm ? 10 : 13;
  const fontSize = isSm ? 11 : 13;
  const pad = isSm ? '3px 6px' : '5px 8px';

  const netColor = net > 0 ? 'var(--gold-pale)' : net < 0 ? '#d8896a' : 'var(--ink-quiet)';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        border: '1px solid var(--rule)',
        background: 'var(--abyss)',
      }}
    >
      {/* Up button */}
      <button
        onClick={() => onRate?.(1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: pad,
          background: mine === 'like' ? 'rgba(100,180,100,0.12)' : 'transparent',
          border: 'none',
          borderRight: '1px solid var(--rule)',
          cursor: onRate ? 'pointer' : 'default',
          color: mine === 'like' ? '#8fbc8f' : 'var(--ink-quiet)',
          transition: 'background 0.15s',
        }}
        title="Like"
      >
        <Rune kind="arrow-up" size={iconSize} color={mine === 'like' ? '#8fbc8f' : 'var(--ink-quiet)'} />
        <span className="ao-num" style={{ fontSize, color: mine === 'like' ? '#8fbc8f' : 'var(--ink-quiet)' }}>
          {likes}
        </span>
      </button>

      {/* Net value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: pad,
          minWidth: isSm ? 28 : 36,
          borderRight: '1px solid var(--rule)',
        }}
      >
        <span
          className="ao-num"
          style={{
            fontSize: fontSize + 1,
            fontWeight: 600,
            color: netColor,
          }}
        >
          {net > 0 ? `+${net}` : net}
        </span>
      </div>

      {/* Down button */}
      <button
        onClick={() => onRate?.(-1)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: pad,
          background: mine === 'dislike' ? 'rgba(179,70,26,0.12)' : 'transparent',
          border: 'none',
          cursor: onRate ? 'pointer' : 'default',
          color: mine === 'dislike' ? '#d8896a' : 'var(--ink-quiet)',
          transition: 'background 0.15s',
        }}
        title="Dislike"
      >
        <span className="ao-num" style={{ fontSize, color: mine === 'dislike' ? '#d8896a' : 'var(--ink-quiet)' }}>
          {dislikes}
        </span>
        <span style={{ display: 'inline-flex', transform: 'rotate(180deg)' }}>
          <Rune
            kind="arrow-up"
            size={iconSize}
            color={mine === 'dislike' ? '#d8896a' : 'var(--ink-quiet)'}
          />
        </span>
      </button>
    </div>
  );
}
