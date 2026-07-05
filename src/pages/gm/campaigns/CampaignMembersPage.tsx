import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoInterfaceIcon, OrdoPanel, PanelHeader, Rune, OrdoChip, EmptyVault } from '@/components/ordo';
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
import { useCampaign, useKickMember } from '@/hooks/useCampaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { CampaignMember } from '@/types';
import s from './CampaignMembersPage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignMembersPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId!);
  const kickMutation = useKickMember();

  const [kickUserId, setKickUserId] = useState<string | null>(null);

  const handleKick = () => {
    if (!kickUserId || !campaignId) return;
    kickMutation.mutate(
      { campaignId, userId: kickUserId },
      { onSuccess: () => setKickUserId(null) },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div className={s.skelHead}>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp.members.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp.members.title')}</h3>
        </div>
        <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
          <span className="ao-frame-c" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={s.skelRow}>
              <div className={cn('ao-ph', s.phW30)} />
              <div className={cn('ao-ph', s.phW15)} />
              <div className={cn('ao-ph', s.phW20)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !campaign) {
    return (
      <div className={s.errorBlock}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('camp.members.loadError')}
        </p>
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
        )}
      </div>
    );
  }

  const members: CampaignMember[] = campaign.members ?? [];

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <div>
          <p className={cn('ao-overline', s.overlineGold)}>{t('camp.members.overline')}</p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp.members.title')}</h3>
          <p className={cn('ao-italic', s.sub)}>
            {members.length} {members.length === 1 ? t('camp.members.soulOne') : t('camp.members.soulMany')} {t('camp.members.swornSuffix')}
          </p>
        </div>
      </div>

      {/* Member List */}
      {members.length === 0 ? (
        <EmptyVault
          glyph="helm"
          icon="character-in-campaign"
          title={t('camp.members.empty.title')}
          body={t('camp.members.empty.body')}
        />
      ) : (
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp.members.swornMembers')}
            glyph="helm"
            icon="character-in-campaign"
            sub={`${members.length} ${t('camp.members.totalSuffix')}`}
          />

          {/* Column headers */}
          <div className={cn('ao-rgrid', s.memberGrid, s.colHead)}>
            <span className={cn('ao-overline', s.colLabel)}>{t('camp.members.col.username')}</span>
            <span className={cn('ao-overline', s.colLabel)}>{t('camp.members.col.role')}</span>
            <span className={cn('ao-overline', s.colLabel)}>{t('camp.members.col.joined')}</span>
            <span />
          </div>

          {/* Rows */}
          {members.map((member: CampaignMember) => (
            <div key={member.userId} className={cn('ao-rgrid', s.memberGrid, s.memberRow)}>
              {/* Username */}
              <div className={s.nameCell}>
                <OrdoInterfaceIcon icon="user" size={14} style={{ color: 'var(--brass)' }} />
                <span className={s.nameText}>
                  {member.username}
                </span>
                {member.isCreator && (
                  <span className={cn('ao-overline', s.creatorTag)}>
                    {t('camp.members.creator')}
                  </span>
                )}
              </div>

              {/* Role */}
              <div>
                <OrdoChip
                  tone={member.roleInCampaign === 'GM' ? 'arcane' : 'gold'}
                  icon={member.roleInCampaign === 'GM' ? 'role-game-master' : 'role-player'}
                >
                  {t(`role.${member.roleInCampaign}`)}
                </OrdoChip>
              </div>

              {/* Joined date */}
              <div>
                <span className={cn('ao-codex', s.joinedText)}>
                  {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Kick button */}
              <div>
                {campaign.isCreator && !member.isCreator && (
                  <button
                    className="ao-btn ao-btn--danger ao-btn--sm"
                    onClick={() => setKickUserId(member.userId)}
                    title={t('camp.members.exileMember')}
                  >
                    <Rune kind="x" size={10} color="currentColor" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </OrdoPanel>
      )}

      {/* Kick Confirmation */}
      <AlertDialog open={!!kickUserId} onOpenChange={() => setKickUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.members.exile.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp.members.exile.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('camp.list.withhold')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKick}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {kickMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp.members.exile')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
