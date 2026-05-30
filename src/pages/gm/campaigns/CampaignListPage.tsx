import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoField, EmptyVault } from '@/components/ordo';
import { CampaignStatusPill } from '@/components/campaigns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCampaigns, useCreateCampaign, useDeleteCampaign } from '@/hooks/useCampaigns';
import type { CampaignResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignListPage() {
  const navigate = useNavigate();
  const { data: campaigns, isLoading, error, refetch } = useCampaigns();
  const createMutation = useCreateCampaign();
  const deleteMutation = useDeleteCampaign();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
  };

  const handleCreate = () => {
    createMutation.mutate(
      { name: formName, description: formDescription || undefined },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const activeCampaigns = campaigns?.filter((c: CampaignResponse) => c.status === 'ACTIVE') ?? [];
  const totalMembers = campaigns?.reduce(
    (sum: number, c: CampaignResponse) => sum + (c.members?.length || 0),
    0,
  ) ?? 0;

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The campaign ledger could not be consulted. Its seals remain intact.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>
          Sworn Orders
        </p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Campaigns</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
          Chronicles of battle and fate, forged by the Game-Master's hand.
        </p>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 48, margin: '24px 0' }}>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--gold)' }}>
            {isLoading ? '\u2014' : (campaigns?.length || 0)}
          </span>
          <span className="ao-stat-label">Total</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: '#7a9866' }}>
            {isLoading ? '\u2014' : activeCampaigns.length}
          </span>
          <span className="ao-stat-label">Active</span>
        </div>
        <div className="ao-stat" style={{ textAlign: 'center' }}>
          <span className="ao-stat-value" style={{ color: 'var(--arcane)' }}>
            {isLoading ? '\u2014' : totalMembers}
          </span>
          <span className="ao-stat-label">Total Members</span>
        </div>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '20px 0' }}>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>Forge New Campaign</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 180 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '60%', height: 20, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '40%', height: 14 }} />
            </div>
          ))}
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyVault
          glyph="shield"
          title="No Campaigns Yet"
          body="Forge thy first campaign and summon thy sworn to battle."
          action={
            <button
              className="ao-btn ao-btn--primary ao-btn--lg"
              onClick={() => { resetForm(); setDialogOpen(true); }}
            >
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>Forge Thy First Campaign</span>
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {campaigns.map((campaign: CampaignResponse) => (
            <OrdoPanel key={campaign.id} frame padding={0}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <Sigil size={44} glyph="shield" color="var(--gold)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 className="ao-h4" style={{ margin: 0 }}>{campaign.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <CampaignStatusPill status={campaign.status} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14 }}>
                  <Rune kind="helm" size={14} color="var(--ink-quiet)" />
                  <span className="ao-codex" style={{ color: 'var(--ink-quiet)' }}>
                    {campaign.members?.length || 0} {(campaign.members?.length || 0) === 1 ? 'member' : 'members'}
                  </span>
                </div>

                {campaign.description && (
                  <p
                    className="ao-italic"
                    style={{
                      fontSize: 12,
                      color: 'var(--ink-faint)',
                      marginTop: 8,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {campaign.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex',
                gap: 6,
                padding: '12px 20px',
                borderTop: '1px solid var(--rule)',
                background: 'var(--abyss)',
              }}>
                <button
                  className="ao-btn ao-btn--primary ao-btn--sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/gm/campaigns/${campaign.id}`)}
                >
                  <Rune kind="eye" size={12} color="currentColor" />
                  <span style={{ marginLeft: 4 }}>View</span>
                </button>
                <button
                  className="ao-btn ao-btn--danger ao-btn--sm"
                  onClick={() => setDeleteId(campaign.id)}
                  title="Delete campaign"
                >
                  <Rune kind="x" size={14} color="currentColor" />
                </button>
              </div>
            </OrdoPanel>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forge New Campaign</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Name of the campaign"
              />
            </OrdoField>

            <OrdoField label="Description">
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the campaign..."
                rows={3}
                style={{ resize: 'vertical' }}
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
              Forge
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmake this Campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This rite cannot be undone. The campaign and all its records shall be stricken from the chronicle for all eternity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unmake
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
