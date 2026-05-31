import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
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
import { useCampaignInviteCode, useRegenerateCampaignInvite } from '@/hooks/useCampaigns';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignInvitePage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: inviteData, isLoading, error, refetch } = useCampaignInviteCode(campaignId!);
  const regenerateMutation = useRegenerateCampaignInvite();

  const [copied, setCopied] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);

  const inviteCode = inviteData?.inviteCode ?? inviteData ?? '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(inviteCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleRegenerate = () => {
    if (!campaignId) return;
    regenerateMutation.mutate(campaignId, {
      onSuccess: () => setRegenOpen(false),
    });
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Campaign Access</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Invite Code</h3>
        </div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 40, minHeight: 200, textAlign: 'center' }}>
          <span className="ao-frame-c" />
          <div className="ao-ph" style={{ width: '50%', height: 40, margin: '0 auto 16px' }} />
          <div className="ao-ph" style={{ width: '30%', height: 14, margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          The invite sigil could not be conjured. The wards remain sealed.
        </p>
        <button className="ao-btn" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Back button */}
      <button
        className="ao-btn ao-btn--ghost ao-btn--sm"
        onClick={() => navigate(`/campaigns/${campaignId}`)}
        style={{ marginBottom: 16 }}
      >
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span style={{ marginLeft: 4 }}>Back to Dashboard</span>
      </button>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Campaign Access</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Invite Code</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
          Share this cipher with those worthy of joining thy campaign.
        </p>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader title="INVITE SIGIL" glyph="cross-pat" tone="arcane" sub="Share to grant passage" />

        <div style={{ padding: '32px 24px', textAlign: 'center' }}>
          {/* Code display box */}
          <div
            style={{
              display: 'inline-block',
              padding: '20px 40px',
              background: 'var(--abyss)',
              border: '2px solid var(--brass)',
              marginBottom: 20,
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 32,
                letterSpacing: '0.12em',
                color: 'var(--gold-pale)',
                fontWeight: 600,
                userSelect: 'all',
              }}
            >
              {String(inviteCode)}
            </div>
          </div>

          <OrdoDivider glyph="diamond" />

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleCopy}
            >
              <Rune kind={copied ? 'check' : 'scroll'} size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setRegenOpen(true)}
            >
              <Rune kind="cross-pat" size={14} color="var(--arcane)" />
              <span style={{ marginLeft: 6 }}>Regenerate</span>
            </button>
          </div>

          {/* Info box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: 12,
              background: 'rgba(176,141,78,0.06)',
              border: '1px solid rgba(176,141,78,0.20)',
              borderLeft: '3px solid var(--gold)',
              marginTop: 24,
              textAlign: 'left',
            }}
          >
            <Rune kind="eye" size={14} color="var(--gold)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--gold-pale)', fontFamily: 'var(--font-display)' }}>
                Invite Advisory
              </div>
              <div className="ao-italic" style={{ fontSize: 11, marginTop: 3, color: 'var(--ink-quiet)' }}>
                Anyone with this code can join the campaign. Regenerating will void the current code and create a new one.
              </div>
            </div>
          </div>
        </div>
      </OrdoPanel>

      {/* Regenerate Confirmation */}
      <AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-forge Invite Sigil?</AlertDialogTitle>
            <AlertDialogDescription>
              The current invite sigil shall be voided. A new cipher shall be conjured in its place. Outstanding invitations using the old code will cease to function.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>
              {regenerateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Re-forge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
