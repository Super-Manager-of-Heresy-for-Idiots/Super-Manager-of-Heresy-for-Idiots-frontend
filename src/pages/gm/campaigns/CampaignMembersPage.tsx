import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoChip, EmptyVault } from '@/components/ordo';
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
import type { CampaignMember } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignMembersPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
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
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp.members.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp.members.title')}</h3>
        </div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
          <span className="ao-frame-c" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div className="ao-ph" style={{ width: '30%', height: 14 }} />
              <div className="ao-ph" style={{ width: '15%', height: 14 }} />
              <div className="ao-ph" style={{ width: '20%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error || !campaign) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          {t('camp.members.loadError')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('camp.retry')}</button>
      </div>
    );
  }

  const members: CampaignMember[] = campaign.members ?? [];

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
        <span style={{ marginLeft: 4 }}>{t('camp.backToDashboard')}</span>
      </button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp.members.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp.members.title')}</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            {members.length} {members.length === 1 ? t('camp.members.soulOne') : t('camp.members.soulMany')} {t('camp.members.swornSuffix')}
          </p>
        </div>
      </div>

      {/* Member List */}
      {members.length === 0 ? (
        <EmptyVault
          glyph="helm"
          title={t('camp.members.empty.title')}
          body={t('camp.members.empty.body')}
        />
      ) : (
        <OrdoPanel frame padding={0}>
          <PanelHeader
            title={t('camp.members.swornMembers')}
            glyph="helm"
            sub={`${members.length} ${t('camp.members.totalSuffix')}`}
          />

          {/* Column headers */}
          <div
            className="ao-rgrid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 120px 140px 80px',
              gap: 12,
              padding: '10px 18px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp.members.col.username')}</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp.members.col.role')}</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp.members.col.joined')}</span>
            <span />
          </div>

          {/* Rows */}
          {members.map((member: CampaignMember) => (
            <div
              key={member.userId}
              className="ao-rgrid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 120px 140px 80px',
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--hairline)',
                alignItems: 'center',
              }}
            >
              {/* Username */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <Rune kind="helm" size={14} color="var(--brass)" />
                <span style={{ fontSize: 14, color: 'var(--ink-bright)', fontWeight: 500 }}>
                  {member.username}
                </span>
                {member.isCreator && (
                  <span className="ao-overline" style={{ fontSize: 8, color: 'var(--gold)' }}>
                    {t('camp.members.creator')}
                  </span>
                )}
              </div>

              {/* Role */}
              <div>
                <OrdoChip
                  tone={member.roleInCampaign === 'GAME_MASTER' ? 'arcane' : 'gold'}
                  glyph={member.roleInCampaign === 'GAME_MASTER' ? 'sigil-1' : 'helm'}
                >
                  {t(`role.${member.roleInCampaign}`)}
                </OrdoChip>
              </div>

              {/* Joined date */}
              <div>
                <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
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
