import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Rune, Sigil, OrdoDivider, OrdoPanel, OrdoField, EmptyVault, ErrorAltar } from '@/components/ordo';
import { CampaignStatusPill } from '@/components/campaigns';
import { useAuthStore } from '@/store/authStore';
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
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useJoinCampaign } from '@/hooks/useCampaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignResponse } from '@/types';
import s from './CampaignListPage.module.css';

/* ── page ────────────────────────────────────────────────────── */

export default function CampaignListPage() {
  const t = useT();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isPlayer = user?.role === 'PLAYER';
  const { data: campaigns, isLoading, error, refetch } = useCampaigns();
  const createMutation = useCreateCampaign();
  const deleteMutation = useDeleteCampaign();
  const joinMutation = useJoinCampaign();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

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

  const handleJoin = () => {
    const code = inviteCode.trim();
    if (!code) return;
    joinMutation.mutate(
      { inviteCode: code },
      {
        onSuccess: (response) => {
          const campaignId = response.data?.id;
          setInviteCode('');
          if (campaignId) navigate(`/campaigns/${campaignId}`);
        },
      },
    );
  };

  if (isPlayer) {
    return (
      <div>
        <div className={s.header}>
          <p className={cn('ao-overline', s.overlineGold)}>
            {t('camp.list.access.overline')}
          </p>
          <h3 className={cn('ao-h3', s.title)}>{t('camp.list.title')}</h3>
          <p className={cn('ao-italic', s.sub)}>
            {t('camp.list.access.sub')}
          </p>
        </div>

        <OrdoPanel frame padding={24} className={s.joinPanel}>
          <div className={s.joinCol}>
            <OrdoField label={t('camp.list.inviteCode')} required>
              <input
                className="ao-input"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleJoin();
                }}
                placeholder={t('camp.list.inviteCodePlaceholder')}
                maxLength={8}
                autoComplete="off"
              />
            </OrdoField>

            <button
              type="button"
              className={cn('ao-btn ao-btn--primary', s.joinBtn)}
              onClick={handleJoin}
              disabled={!inviteCode.trim() || joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rune kind="cross-pat" size={14} color="currentColor" />
              )}
              <span className={s.ml6}>{t('camp.list.join')}</span>
            </button>
          </div>
        </OrdoPanel>

        <OrdoDivider glyph="diamond" color="var(--rule)" />

        <div className={s.section}>
          {error ? (
            <ErrorAltar
              title={t('camp.list.loadError')}
              error={error}
              onRetry={() => refetch()}
              retryLabel={t('camp.retry')}
            />
          ) : isLoading ? (
            <div className={s.cardGrid}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
                  <span className="ao-frame-c" />
                  <div className={cn('ao-ph', s.phWide)} />
                  <div className={cn('ao-ph', s.phNarrow)} />
                </div>
              ))}
            </div>
          ) : !campaigns || campaigns.length === 0 ? (
            <EmptyVault
              glyph="helm"
              title={t('camp.list.empty.player.title')}
              body={t('camp.list.empty.player.body')}
            />
          ) : (
            <div className={s.cardGrid}>
              {campaigns.map((campaign: CampaignResponse) => (
                <OrdoPanel key={campaign.id} frame padding={0}>
                  <div className={s.cardBody}>
                    <div className={s.cardHead}>
                      <Sigil size={44} glyph="shield" color="var(--gold)" />
                      <div className={s.cardHeadMain}>
                        <h4 className={cn('ao-h4', s.cardTitle)}>{campaign.name}</h4>
                        <div className={s.statusRow}>
                          <CampaignStatusPill status={campaign.status} />
                        </div>
                      </div>
                    </div>

                    {campaign.description && (
                      <p className={cn('ao-italic', s.clamp, s.clampMt12)}>
                        {campaign.description}
                      </p>
                    )}
                  </div>

                  <div className={s.cardFooter}>
                    <button
                      className={cn('ao-btn ao-btn--primary ao-btn--sm', s.footerBtn)}
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <Rune kind="eye" size={12} color="currentColor" />
                      <span className={s.ml4}>{t('camp.list.enter')}</span>
                    </button>
                  </div>
                </OrdoPanel>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter((c: CampaignResponse) => c.status === 'ACTIVE') ?? [];
  const totalMembers = campaigns?.reduce(
    (sum: number, c: CampaignResponse) => sum + (c.members?.length || 0),
    0,
  ) ?? 0;

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <ErrorAltar
        title={t('camp.list.loadError')}
        error={error}
        onRetry={() => refetch()}
        retryLabel={t('camp.retry')}
      />
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <p className={cn('ao-overline', s.overlineGold)}>
          {t('camp.list.sworn.overline')}
        </p>
        <h3 className={cn('ao-h3', s.title)}>{t('camp.list.title')}</h3>
        <p className={cn('ao-italic', s.sub)}>
          {t('camp.list.gm.sub')}
        </p>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Stats row */}
      <div className={s.statsRow}>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valGold)}>
            {isLoading ? '\u2014' : (campaigns?.length || 0)}
          </span>
          <span className="ao-stat-label">{t('camp.list.stat.total')}</span>
        </div>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valGreen)}>
            {isLoading ? '\u2014' : activeCampaigns.length}
          </span>
          <span className="ao-stat-label">{t('camp.list.stat.active')}</span>
        </div>
        <div className={cn('ao-stat', s.stat)}>
          <span className={cn('ao-stat-value', s.valArcane)}>
            {isLoading ? '\u2014' : totalMembers}
          </span>
          <span className="ao-stat-label">{t('camp.list.stat.members')}</span>
        </div>
      </div>

      <OrdoDivider glyph="diamond" color="var(--rule)" />

      {/* Action bar */}
      <div className={s.actionBar}>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={s.ml6}>{t('camp.list.forge')}</span>
        </button>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className={s.cardGrid}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelLg)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phWide)} />
              <div className={cn('ao-ph', s.phNarrow)} />
            </div>
          ))}
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyVault
          glyph="shield"
          title={t('camp.list.empty.gm.title')}
          body={t('camp.list.empty.gm.body')}
          action={
            <button
              className="ao-btn ao-btn--primary ao-btn--lg"
              onClick={() => { resetForm(); setDialogOpen(true); }}
            >
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={s.ml6}>{t('camp.list.forgeFirst')}</span>
            </button>
          }
        />
      ) : (
        <div className={s.cardGrid}>
          {campaigns.map((campaign: CampaignResponse) => (
            <OrdoPanel key={campaign.id} frame padding={0}>
              <div className={s.cardBody}>
                <div className={s.cardHead}>
                  <Sigil size={44} glyph="shield" color="var(--gold)" />
                  <div className={s.cardHeadMain}>
                    <h4 className={cn('ao-h4', s.cardTitle)}>{campaign.name}</h4>
                    <div className={s.statusRow}>
                      <CampaignStatusPill status={campaign.status} />
                    </div>
                  </div>
                </div>

                <div className={s.memberRow}>
                  <Rune kind="helm" size={14} color="var(--ink-quiet)" />
                  <span className={cn('ao-codex', s.memberText)}>
                    {campaign.members?.length || 0} {(campaign.members?.length || 0) === 1 ? t('camp.list.memberOne') : t('camp.list.memberMany')}
                  </span>
                </div>

                {campaign.description && (
                  <p className={cn('ao-italic', s.clamp, s.clampMt8)}>
                    {campaign.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className={s.cardFooter}>
                <button
                  className={cn('ao-btn ao-btn--primary ao-btn--sm', s.footerBtn)}
                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                >
                  <Rune kind="eye" size={12} color="currentColor" />
                  <span className={s.ml4}>{t('camp.list.view')}</span>
                </button>
                <button
                  className="ao-btn ao-btn--danger ao-btn--sm"
                  onClick={() => setDeleteId(campaign.id)}
                  title={t('camp.list.deleteTitle')}
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
            <DialogTitle>{t('camp.list.create.title')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogCol}>
            <OrdoField label={t('camp.list.field.name')} required>
              <input
                className="ao-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('camp.list.field.namePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('camp.list.field.description')}>
              <textarea
                className={cn('ao-input', s.resizeV)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('camp.list.field.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('camp.list.withhold')}
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
              {t('camp.list.forgeAction')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.list.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp.list.delete.body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('camp.list.withhold')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('camp.list.unmake')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
