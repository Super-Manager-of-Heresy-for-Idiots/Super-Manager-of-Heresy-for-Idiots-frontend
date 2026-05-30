import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { VersionSeal } from '@/components/homebrew/VersionSeal';
import { useHomebrewVersions, usePinHomebrewVersion } from '@/hooks/useHomebrewV2';
import { formatDate } from '@/lib/utils';

type PinMode = 'latest' | 'pinned';

export default function VersionManagerPage() {
  const { packageId = '' } = useParams<{ packageId: string }>();
  const { data: versions, isLoading } = useHomebrewVersions(packageId);
  const pinMutation = usePinHomebrewVersion();

  const [pinMode, setPinMode] = useState<PinMode>('latest');
  const [pinnedVersion, setPinnedVersion] = useState<number | null>(null);

  const versionList = versions ?? [];
  const latestVersion = versionList.length > 0 ? versionList[0].version : 1;

  const handleSavePin = () => {
    // In a real flow, campaignId and activationId would come from context or params.
    // For now we just trigger the mutation with the selected data.
    const pinValue = pinMode === 'latest' ? null : pinnedVersion;
    pinMutation.mutate({
      campaignId: '', // to be filled by parent context
      activationId: '', // to be filled by parent context
      data: { pinnedVersion: pinValue },
    });
  };

  return (
    <div>
      {/* Heading band */}
      <div style={{ marginBottom: 18 }}>
        <div className="ao-overline">Doctrine Chronology &middot; Immutable Record</div>
        <div className="ao-h3" style={{ marginTop: 4 }}>Version Manager</div>
        <div className="ao-italic" style={{ marginTop: 4, maxWidth: 620 }}>
          Each sealed version is an immutable snapshot. Pin to a specific version or follow the latest automatically.
        </div>
      </div>

      {/* Grid: pin selector + history */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 18, alignItems: 'start' }}>
        {/* ── Pin Selector ── */}
        <OrdoPanel padding={0} frame>
          <PanelHeader title="Version Pin" sub="select tracking mode" glyph="lock" />

          <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Always Latest radio */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                border: `1px solid ${pinMode === 'latest' ? 'var(--brass)' : 'var(--rule)'}`,
                background: pinMode === 'latest' ? 'rgba(176,141,78,0.06)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="pinMode"
                checked={pinMode === 'latest'}
                onChange={() => setPinMode('latest')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink-bright)' }}>
                  Always Latest
                </div>
                <div className="ao-italic" style={{ fontSize: 12, marginTop: 4, color: 'var(--ink-quiet)' }}>
                  Automatically track the newest sealed version. Campaign content updates when the author publishes.
                </div>
              </div>
            </label>

            {/* Pin to specific version radio */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                border: `1px solid ${pinMode === 'pinned' ? 'var(--brass)' : 'var(--rule)'}`,
                background: pinMode === 'pinned' ? 'rgba(176,141,78,0.06)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="pinMode"
                checked={pinMode === 'pinned'}
                onChange={() => setPinMode('pinned')}
                style={{ marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--ink-bright)' }}>
                  Pin Version
                </div>
                <div className="ao-italic" style={{ fontSize: 12, marginTop: 4, color: 'var(--ink-quiet)' }}>
                  Lock to a specific version. No automatic updates until you change the pin.
                </div>
                {pinMode === 'pinned' && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ao-label" style={{ marginBottom: 0, fontSize: 11 }}>Version:</span>
                    <select
                      className="ao-input"
                      value={pinnedVersion ?? ''}
                      onChange={(e) => setPinnedVersion(Number(e.target.value))}
                      style={{ width: 100, padding: '4px 8px', fontSize: 13 }}
                    >
                      <option value="" disabled>Select</option>
                      {versionList.map((v) => (
                        <option key={v.version} value={v.version}>v{v.version}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </label>

            {/* Warning info box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: 12,
                background: 'rgba(176,141,78,0.06)',
                border: '1px solid rgba(176,141,78,0.20)',
                borderLeft: '3px solid var(--gold)',
              }}
            >
              <Rune kind="eye" size={14} color="var(--gold)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--gold-pale)', fontFamily: 'var(--font-display)' }}>
                  Pinning Advisory
                </div>
                <div className="ao-italic" style={{ fontSize: 11, marginTop: 3, color: 'var(--ink-quiet)' }}>
                  Pinned doctrines will not receive balance patches or new content until the pin is updated or removed.
                </div>
              </div>
            </div>

            <OrdoDivider glyph="diamond" />

            {/* Save Pin button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="ao-btn ao-btn--primary"
                onClick={handleSavePin}
                disabled={pinMutation.isPending || (pinMode === 'pinned' && pinnedVersion === null)}
              >
                <Rune kind="lock" size={11} />
                {pinMutation.isPending ? 'Saving...' : 'Save Pin'}
              </button>
            </div>
          </div>
        </OrdoPanel>

        {/* ── Version History ── */}
        <OrdoPanel padding={0} frame>
          <PanelHeader title="Version History" sub="sealed chronology" glyph="scroll" />

          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="ao-codex" style={{ color: 'var(--ink-faint)' }}>Loading versions...</div>
            </div>
          ) : versionList.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Rune kind="scroll" size={40} color="var(--ink-quiet)" />
              <div className="ao-codex" style={{ marginTop: 12, color: 'var(--ink-faint)' }}>
                No versions sealed yet
              </div>
            </div>
          ) : (
            <div>
              {versionList.map((v, idx) => {
                const isLatest = idx === 0;

                return (
                  <div
                    key={v.version}
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '16px 18px',
                      borderBottom: idx < versionList.length - 1 ? '1px solid var(--hairline)' : 'none',
                      background: isLatest ? 'rgba(176,141,78,0.04)' : 'transparent',
                    }}
                  >
                    <VersionSeal version={v.version} size={44} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 14,
                            color: 'var(--ink-bright)',
                            letterSpacing: '0.03em',
                          }}
                        >
                          Version {v.version}
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              fontSize: 9,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              background: 'rgba(176,141,78,0.15)',
                              color: 'var(--gold-pale)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            LATEST
                          </span>
                        )}
                      </div>

                      <div
                        className="ao-codex"
                        style={{ fontSize: 11, marginTop: 4, color: 'var(--ink-faint)' }}
                      >
                        Sealed {formatDate(v.createdAt)}
                      </div>

                      {/* Changes list */}
                      {v.changes && v.changes.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {v.changes.map((change, ci) => {
                            const isAddition = change.startsWith('+');
                            const isModification = change.startsWith('~');
                            const color = isAddition
                              ? '#8fbc8f'
                              : isModification
                                ? 'var(--gold-pale)'
                                : 'var(--ink)';
                            const prefix = isAddition ? '+' : isModification ? '~' : '';
                            const text = isAddition || isModification ? change.slice(1).trim() : change;

                            return (
                              <div
                                key={ci}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 8,
                                  fontSize: 12,
                                }}
                              >
                                <span
                                  style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 12,
                                    color,
                                    fontWeight: 600,
                                    width: 12,
                                    textAlign: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {prefix}
                                </span>
                                <span style={{ color: 'var(--ink)', lineHeight: 1.4 }}>{text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div
                style={{
                  textAlign: 'center',
                  padding: '10px 0',
                  borderTop: '1px solid var(--hairline)',
                  background: 'var(--abyss)',
                }}
              >
                <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {versionList.length} version{versionList.length !== 1 ? 's' : ''} &middot; immutable record
                </span>
              </div>
            </div>
          )}
        </OrdoPanel>
      </div>
    </div>
  );
}
