import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, OrdoDivider, EmptyVault } from '@/components/ordo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCampaignStorage, useCreateStorageContainer } from '@/hooks/useCampaigns';
import type { StorageContainerResponse, StorageItemResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function SharedStoragePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: containers, isLoading, error, refetch } = useCampaignStorage(id!);
  const createMutation = useCreateStorageContainer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (containerId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(containerId)) next.delete(containerId);
      else next.add(containerId);
      return next;
    });
  };

  const handleCreate = () => {
    if (!id || !formName) return;
    createMutation.mutate(
      { campaignId: id, data: { name: formName } },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setFormName('');
        },
      },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Shared Vaults</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Storage</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 100 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '40%', height: 16, marginBottom: 10 }} />
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
          The vault could not be opened. Its locks remain unyielding.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const storageList: StorageContainerResponse[] = containers ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Back button */}
      <button
        className="ao-btn ao-btn--ghost ao-btn--sm"
        onClick={() => navigate(`/gm/campaigns/${id}`)}
        style={{ marginBottom: 16 }}
      >
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span style={{ marginLeft: 4 }}>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Shared Vaults</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Storage</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            Communal coffers and armouries shared among the sworn.
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { setFormName(''); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>New Container</span>
        </button>
      </div>

      {/* Container List */}
      {storageList.length === 0 ? (
        <EmptyVault
          glyph="sword"
          title="No Storage Containers"
          body="The vaults lie empty. Create a container to begin storing communal items."
          action={
            <button
              className="ao-btn ao-btn--primary"
              onClick={() => { setFormName(''); setDialogOpen(true); }}
            >
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>New Container</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {storageList.map((container: StorageContainerResponse) => {
            const isExpanded = expandedIds.has(container.id);
            const items: StorageItemResponse[] = container.items ?? [];

            return (
              <OrdoPanel key={container.id} frame padding={0}>
                {/* Container header */}
                <button
                  onClick={() => toggleExpanded(container.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '14px 18px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    border: '1px solid var(--rule)',
                    background: 'var(--abyss)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Rune kind="sword" size={16} color="var(--brass)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--ink-bright)', fontWeight: 500 }}>
                      {container.name}
                    </div>
                    <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                  <Rune
                    kind={isExpanded ? 'chev-d' : 'chev-r'}
                    size={14}
                    color="var(--ink-faint)"
                  />
                </button>

                {/* Expanded items */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--hairline)' }}>
                    {items.length === 0 ? (
                      <div style={{ padding: '16px 18px', textAlign: 'center' }}>
                        <p className="ao-italic" style={{ color: 'var(--ink-ghost)', fontSize: 13 }}>
                          This container is empty.
                        </p>
                      </div>
                    ) : (
                      items.map((item: StorageItemResponse) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 18px 10px 66px',
                            borderBottom: '1px solid var(--hairline)',
                          }}
                        >
                          <Rune kind="diamond" size={8} color="var(--brass)" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, color: 'var(--ink-bright)' }}>
                              {item.name}
                            </span>
                            {item.rarity && (
                              <span className="ao-overline" style={{ fontSize: 8, marginLeft: 8, color: 'var(--ink-faint)' }}>
                                {item.rarity}
                              </span>
                            )}
                          </div>
                          <span className="ao-codex" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
                            x{item.quantity}
                          </span>
                          {item.isUnique && (
                            <span className="ao-overline" style={{ fontSize: 8, color: 'var(--gold)' }}>
                              UNIQUE
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </OrdoPanel>
            );
          })}
        </div>
      )}

      {/* Create Container Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Storage Container</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Party Chest, War Coffers, Alchemy Stores"
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Withhold
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleCreate}
              disabled={!formName || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
