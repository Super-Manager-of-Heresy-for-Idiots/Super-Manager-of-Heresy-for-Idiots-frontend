import { OrdoPanel, PanelHeader, Rune, OrdoDivider, Bar } from '@/components/ordo';
import { useUpdateResource } from '@/hooks/useCharacterV2';
import type { ResourceEntry } from '@/types';

interface ResourcesPanelProps {
  characterId: string;
  resources: ResourceEntry[];
  onAddResource?: () => void;
}

export function ResourcesPanel({
  characterId,
  resources,
  onAddResource,
}: ResourcesPanelProps) {
  const updateResource = useUpdateResource();

  function handleChange(resourceTypeId: string, currentValue: number, delta: number) {
    const newValue = Math.max(0, currentValue + delta);
    updateResource.mutate({
      id: characterId,
      resourceTypeId,
      data: { value: newValue },
    });
  }

  return (
    <OrdoPanel frame>
      <PanelHeader
        title="Reserves & Founts"
        glyph="hex"
        tone="arcane"
        right={
          onAddResource ? (
            <button
              onClick={onAddResource}
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
              Add
            </button>
          ) : undefined
        }
      />

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {resources.map((res, idx) => {
          const hasMax = res.maxValue != null && res.maxValue > 0;
          return (
            <div key={res.resourceTypeId}>
              <div style={{ padding: '10px 0' }}>
                {/* Name row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: 'var(--font-display)',
                        color: 'var(--ink-bright)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {res.name}
                    </span>
                  </div>

                  {/* +/- buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() =>
                        handleChange(res.resourceTypeId, res.currentValue, -1)
                      }
                      disabled={updateResource.isPending || res.currentValue <= 0}
                      style={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--abyss)',
                        border: '1px solid var(--rule)',
                        cursor: 'pointer',
                        opacity:
                          updateResource.isPending || res.currentValue <= 0 ? 0.4 : 1,
                      }}
                      aria-label={`Decrease ${res.name}`}
                    >
                      <Rune kind="minus" size={9} color="var(--ink-quiet)" />
                    </button>

                    <span
                      style={{
                        minWidth: 32,
                        textAlign: 'center',
                        fontSize: 14,
                        fontFamily: 'var(--font-mono, monospace)',
                        color: 'var(--ink-bright)',
                      }}
                    >
                      {res.currentValue}
                    </span>

                    <button
                      onClick={() =>
                        handleChange(res.resourceTypeId, res.currentValue, 1)
                      }
                      disabled={
                        updateResource.isPending ||
                        (hasMax && res.currentValue >= res.maxValue!)
                      }
                      style={{
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--abyss)',
                        border: '1px solid var(--rule)',
                        cursor: 'pointer',
                        opacity:
                          updateResource.isPending ||
                          (hasMax && res.currentValue >= res.maxValue!)
                            ? 0.4
                            : 1,
                      }}
                      aria-label={`Increase ${res.name}`}
                    >
                      <Rune kind="plus" size={9} color="var(--ink-quiet)" />
                    </button>
                  </div>
                </div>

                {/* Bar */}
                {hasMax && (
                  <Bar
                    value={res.currentValue}
                    max={res.maxValue!}
                    tone="arcane"
                    height={6}
                    showNumbers
                  />
                )}

                {!hasMax && (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--ink-faint)',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    {res.currentValue} (no max)
                  </div>
                )}
              </div>

              {idx < resources.length - 1 && (
                <OrdoDivider glyph="hex" color="var(--rule)" />
              )}
            </div>
          );
        })}

        {resources.length === 0 && (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--ink-faint)',
              fontSize: 12,
              fontStyle: 'italic',
            }}
          >
            No resources tracked
          </div>
        )}
      </div>
    </OrdoPanel>
  );
}
