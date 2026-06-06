import { Rune } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';

interface ReadOnlyOverlayProps {
  status: string;
  characterName?: string;
}

const STATUS_DESCRIPTION_KEYS: Record<string, string> = {
  DEAD: 'cmp.readonly.dead',
  RESERVE: 'cmp.readonly.reserve',
};

export function ReadOnlyOverlay({ status, characterName }: ReadOnlyOverlayProps) {
  const t = useT();
  const isDead = status === 'DEAD';
  const gradientColor = isDead ? 'rgba(176,106,106,0.12)' : 'rgba(90,90,90,0.10)';
  const description = t(
    STATUS_DESCRIPTION_KEYS[status] ?? 'cmp.readonly.default',
  );

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
