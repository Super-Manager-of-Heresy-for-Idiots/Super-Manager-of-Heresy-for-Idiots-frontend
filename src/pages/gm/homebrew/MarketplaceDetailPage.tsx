import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip, OrdoDivider, Sigil } from '@/components/ordo';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useMarketplacePackage, useInstallPackage } from '@/hooks/useHomebrew';
import { useT } from '@/i18n/I18nContext';
import { formatDate, cn } from '@/lib/utils';
import type { ContentType } from '@/types';
import s from './MarketplaceDetailPage.module.css';

const CONTENT_TABS: { id: ContentType; labelKey: string; glyph: string }[] = [
  { id: 'ITEM_TYPE', labelKey: 'hb.detail.tabItems', glyph: 'sword' },
  { id: 'CHARACTER_CLASS', labelKey: 'hb.detail.tabClasses', glyph: 'helm' },
  { id: 'SKILL', labelKey: 'hb.detail.tabSkills', glyph: 'eye' },
  { id: 'FEAT', labelKey: 'hb.detail.tabFeats', glyph: 'sigil-3' },
];

export default function MarketplaceDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pkg, isLoading } = useMarketplacePackage(id);
  const installMutation = useInstallPackage();
  const [tab, setTab] = useState<ContentType>('ITEM_TYPE');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading || !pkg) {
    return (
      <OrdoPanel frame className={s.loadingPanel}>
        <div className={cn('ao-ph', s.loadingPh)} />
      </OrdoPanel>
    );
  }

  const cs = pkg.contentSummary;
  const contentByType = pkg.contentByType || {};
  const currentContent = contentByType[tab] || [];

  const handleInstall = () => {
    installMutation.mutate(pkg.id, {
      onSuccess: () => setShowConfirm(false),
    });
  };

  return (
    <div>
      {/* Top actions */}
      <div className={s.topActions}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate('/gm/homebrew/marketplace')}>
          <Rune kind="arrow-l" size={11} /> {t('hb.detail.catalogue')}
        </button>
        <div className={s.topRight}>
          <button className="ao-btn ao-btn--ghost ao-btn--sm">
            <Rune kind="scroll" size={11} /> {t('hb.detail.report')}
          </button>
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => setShowConfirm(true)}>
            <Rune kind="diamond-fill" size={9} /> {t('hb.detail.instate')}
          </button>
        </div>
      </div>

      {/* Hero panel */}
      <OrdoPanel padding={0} frame>
        <div className={cn('ao-rgrid', s.heroGrid)}>
          {/* LEFT column */}
          <div className={s.heroLeft}>
            {/* Codex ID + status */}
            <div className={s.idRow}>
              <CodexID>{pkg.id.substring(0, 8)}</CodexID>
              <StatusBadge status="PUBLISHED" />
            </div>

            {/* Title */}
            <div className={cn('ao-h2', s.heroTitle)}>
              {pkg.title}
            </div>

            {/* Author info + dates */}
            <div className={s.authorRow}>
              <Sigil size={34} glyph="sigil-1" />
              <div>
                <div className={s.authorName}>
                  {pkg.authorUsername}
                </div>
                <div className={cn('ao-codex', s.authorRole)}>
                  {t('hb.detail.gameMaster')}
                </div>
              </div>

              {pkg.createdAt && (
                <>
                  <span className={s.vDivider} />
                  <div>
                    <div className={cn('ao-overline', s.dateLabel)}>{t('hb.detail.firstSealed')}</div>
                    <div className={cn('ao-codex', s.dateValue)}>{formatDate(pkg.createdAt)}</div>
                  </div>
                </>
              )}

              {pkg.publishedAt && (
                <>
                  <span className={s.vDivider} />
                  <div>
                    <div className={cn('ao-overline', s.dateLabel)}>{t('hb.detail.lastReSealed')}</div>
                    <div className={cn('ao-codex', s.dateValue)}>{formatDate(pkg.publishedAt)}</div>
                  </div>
                </>
              )}
            </div>

            <OrdoDivider />

            {/* Description */}
            {pkg.description && (
              <p className={cn('ao-italic', s.desc)}>
                "{pkg.description}"
              </p>
            )}

            {/* Author caveat */}
            <div className={s.caveat}>
              <div className={cn('ao-overline', s.caveatLabel)}>
                {t('hb.detail.authorCaveat')}
              </div>
              <div className={cn('ao-italic', s.caveatBody)}>
                {t('hb.detail.caveatBody')}
              </div>
            </div>

            {/* Tags */}
            {pkg.tags.length > 0 && (
              <div className={s.tagsRow}>
                {pkg.tags.map((tag) => <HBTag key={tag}>{tag}</HBTag>)}
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div className={s.heroRight}>
            {/* Version seal + edition info */}
            <div className={s.editionRow}>
              <VersionSeal version={pkg.version} size={68} />
              <div>
                <div className={cn('ao-overline', s.editionLabel)}>{t('hb.detail.edition')}</div>
                <div className={cn('ao-h5', s.editionVer)}>{t('hb.detail.version', { version: pkg.version })}</div>
                {pkg.publishedAt && (
                  <div className={cn('ao-codex', s.editionResealed)}>
                    {t('hb.detail.reSealed', { date: formatDate(pkg.publishedAt) })}
                  </div>
                )}
              </div>
            </div>

            <OrdoDivider />

            {/* Stats grid 2x2 */}
            <div className={cn('ao-rgrid', s.statsGrid)}>
              <div className={s.statBox}>
                <div className={cn('ao-overline', s.statLabel)}>{t('hb.detail.instatedStat')}</div>
                <div className={cn('ao-h4', s.statValue)}>
                  {pkg.downloadCount.toLocaleString()}
                </div>
                <div className={cn('ao-codex', s.statNote)}>
                  {t('hb.detail.timesInstalled')}
                </div>
              </div>
              <div className={s.statBox}>
                <div className={cn('ao-overline', s.statLabel)}>{t('hb.detail.versionStat')}</div>
                <div className={cn('ao-h4', s.statValue, s.gold)}>
                  v{pkg.version}
                </div>
                <div className={cn('ao-codex', s.statNote)}>
                  {t('hb.detail.currentEdition')}
                </div>
              </div>
            </div>

            {/* Content pills */}
            <div className={s.pillsWrap}>
              <ContentPills items={cs.itemTypeCount} classes={cs.classCount} skills={cs.skillCount} feats={cs.featCount} />
            </div>

            {/* Authorize button */}
            <button
              className={cn('ao-btn ao-btn--primary ao-btn--lg ao-btn--block', s.authorizeBtn)}
              onClick={() => setShowConfirm(true)}
            >
              <Rune kind="diamond-fill" size={12} /> {t('hb.detail.authorize')}
            </button>

            <div className={cn('ao-codex', s.grantsNote)}>
              {t('hb.detail.grantsReference')}
            </div>
          </div>
        </div>

        {/* Content tabs */}
        <div className={s.tabsBar}>
          {CONTENT_TABS.map((ct) => {
            const count = (contentByType[ct.id] || []).length;
            return (
              <button
                key={ct.id}
                className={cn('ao-tab', tab === ct.id && 'is-active', s.tab)}
                onClick={() => setTab(ct.id)}
              >
                <Rune kind={ct.glyph} size={13} color={tab === ct.id ? 'var(--gold)' : 'var(--ink-quiet)'} />
                {t(ct.labelKey)} <span className={cn('ao-codex', s.tabCount)}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className={s.tabBody}>
          {currentContent.length === 0 ? (
            <div className={s.emptyTab}>
              <Rune kind="sigil-3" size={40} color="var(--ink-quiet)" />
              <div className={cn('ao-italic', s.emptyTabText)}>
                {t('hb.detail.noContent', { label: (t(CONTENT_TABS.find((ct) => ct.id === tab)?.labelKey ?? '')).toLowerCase() })}
              </div>
            </div>
          ) : tab === 'FEAT' ? (
            /* Feats: ao-table */
            <table className={cn('ao-table', s.featTable)}>
              <thead>
                <tr>
                  <th>{t('hb.detail.colTier')}</th>
                  <th>{t('hb.detail.colFeat')}</th>
                  <th>{t('hb.detail.colInscription')}</th>
                </tr>
              </thead>
              <tbody>
                {currentContent.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <OrdoChip tone="gold" glyph="sigil-3">{f.tier || '—'}</OrdoChip>
                    </td>
                    <td className={s.featName}>{f.name}</td>
                    <td className={cn('ao-italic', s.featDesc)}>
                      {f.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === 'ITEM_TYPE' ? (
            /* Items: 2-column grid with icon slots */
            <div className={cn('ao-rgrid', s.itemsGrid)}>
              {currentContent.map((item) => (
                <OrdoPanel key={item.id} padding={0} inset className={s.itemCard}>
                  <div className={s.iconSlot}>
                    <Rune kind="sword" size={20} color="var(--gold-pale)" />
                  </div>
                  <div className={s.itemMain}>
                    <div className={s.itemHead}>
                      <span className={cn('ao-h6', s.itemName)}>{item.name}</span>
                      {item.slot && (
                        <span className={cn('ao-codex', s.itemSlot)}>{item.slot}</span>
                      )}
                    </div>
                    {item.description && (
                      <p className={cn('ao-italic', s.itemDesc)}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </OrdoPanel>
              ))}
            </div>
          ) : tab === 'CHARACTER_CLASS' ? (
            /* Classes: single card per class */
            <div className={cn('ao-rgrid', s.classGrid)}>
              {currentContent.map((cls) => (
                <OrdoPanel key={cls.id} padding={16} inset>
                  <div className={s.classRow}>
                    <div className={s.iconSlot}>
                      <Rune kind="helm" size={22} color="var(--gold-pale)" />
                    </div>
                    <div className={s.classMain}>
                      <div className="ao-h5">{cls.name}</div>
                      {cls.description && (
                        <p className={cn('ao-italic', s.classDesc)}>
                          {cls.description}
                        </p>
                      )}
                    </div>
                  </div>
                </OrdoPanel>
              ))}
            </div>
          ) : (
            /* Skills: 3-column grid */
            <div className={cn('ao-rgrid', s.skillGrid)}>
              {currentContent.map((skill) => (
                <OrdoPanel key={skill.id} padding={12} inset>
                  <div className={s.skillHead}>
                    <span className={cn('ao-h6', s.skillName)}>{skill.name}</span>
                    {skill.skillType && (
                      <span className={cn('ao-codex', s.skillType)}>{skill.skillType}</span>
                    )}
                  </div>
                  {skill.description && (
                    <p className={cn('ao-italic', s.skillDesc)}>
                      {skill.description}
                    </p>
                  )}
                </OrdoPanel>
              ))}
            </div>
          )}
        </div>
      </OrdoPanel>

      {/* Install confirmation modal */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className={s.modal}>
          <div className={s.modalHead}>
            <Sigil size={56} glyph="sigil-2" color="var(--gold)" />
            <div className={cn('ao-overline', s.modalOverline)}>
              {t('hb.detail.riteOfInstatement')}
            </div>
            <div className={cn('ao-h4', s.modalTitle)}>
              {t('hb.detail.authorizeThis')}
            </div>
          </div>

          <OrdoDivider />

          <div className={s.modalBody}>
            {/* Package info */}
            <div className={s.modalPkgRow}>
              <VersionSeal version={pkg.version} size={48} />
              <div className={s.modalPkgMain}>
                <div className={cn('ao-h6', s.modalPkgTitle)}>{pkg.title}</div>
                <div className={cn('ao-codex', s.modalPkgMeta)}>
                  {t('hb.detail.byPipe', { author: pkg.authorUsername })} <span className={s.modalPkgSep}>|</span> {pkg.id.substring(0, 8)}
                </div>
              </div>
            </div>

            <ContentPills items={cs.itemTypeCount} classes={cs.classCount} skills={cs.skillCount} feats={cs.featCount} compact />

            <AlertDialogHeader className={s.modalHeader}>
              <AlertDialogTitle className={s.modalDescHidden}>{t('hb.detail.authorizeTitle')}</AlertDialogTitle>
              <AlertDialogDescription className={s.modalDesc}>
                {t('hb.detail.confirmBody', { title: pkg.title })}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter className={s.modalFooter}>
            <AlertDialogCancel asChild>
              <button className="ao-btn ao-btn--ghost">
                <Rune kind="x" size={10} /> {t('hb.detail.withhold')}
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button className="ao-btn ao-btn--primary" onClick={handleInstall}>
                <Rune kind="diamond-fill" size={9} /> {t('hb.detail.sealInstatement')}
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
