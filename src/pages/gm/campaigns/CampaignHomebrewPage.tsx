import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, EmptyVault, OrdoDivider } from '@/components/ordo';
import { VersionSeal, ContentPills, StatusBadge } from '@/components/homebrew';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useAttachedHomebrew, useAttachHomebrew, useDetachHomebrew, usePinHomebrewVersion } from '@/hooks/useHomebrewCampaign';
import { useMarketplace, useMyPackages } from '@/hooks/useHomebrew';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CampaignHomebrewResponse, HomebrewPackageResponse } from '@/types';
import s from './CampaignHomebrewPage.module.css';

/**
 * Сквозной флоу «homebrew → в кампанию» (P2-4 / FE-1). Одна страница в контексте кампании:
 * список привязанных пакетов (+отвязать) и кнопка «Добавить» с браузером витрины, где attach
 * делается одним кликом — без прыжков marketplace → библиотека → attach.
 */
export default function CampaignHomebrewPage() {
  const t = useT();
  const navigate = useNavigate();
  const { campaignId } = useParams<{ campaignId: string }>();

  const { data: attached, isLoading } = useAttachedHomebrew(campaignId ?? '');
  const attachMutation = useAttachHomebrew();
  const detachMutation = useDetachHomebrew();
  const pinMutation = usePinHomebrewVersion();

  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseTab, setBrowseTab] = useState<'market' | 'mine'>('market');
  const [search, setSearch] = useState('');
  const { data: marketplace, isLoading: marketLoading } = useMarketplace({ search: search || undefined, size: 24 });
  const { data: myPackages, isLoading: mineLoading } = useMyPackages({ size: 50 });

  const [detachTarget, setDetachTarget] = useState<CampaignHomebrewResponse | null>(null);
  const [pinTarget, setPinTarget] = useState<CampaignHomebrewResponse | null>(null);
  const [pinValue, setPinValue] = useState('');

  const attachedList: CampaignHomebrewResponse[] = attached ?? [];
  const attachedIds = new Set(attachedList.map((a) => a.packageId));
  const marketList: HomebrewPackageResponse[] = (marketplace?.content ?? []);
  // Собственные пакеты ГМа: привязываются даже в черновике (плейтест без публикации, guard на BE).
  const mineQuery = search.trim().toLowerCase();
  const mineList: HomebrewPackageResponse[] = (myPackages?.content ?? [])
    .filter((p) => !p.isDeleted)
    .filter((p) => !mineQuery || p.title.toLowerCase().includes(mineQuery));
  const isAttachableStatus = (status: string) => status === 'DRAFT' || status === 'PUBLISHED';

  const handleAttach = (packageId: string) => {
    if (!campaignId) return;
    attachMutation.mutate({ campaignId, data: { homebrewPackageId: packageId } });
  };

  const handleDetach = (force: boolean) => {
    if (!campaignId || !detachTarget) return;
    detachMutation.mutate(
      { campaignId, packageId: detachTarget.packageId, force },
      { onSuccess: () => setDetachTarget(null) },
    );
  };

  const openPin = (a: CampaignHomebrewResponse) => {
    setPinTarget(a);
    setPinValue(a.pinnedVersion != null ? String(a.pinnedVersion) : '');
  };

  const handlePin = () => {
    if (!campaignId || !pinTarget) return;
    const trimmed = pinValue.trim();
    pinMutation.mutate(
      { campaignId, packageId: pinTarget.packageId, data: { pinnedVersion: trimmed ? Number(trimmed) : null } },
      { onSuccess: () => setPinTarget(null) },
    );
  };

  return (
    <div>
      <div className={s.topBar}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate(`/campaigns/${campaignId}`)}>
          <Rune kind="arrow-l" size={11} /> {t('camp.homebrew.back')}
        </button>
        <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => setBrowseOpen(true)}>
          <Rune kind="plus" size={10} /> {t('camp.homebrew.add')}
        </button>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader
          title={t('camp.homebrew.title')}
          glyph="scroll"
          tone="gold"
          sub={t('camp.homebrew.attachedCount', { count: attachedList.length })}
        />

        {isLoading ? (
          <div className={s.stateRow}><Loader2 className="h-4 w-4 animate-spin" /> {t('camp.homebrew.loading')}</div>
        ) : attachedList.length === 0 ? (
          <div className={s.emptyWrap}>
            <EmptyVault glyph="scroll" title={t('camp.homebrew.emptyTitle')} body={t('camp.homebrew.emptyBody')} />
          </div>
        ) : (
          <div>
            {attachedList.map((a, idx) => (
              <div key={a.packageId} className={cn(s.row, idx < attachedList.length - 1 && s.divided)}>
                <VersionSeal version={a.pinnedVersion ?? 0} size={38} />
                <div className={s.rowMain}>
                  <div className={s.rowTitle}>
                    {a.title}
                    {a.pinnedVersion != null && (
                      <span className={s.pinTag}>{t('camp.homebrew.pinned', { version: a.pinnedVersion })}</span>
                    )}
                  </div>
                  <ContentPills
                    items={a.contentSummary.itemTypeCount}
                    classes={a.contentSummary.classCount}
                    skills={a.contentSummary.skillCount}
                    feats={a.contentSummary.featCount}
                    compact
                  />
                </div>
                <button
                  className="ao-iconbtn"
                  title={t('camp.homebrew.changeVersion')}
                  onClick={() => openPin(a)}
                >
                  <Rune kind="diamond" size={12} />
                </button>
                <button
                  className={cn('ao-iconbtn', s.detachBtn)}
                  title={t('camp.homebrew.detach')}
                  onClick={() => setDetachTarget(a)}
                >
                  <Rune kind="x" size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </OrdoPanel>

      {/* Browse marketplace to attach in one action */}
      <Dialog open={browseOpen} onOpenChange={setBrowseOpen}>
        <DialogContent className={s.browseModal}>
          <DialogHeader>
            <DialogTitle>{t('camp.homebrew.browseTitle')}</DialogTitle>
          </DialogHeader>

          <div className="ao-row ao-gap-8">
            <button
              className={cn('ao-btn ao-btn--sm', browseTab === 'market' ? 'ao-btn--primary' : 'ao-btn--ghost')}
              onClick={() => setBrowseTab('market')}
            >
              {t('camp.homebrew.tabMarket')}
            </button>
            <button
              className={cn('ao-btn ao-btn--sm', browseTab === 'mine' ? 'ao-btn--primary' : 'ao-btn--ghost')}
              onClick={() => setBrowseTab('mine')}
            >
              {t('camp.homebrew.tabMine')}
            </button>
          </div>

          <div className={s.searchRow}>
            <Rune kind="search" size={13} color="var(--ink-faint)" />
            <input
              className={s.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('camp.homebrew.searchPlaceholder')}
            />
          </div>

          <div className={s.browseList}>
            {browseTab === 'market' ? (
              marketLoading ? (
                <div className={cn('ao-italic', s.browseEmpty)}>{t('camp.homebrew.loading')}</div>
              ) : marketList.length === 0 ? (
                <div className={cn('ao-italic', s.browseEmpty)}>{t('camp.homebrew.browseEmpty')}</div>
              ) : (
                marketList.map((pkg) => {
                  const already = attachedIds.has(pkg.id);
                  return (
                    <div key={pkg.id} className={s.browseRow}>
                      <VersionSeal version={pkg.version} size={34} />
                      <div className={s.browseMain}>
                        <div className={s.browseName}>{pkg.title}</div>
                        <div className={cn('ao-codex', s.browseBy)}>
                          {t('camp.homebrew.by', { author: pkg.authorUsername })}
                        </div>
                      </div>
                      <button
                        className={cn('ao-btn ao-btn--sm', already ? 'ao-btn--ghost' : 'ao-btn--primary')}
                        disabled={already || attachMutation.isPending}
                        onClick={() => handleAttach(pkg.id)}
                      >
                        {already ? t('camp.homebrew.attached') : (<><Rune kind="plus" size={9} /> {t('camp.homebrew.attach')}</>)}
                      </button>
                    </div>
                  );
                })
              )
            ) : (
              mineLoading ? (
                <div className={cn('ao-italic', s.browseEmpty)}>{t('camp.homebrew.loading')}</div>
              ) : mineList.length === 0 ? (
                <div className={cn('ao-italic', s.browseEmpty)}>{t('camp.homebrew.mineEmpty')}</div>
              ) : (
                mineList.map((pkg) => {
                  const already = attachedIds.has(pkg.id);
                  const attachable = isAttachableStatus(pkg.status);
                  return (
                    <div key={pkg.id} className={s.browseRow}>
                      <VersionSeal version={pkg.version} size={34} />
                      <div className={s.browseMain}>
                        <div className={s.browseName}>{pkg.title}</div>
                        <StatusBadge status={pkg.status} />
                      </div>
                      <button
                        className={cn('ao-btn ao-btn--sm', already ? 'ao-btn--ghost' : 'ao-btn--primary')}
                        disabled={already || !attachable || attachMutation.isPending}
                        onClick={() => handleAttach(pkg.id)}
                      >
                        {already ? t('camp.homebrew.attached') : (<><Rune kind="plus" size={9} /> {t('camp.homebrew.attach')}</>)}
                      </button>
                    </div>
                  );
                })
              )
            )}
          </div>

          <OrdoDivider glyph="diamond" />
          <p className={cn('ao-italic', s.browseHint)}>
            {browseTab === 'market' ? t('camp.homebrew.browseHint') : t('camp.homebrew.mineHint')}
          </p>
        </DialogContent>
      </Dialog>

      {/* Change pinned version (P1-7) */}
      <AlertDialog open={!!pinTarget} onOpenChange={(o) => !o && setPinTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.homebrew.pinTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp.homebrew.pinDescription', { title: pinTarget?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            className="ao-input"
            type="number"
            min={1}
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            placeholder={t('camp.homebrew.pinPlaceholder')}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pinMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handlePin(); }} disabled={pinMutation.isPending}>
              {t('camp.homebrew.pinSave')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detach confirm (with force for dependent characters — P1-2) */}
      <AlertDialog open={!!detachTarget} onOpenChange={(o) => !o && setDetachTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('camp.homebrew.detachTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('camp.homebrew.detachDescription', { title: detachTarget?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={detachMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => handleDetach(false)}
              disabled={detachMutation.isPending}
            >
              {t('camp.homebrew.detach')}
            </button>
            <AlertDialogAction onClick={() => handleDetach(true)} disabled={detachMutation.isPending}>
              {t('camp.homebrew.detachForce')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
