interface VersionSealProps {
  version: number | string;
  size?: number;
}

export function VersionSeal({ version, size = 44 }: VersionSealProps) {
  return (
    <div style={{
      width: size,
      height: size,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        border: '1px solid var(--brass)',
        background: 'radial-gradient(circle at 30% 30%, #2a241f, var(--abyss))',
        clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
      }} />
      <div style={{
        position: 'absolute',
        inset: 4,
        border: '1px solid var(--hairline)',
        clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
      }} />
      <div style={{ position: 'relative', textAlign: 'center', lineHeight: 1 }}>
        <div className="ao-codex" style={{ fontSize: 8, color: 'var(--ink-faint)' }}>VER</div>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: size * 0.42,
          color: 'var(--gold-pale)',
          fontWeight: 600,
        }}>{version}</div>
      </div>
    </div>
  );
}
