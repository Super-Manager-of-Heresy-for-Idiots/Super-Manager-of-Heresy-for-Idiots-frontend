import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './CampaignInvitePage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignInvitePage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
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
        <div className={s.head}>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp.invite.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp.invite.title')}</h3>
        </div>
        <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
          <span className="ao-frame-c" />
          <div className={cn('ao-ph', s.phCode)} />
          <div className={cn('ao-ph', s.phLabel)} />
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div className={s.errorBlock}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('camp.invite.loadError')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <p className={cn('ao-overline', s.overlineGold)}>{t('camp.invite.overline')}</p>
        <h3 className={cn('ao-h3', s.title)}>{t('camp.invite.title')}</h3>
        <p className={cn('ao-italic', s.sub)}>
          {t('camp.invite.sub')}
        </p>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader title={t('camp.invite.sigilTitle')} glyph="cross-pat" tone="arcane" sub={t('camp.invite.sigilSub')} />

        <div className={s.body}>
          {/* Code display box */}
          <div className={s.codeBox}>
            <div className={s.codeText}>
              {String(inviteCode)}
            </div>
          </div>

          <OrdoDivider glyph="diamond" />

          {/* Actions */}
          <div className={s.actions}>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleCopy}
            >
              <Rune kind={copied ? 'check' : 'scroll'} size={14} color="currentColor" />
              <span className={s.ml6}>{copied ? t('camp.invite.copied') : t('camp.invite.copy')}</span>
            </button>

            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setRegenOpen(true)}
            >
              <Rune kind="cross-pat" size={14} color="var(--arcane)" />
              <span className={s.ml6}>{t('camp.invite.regenerate')}</span>
            </button>
          </div>

          {/* Info box */}
          <div className={s.infoBox}>
            <Rune kind="eye" size={14} color="var(--gold)" />
            <div className={s.infoMain}>
              <div className={s.infoTitle}>
                {t('camp.invite.advisory')}
              </div>
              <div className={cn('ao-italic', s.infoBody)}>
                {t('camp.invite.advisoryBody')}
              </div>
            </div>
          </div>
        </div>
      </OrdoPanel>

      {/* Regenerate Confirmation */}
      <AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.invite.reforge.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp.invite.reforge.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('camp.list.withhold')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>
              {regenerateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp.invite.reforge')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
