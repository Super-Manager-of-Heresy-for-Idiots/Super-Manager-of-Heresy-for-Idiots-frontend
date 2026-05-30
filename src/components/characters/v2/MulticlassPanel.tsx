import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';

interface ClassLevel {
  classId: string;
  className: string;
  classLevel: number;
  subclassName?: string;
}

interface MulticlassPanelProps {
  classLevels: ClassLevel[];
  onAddClass?: () => void;
}

const CLASS_GLYPHS: Record<string, string> = {
  default: 'shield',
};

function getGlyph(className: string): string {
  const key = className.toLowerCase();
  return CLASS_GLYPHS[key] ?? CLASS_GLYPHS.default;
}

export function MulticlassPanel({ classLevels, onAddClass }: MulticlassPanelProps) {
  const totalLevel = classLevels.reduce((sum, cl) => sum + cl.classLevel, 0);

  return (
    <OrdoPanel frame>
      <PanelHeader
        title="Classes & Oaths"
        glyph="shield"
        right={
          onAddClass ? (
            <button
              onClick={onAddClass}
              style={{
                background: 'none',
                border: '1px solid var(--rule)',
                color: 'var(--ink-quiet)',
                padding: '4px 12px',
                fontSize: 11,
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Rune kind="plus" size={10} color="var(--ink-quiet)" />
              Add Class
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {classLevels.map((cl, idx) => (
          <div key={cl.classId}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 0',
              }}
            >
              {/* Icon box */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '1px solid var(--rule)',
                  background: 'var(--abyss)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Rune kind={getGlyph(cl.className)} size={18} color="var(--gold)" />
              </div>

              {/* Class info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontFamily: 'var(--font-display)',
                    color: 'var(--ink-bright)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {cl.className}
                </div>
                {cl.subclassName && (
                  <div
                    style={{
                      fontSize: 12,
                      fontStyle: 'italic',
                      color: 'var(--ink-quiet)',
                      marginTop: 2,
                    }}
                  >
                    {cl.subclassName}
                  </div>
                )}
              </div>

              {/* Level number */}
              <div
                style={{
                  fontSize: 28,
                  fontFamily: 'var(--font-display)',
                  color: 'var(--gold)',
                  lineHeight: 1,
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {cl.classLevel}
              </div>
            </div>

            {idx < classLevels.length - 1 && (
              <OrdoDivider glyph="diamond" color="var(--rule)" />
            )}
          </div>
        ))}
      </div>

      {/* Total level row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'linear-gradient(90deg, var(--gold)10, var(--gold)04)',
          borderTop: '1px solid var(--gold)22',
        }}
      >
        <span
          className="ao-overline"
          style={{ color: 'var(--gold)', letterSpacing: '0.18em' }}
        >
          Total Level
        </span>
        <span
          style={{
            fontSize: 24,
            fontFamily: 'var(--font-display)',
            color: 'var(--gold)',
            lineHeight: 1,
          }}
        >
          {totalLevel}
        </span>
      </div>
    </OrdoPanel>
  );
}
