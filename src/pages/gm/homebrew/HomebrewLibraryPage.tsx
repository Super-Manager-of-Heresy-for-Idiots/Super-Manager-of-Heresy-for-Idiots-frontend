import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoDivider,
  OrdoField,
  EmptyVault,
} from '@/components/ordo';
import { VersionSeal } from '@/components/homebrew/VersionSeal';
import { RatingControl } from '@/components/homebrew/RatingControl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useHomebrewLibrary, useAttachHomebrew, useRateHomebrew } from '@/hooks/useHomebrewCampaign';
import { useCampaigns } from '@/hooks/useCampaigns';
import type { CampaignResponse } from '@/types';

/* ── types for library entries ────────────────────────────────── */

interface LibraryEntry {
  id: string;
  packageId: string;
  title: string;
  authorUsername: string;
  version: number;
  rating?: { net: number; total: number; myRating?: 1 | -1 };
  isAttached?: boolean;
  activatedAt?: string;
}

/* ── page ────────────────────────────────────────────────────── */

export default function HomebrewLibraryPage() {
  const { data: library, isLoading, error, refetch } = useHomebrewLibrary();
  const { data: campaigns } = useCampaigns();
  const attachMutation = useAttachHomebrew();
  const rateMutation = useRateHomebrew();

  const [attachOpen, setAttachOpen] = useState(false);
  const [attachPackageId, setAttachPackageId] = useState('');
  const [attachCampaignId, setAttachCampaignId] = useState('');
  const [attachPinnedVersion, setAttachPinnedVersion] = useState('');

  const libraryEntries: LibraryEntry[] = (library ?? []).map((entry) => ({
    id: entry.id,
    packageId: entry.id,
    title: entry.title,
    authorUsername: entry.authorUsername,
    version: entry.version,
  }));
  const campaignList: CampaignResponse[] = campaigns ?? [];

  const handleAttach = () => {
    if (!attachCampaignId || !attachPackageId) return;
    attachMutation.mutate(
      {
        campaignId: attachCampaignId,
        data: {
          homebrewPackageId: attachPackageId,
          pinnedVersion: attachPinnedVersion ? Number(attachPinnedVersion) : undefined,
        },
      },
      {
        onSuccess: () => {
          setAttachOpen(false);
          setAttachPackageId('');
          setAttachCampaignId('');
          setAttachPinnedVersion('');
        },
      },
    );
  };

  const openAttach = (packageId: string) => {
    setAttachPackageId(packageId);
    setAttachCampaignId('');
    setAttachPinnedVersion('');
    setAttachOpen(true);
  };

  const handleRate = (packageId: string, rating: 1 | -1) => {
    rateMutation.mutate({ packageId, data: { rating } });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Doctrine Archive</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>My Homebrew Library</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          {[0, 1].map((i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 300 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '50%', height: 16, marginBottom: 16 }} />
              <div className="ao-ph" style={{ width: '80%', height: 14, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '60%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The doctrine archive could not be consulted. Its bindings remain sealed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Doctrine Archive</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>My Homebrew Library</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
          Doctrines acquired from the marketplace. Attach them to campaigns to activate their content.
        </p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* Library List */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="LIBRARY" glyph="scroll" tone="gold" sub={`${libraryEntries.length} doctrines`} />

          {libraryEntries.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center' }}>
              <EmptyVault
                glyph="scroll"
                title="Library Empty"
                body="Browse the marketplace to acquire doctrines for your library."
              />
            </div>
          ) : (
            <div>
              {libraryEntries.map((entry: LibraryEntry, idx: number) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '16px 18px',
                    borderBottom: idx < libraryEntries.length - 1 ? '1px solid var(--hairline)' : 'none',
                  }}
                >
                  <VersionSeal version={entry.version} size={40} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, color: 'var(--ink-bright)', fontWeight: 500 }}>
                        {entry.title}
                      </span>
                      {entry.isAttached && (
                        <span
                          style={{
                            fontSize: 9,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            padding: '2px 7px',
                            background: 'rgba(122,152,102,0.15)',
                            color: '#7a9866',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          ATTACHED
                        </span>
                      )}
                    </div>

                    <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>
                      by {entry.authorUsername} &middot; v{entry.version}
                    </div>

                    {/* Rating */}
                    {entry.rating && (
                      <div style={{ marginTop: 8 }}>
                        <RatingControl
                          likes={Math.max(0, Math.ceil((entry.rating.total + entry.rating.net) / 2))}
                          dislikes={Math.max(0, Math.ceil((entry.rating.total - entry.rating.net) / 2))}
                          mine={entry.rating.myRating === 1 ? 'like' : entry.rating.myRating === -1 ? 'dislike' : undefined}
                          size="sm"
                          onRate={(r) => handleRate(entry.packageId, r)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Attach button */}
                  <button
                    className="ao-btn ao-btn--ghost ao-btn--sm"
                    onClick={() => openAttach(entry.packageId)}
                    title="Attach to campaign"
                  >
                    <Rune kind="plus" size={12} color="var(--arcane)" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </OrdoPanel>

        {/* Attach Panel */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="ATTACH TO CAMPAIGN" glyph="sigil-1" tone="arcane" sub="Activate a doctrine" />

          <div style={{ padding: 18 }}>
            <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginBottom: 16 }}>
              Select a doctrine from the library and attach it to a campaign. The doctrine's content will become available to characters in that campaign.
            </p>

            <OrdoField label="Campaign" hint="Target campaign">
              <select
                className="ao-input"
                value={attachCampaignId}
                onChange={(e) => setAttachCampaignId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Select campaign --</option>
                {campaignList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </OrdoField>

            <div style={{ marginTop: 12 }}>
              <OrdoField label="Package" hint="Doctrine to attach">
                <select
                  className="ao-input"
                  value={attachPackageId}
                  onChange={(e) => setAttachPackageId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select doctrine --</option>
                  {libraryEntries.map((entry) => (
                    <option key={entry.id} value={entry.packageId}>
                      {entry.title} (v{entry.version})
                    </option>
                  ))}
                </select>
              </OrdoField>
            </div>

            <div style={{ marginTop: 12 }}>
              <OrdoField label="Pinned Version" hint="Leave empty for latest">
                <input
                  className="ao-input"
                  type="number"
                  min="1"
                  value={attachPinnedVersion}
                  onChange={(e) => setAttachPinnedVersion(e.target.value)}
                  placeholder="Latest"
                />
              </OrdoField>
            </div>

            <OrdoDivider glyph="diamond" />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                className="ao-btn ao-btn--primary"
                onClick={handleAttach}
                disabled={!attachCampaignId || !attachPackageId || attachMutation.isPending}
              >
                {attachMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Rune kind="sigil-1" size={14} color="currentColor" />
                    <span style={{ marginLeft: 6 }}>Attach</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </OrdoPanel>
      </div>

      {/* Attach Dialog (opened from library list) */}
      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach Doctrine to Campaign</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Campaign" required>
              <select
                className="ao-input"
                value={attachCampaignId}
                onChange={(e) => setAttachCampaignId(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Select campaign --</option>
                {campaignList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </OrdoField>

            <OrdoField label="Pinned Version" hint="Leave empty for latest">
              <input
                className="ao-input"
                type="number"
                min="1"
                value={attachPinnedVersion}
                onChange={(e) => setAttachPinnedVersion(e.target.value)}
                placeholder="Latest"
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setAttachOpen(false)} disabled={attachMutation.isPending}>
              Withhold
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleAttach}
              disabled={!attachCampaignId || attachMutation.isPending}
            >
              {attachMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Attach
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
