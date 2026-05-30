import { Rune } from '@/components/ordo';

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export function VisibilityToggle({ visible, onToggle }: VisibilityToggleProps) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: visible ? 'rgba(74,140,72,0.12)' : 'rgba(0,0,0,0.3)',
        border: `1px solid ${visible ? '#4a8c48' : 'var(--hairline)'}`,
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: visible ? '#6db86a' : 'var(--ink-ghost)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <Rune kind={visible ? 'eye' : 'lock'} size={12} color={visible ? '#6db86a' : 'var(--ink-ghost)'} />
      {visible ? 'Revealed' : 'Hidden'}
    </button>
  );
}
