import { Rune } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';

interface ReadOnlyOverlayProps {
  status: string;
  characterName?: string;
}

const STATUS_DESCRIPTIONS: Record<string, string> = {
  DEAD: 'This character has fallen and their sheet is sealed.',
  RESERVE: 'This character is on reserve and their sheet is locked.',
};

export function ReadOnlyOverlay({ status, characterName }: ReadOnlyOverlayProps) {
  const isDead = status === 'DEAD';
  const gradientColor = isDead ? 'rgba(176,106,106,0.12)' : 'rgba(90,90,90,0.10)';
  const description =
    STATUS_DESCRIPTIONS[status] ?? 'This character sheet is read-only.';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: `radial-gradient(ellipse at center, ${gradientColor}, rgba(0,0,0,0.85) 70%)`,
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Lock Sigil */}
      <div
        style={{
          width: 64,
          height: 64,
          border: `1px solid ${isDead ? '#b06a6a44' : 'var(--rule)'}`,
          background: 'var(--abyss)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Rune
          kind="lock"
          size={32}
          color={isDead ? '#b06a6a' : 'var(--ink-faint)'}
        />
      </div>

      {/* Status badge */}
      <CharStatusBadge status={status} />

      {/* Character name */}
      {characterName && (
        <div
          style={{
            fontSize: 16,
            fontFamily: 'var(--font-display)',
            color: 'var(--ink-quiet)',
            letterSpacing: '0.06em',
          }}
        >
          {characterName}
        </div>
      )}

      {/* Description */}
      <div
        style={{
          fontSize: 13,
          fontStyle: 'italic',
          color: 'var(--ink-faint)',
          textAlign: 'center',
          maxWidth: 280,
          lineHeight: 1.5,
        }}
      >
        {description}
      </div>
    </div>
  );
}
