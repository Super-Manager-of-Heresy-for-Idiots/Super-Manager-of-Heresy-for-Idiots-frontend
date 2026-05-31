import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, EmptyVault } from '@/components/ordo';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCampaignQuests, useCreateQuest } from '@/hooks/useQuests';
import type { QuestResponse, QuestStatus } from '@/types';

/* ── constants ───────────────────────────────────────────────── */

const QUEST_STATUSES: QuestStatus[] = ['ACTIVE', 'COMPLETED', 'FAILED', 'HIDDEN', 'ARCHIVED'];

/* ── page ────────────────────────────────────────────────────── */

export default function QuestManagerPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: quests, isLoading, error, refetch } = useCampaignQuests(campaignId!);
  const createMutation = useCreateQuest();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formGmDescription, setFormGmDescription] = useState('');
  const [formStatus, setFormStatus] = useState<QuestStatus>('ACTIVE');
  const [formVisible, setFormVisible] = useState(true);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormGmDescription('');
    setFormStatus('ACTIVE');
    setFormVisible(true);
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        campaignId: campaignId!,
        data: {
          name: formName,
          description: formDescription || undefined,
          gmDescription: formGmDescription || undefined,
          status: formStatus,
          visible: formVisible,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>The Chronicle</p>
            <h3 className="ao-h3" style={{ marginTop: 4 }}>Quests</h3>
          </div>
        </div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
          <span className="ao-frame-c" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div className="ao-ph" style={{ width: '40%', height: 14 }} />
              <div className="ao-ph" style={{ width: '15%', height: 14 }} />
              <div className="ao-ph" style={{ width: '10%', height: 14 }} />
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
          The quest ledger could not be opened. Its seals remain intact.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── sort: archived at the bottom ────────────────────────── */

  const sorted = [...(quests || [])].sort((a, b) => {
    if (a.status === 'ARCHIVED' && b.status !== 'ARCHIVED') return 1;
    if (a.status !== 'ARCHIVED' && b.status === 'ARCHIVED') return -1;
    return 0;
  });

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>The Chronicle</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Quests</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            Deeds recorded and fates yet unwritten, bound by the Game-Master's decree.
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>New Quest</span>
        </button>
      </div>

      {/* Quest table */}
      {sorted.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title="No Quests Recorded"
          body="The chronicle lies blank. Create your first quest to set the tale in motion."
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>New Quest</span>
            </button>
          }
        />
      ) : (
        <OrdoPanel frame padding={0}>
          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 120px 80px',
              gap: 12,
              padding: '10px 18px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Quest</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Status</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>Visibility</span>
            <span />
          </div>

          {/* Rows */}
          {sorted.map((quest: QuestResponse) => {
            const isArchived = quest.status === 'ARCHIVED';
            return (
              <div
                key={quest.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 120px 80px',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--hairline)',
                  alignItems: 'center',
                  opacity: isArchived ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {/* Quest name + subtitle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Rune kind="scroll" size={16} color="var(--brass)" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--ink-bright)', fontWeight: 500 }}>
                      {quest.name}
                    </div>
                    {quest.description && (
                      <div
                        className="ao-italic"
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-faint)',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {quest.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <QuestStatusBadge status={quest.status} />
                </div>

                {/* Visibility */}
                <div>
                  <VisibilityToggle
                    visible={quest.isVisibleToPlayers ?? quest.visible ?? false}
                    onToggle={() => {/* handled in detail page */}}
                  />
                </div>

                {/* Open button */}
                <div>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => navigate(`/gm/campaigns/${campaignId}/quests/${quest.id}`)}
                  >
                    Open
                  </button>
                </div>
              </div>
            );
          })}
        </OrdoPanel>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record New Quest</DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <OrdoField label="Name" required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Name of the quest"
              />
            </OrdoField>

            <OrdoField label="Description" hint="Visible to players">
              <textarea
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What the players know..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <OrdoField label="GM Description" hint="GM eyes only">
              <textarea
                className="ao-input"
                value={formGmDescription}
                onChange={(e) => setFormGmDescription(e.target.value)}
                placeholder="Secret objectives, hidden twists..."
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </OrdoField>

            <OrdoField label="Status">
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as QuestStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {QUEST_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className="ao-label" style={{ marginBottom: 0 }}>Visible to players</span>
            </label>
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
              Record
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
