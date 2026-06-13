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
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignResponse } from '@/types';
import s from './HomebrewLibraryPage.module.css';

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
  const t = useT();
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
        <div className={s.headerLg}>
          <p className={cn('ao-overline', s.overline)}>{t('hb.library.overline')}</p>
          <h3 className={cn('ao-h3', s.heading)}>{t('hb.library.heading')}</h3>
        </div>
        <div className={cn('ao-rgrid', s.skelGrid)}>
          {[0, 1].map((i) => (
            <div key={i} className={cn('ao-panel ao-frame ao-breathe', s.skelCard)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.skelLine1)} />
              <div className={cn('ao-ph', s.skelLine2)} />
              <div className={cn('ao-ph', s.skelLine3)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('hb.library.error')}
        </p>
        <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <p className={cn('ao-overline', s.overline)}>{t('hb.library.overline')}</p>
        <h3 className={cn('ao-h3', s.heading)}>{t('hb.library.heading')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {t('hb.library.subtitle')}
        </p>
      </div>

      {/* Main Grid */}
      <div className={cn('ao-rgrid', s.mainGrid)}>
        {/* Library List */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('hb.library.libraryTitle')} glyph="scroll" tone="gold" sub={t('hb.library.doctrinesCount', { count: libraryEntries.length })} />

          {libraryEntries.length === 0 ? (
            <div className={s.emptyWrap}>
              <EmptyVault
                glyph="scroll"
                title={t('hb.library.emptyTitle')}
                body={t('hb.library.emptyBody')}
              />
            </div>
          ) : (
            <div>
              {libraryEntries.map((entry: LibraryEntry, idx: number) => (
                <div
                  key={entry.id}
                  className={cn(s.entryRow, idx < libraryEntries.length - 1 && s.divided)}
                >
                  <VersionSeal version={entry.version} size={40} />

                  <div className={s.entryMain}>
                    <div className={s.entryHead}>
                      <span className={s.entryTitle}>
                        {entry.title}
                      </span>
                      {entry.isAttached && (
                        <span className={s.attachedTag}>
                          {t('hb.library.attached')}
                        </span>
                      )}
                    </div>

                    <div className={cn('ao-codex', s.entryBy)}>
                      {t('hb.library.byVersion', { author: entry.authorUsername, version: entry.version })}
                    </div>

                    {/* Rating */}
                    {entry.rating && (
                      <div className={s.ratingWrap}>
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
                    title={t('hb.library.attachToCampaign')}
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
          <PanelHeader title={t('hb.library.attachHeading')} glyph="sigil-1" tone="arcane" sub={t('hb.library.attachSub')} />

          <div className={s.attachBody}>
            <p className={cn('ao-italic', s.attachIntro)}>
              {t('hb.library.attachBody')}
            </p>

            <OrdoField label={t('hb.library.campaign')} hint={t('hb.library.targetCampaign')}>
              <select
                className={cn('ao-input', s.fieldSelect)}
                value={attachCampaignId}
                onChange={(e) => setAttachCampaignId(e.target.value)}
              >
                <option value="">{t('hb.library.selectCampaign')}</option>
                {campaignList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </OrdoField>

            <div className={s.fieldSpacer}>
              <OrdoField label={t('hb.library.package')} hint={t('hb.library.doctrineToAttach')}>
                <select
                  className={cn('ao-input', s.fieldSelect)}
                  value={attachPackageId}
                  onChange={(e) => setAttachPackageId(e.target.value)}
                >
                  <option value="">{t('hb.library.selectDoctrine')}</option>
                  {libraryEntries.map((entry) => (
                    <option key={entry.id} value={entry.packageId}>
                      {entry.title} (v{entry.version})
                    </option>
                  ))}
                </select>
              </OrdoField>
            </div>

            <div className={s.fieldSpacer}>
              <OrdoField label={t('hb.library.pinnedVersion')} hint={t('hb.library.leaveEmptyLatest')}>
                <input
                  className="ao-input"
                  type="number"
                  min="1"
                  value={attachPinnedVersion}
                  onChange={(e) => setAttachPinnedVersion(e.target.value)}
                  placeholder={t('hb.library.latest')}
                />
              </OrdoField>
            </div>

            <OrdoDivider glyph="diamond" />

            <div className={s.attachFooter}>
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
                    <span className={s.attachBtnLabel}>{t('hb.library.attach')}</span>
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
            <DialogTitle>{t('hb.library.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div className={s.dialogFields}>
            <OrdoField label={t('hb.library.campaign')} required>
              <select
                className={cn('ao-input', s.fieldSelect)}
                value={attachCampaignId}
                onChange={(e) => setAttachCampaignId(e.target.value)}
              >
                <option value="">{t('hb.library.selectCampaign')}</option>
                {campaignList.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </OrdoField>

            <OrdoField label={t('hb.library.pinnedVersion')} hint={t('hb.library.leaveEmptyLatest')}>
              <input
                className="ao-input"
                type="number"
                min="1"
                value={attachPinnedVersion}
                onChange={(e) => setAttachPinnedVersion(e.target.value)}
                placeholder={t('hb.library.latest')}
              />
            </OrdoField>
          </div>
          <DialogFooter>
            <button className="ao-btn ao-btn--ghost" onClick={() => setAttachOpen(false)} disabled={attachMutation.isPending}>
              {t('hb.library.withhold')}
            </button>
            <button
              className="ao-btn ao-btn--primary"
              onClick={handleAttach}
              disabled={!attachCampaignId || attachMutation.isPending}
            >
              {attachMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('hb.library.attach')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
