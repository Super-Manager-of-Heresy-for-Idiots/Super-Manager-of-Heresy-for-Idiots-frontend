import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rune, OrdoPanel, OrdoChip, OrdoDivider, Sigil } from '@/components/ordo';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads, CodexID } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useMarketplacePackage, useInstallPackage } from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { ContentType } from '@/types';

const CONTENT_TABS: { id: ContentType; label: string; glyph: string }[] = [
  { id: 'ITEM_TYPE', label: 'Items', glyph: 'sword' },
  { id: 'CHARACTER_CLASS', label: 'Classes', glyph: 'helm' },
  { id: 'SKILL', label: 'Skills', glyph: 'eye' },
  { id: 'FEAT', label: 'Feats', glyph: 'sigil-3' },
];

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pkg, isLoading } = useMarketplacePackage(id);
  const installMutation = useInstallPackage();
  const [tab, setTab] = useState<ContentType>('ITEM_TYPE');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading || !pkg) {
    return (
      <OrdoPanel frame style={{ height: 480 }}>
        <div className="ao-ph" style={{ height: '100%' }} />
      </OrdoPanel>
    );
  }

  const s = pkg.contentSummary;
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate('/gm/homebrew/marketplace')}>
          <Rune kind="arrow-l" size={11} /> Catalogue
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ao-btn ao-btn--ghost ao-btn--sm">
            <Rune kind="scroll" size={11} /> Report
          </button>
          <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => setShowConfirm(true)}>
            <Rune kind="diamond-fill" size={9} /> Instate Doctrine
          </button>
        </div>
      </div>

      {/* Hero panel */}
      <OrdoPanel padding={0} frame>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', borderBottom: '1px solid var(--rule)' }}>
          {/* LEFT column */}
          <div style={{ padding: 24, borderRight: '1px solid var(--rule)' }}>
            {/* Codex ID + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <CodexID>{pkg.id.substring(0, 8)}</CodexID>
              <StatusBadge status="PUBLISHED" />
            </div>

            {/* Title */}
            <div className="ao-h2" style={{ fontSize: 44, lineHeight: 1.1 }}>
              {pkg.title}
            </div>

            {/* Author info + dates */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
              <Sigil size={34} glyph="sigil-1" />
              <div>
                <div style={{ fontSize: 14, color: 'var(--ink-bright)', fontFamily: 'var(--font-serif)' }}>
                  {pkg.authorUsername}
                </div>
                <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                  Game-Master
                </div>
              </div>

              {pkg.createdAt && (
                <>
                  <span style={{ width: 1, height: 32, background: 'var(--rule)', flexShrink: 0 }} />
                  <div>
                    <div className="ao-overline" style={{ fontSize: 9 }}>First Sealed</div>
                    <div className="ao-codex" style={{ fontSize: 12, marginTop: 2 }}>{formatDate(pkg.createdAt)}</div>
                  </div>
                </>
              )}

              {pkg.publishedAt && (
                <>
                  <span style={{ width: 1, height: 32, background: 'var(--rule)', flexShrink: 0 }} />
                  <div>
                    <div className="ao-overline" style={{ fontSize: 9 }}>Last Re-Sealed</div>
                    <div className="ao-codex" style={{ fontSize: 12, marginTop: 2 }}>{formatDate(pkg.publishedAt)}</div>
                  </div>
                </>
              )}
            </div>

            <OrdoDivider />

            {/* Description */}
            {pkg.description && (
              <p className="ao-italic" style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, marginTop: 16 }}>
                "{pkg.description}"
              </p>
            )}

            {/* Author caveat */}
            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              background: 'rgba(176, 141, 78, 0.05)',
              border: '1px solid var(--hairline)',
              borderLeft: '2px solid var(--brass)',
            }}>
              <div className="ao-overline" style={{ fontSize: 9, color: 'var(--gold)', marginBottom: 4 }}>
                Author's Caveat
              </div>
              <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
                Installation grants reference, not ownership. Should the author redact this doctrine, thy reference shall be marked but not erased.
              </div>
            </div>

            {/* Tags */}
            {pkg.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {pkg.tags.map((t) => <HBTag key={t}>{t}</HBTag>)}
              </div>
            )}
          </div>

          {/* RIGHT column */}
          <div style={{ padding: 24 }}>
            {/* Version seal + edition info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <VersionSeal version={pkg.version} size={68} />
              <div>
                <div className="ao-overline" style={{ fontSize: 9 }}>Edition</div>
                <div className="ao-h5" style={{ marginTop: 2 }}>Version {pkg.version}</div>
                {pkg.publishedAt && (
                  <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                    re-sealed {formatDate(pkg.publishedAt)}
                  </div>
                )}
              </div>
            </div>

            <OrdoDivider />

            {/* Stats grid 2x2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
              <div style={{
                padding: 12,
                background: 'var(--abyss)',
                border: '1px solid var(--hairline)',
              }}>
                <div className="ao-overline" style={{ fontSize: 9 }}>Instated</div>
                <div className="ao-h4" style={{ marginTop: 6, color: 'var(--ink-bright)' }}>
                  {pkg.downloadCount.toLocaleString()}
                </div>
                <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                  times installed
                </div>
              </div>
              <div style={{
                padding: 12,
                background: 'var(--abyss)',
                border: '1px solid var(--hairline)',
              }}>
                <div className="ao-overline" style={{ fontSize: 9 }}>Version</div>
                <div className="ao-h4" style={{ marginTop: 6, color: 'var(--gold)' }}>
                  v{pkg.version}
                </div>
                <div className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)', marginTop: 2 }}>
                  current edition
                </div>
              </div>
            </div>

            {/* Content pills */}
            <div style={{ marginTop: 16 }}>
              <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} />
            </div>

            {/* Authorize button */}
            <button
              className="ao-btn ao-btn--primary ao-btn--lg ao-btn--block"
              style={{ marginTop: 18 }}
              onClick={() => setShowConfirm(true)}
            >
              <Rune kind="diamond-fill" size={12} /> Authorize Instatement
            </button>

            <div className="ao-codex" style={{ textAlign: 'center', fontSize: 10, color: 'var(--ink-faint)', marginTop: 8 }}>
              installation grants reference, not ownership
            </div>
          </div>
        </div>

        {/* Content tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--rule)' }}>
          {CONTENT_TABS.map((t) => {
            const count = (contentByType[t.id] || []).length;
            return (
              <button
                key={t.id}
                className={`ao-tab${tab === t.id ? ' is-active' : ''}`}
                onClick={() => setTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px' }}
              >
                <Rune kind={t.glyph} size={13} color={tab === t.id ? 'var(--gold)' : 'var(--ink-quiet)'} />
                {t.label} <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: 20 }}>
          {currentContent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <Rune kind="sigil-3" size={40} color="var(--ink-quiet)" />
              <div className="ao-italic" style={{ marginTop: 12, color: 'var(--ink-faint)', fontSize: 14 }}>
                No {CONTENT_TABS.find((t) => t.id === tab)?.label.toLowerCase()} in this doctrine.
              </div>
            </div>
          ) : tab === 'FEAT' ? (
            /* Feats: ao-table */
            <table className="ao-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Feat</th>
                  <th>Inscription</th>
                </tr>
              </thead>
              <tbody>
                {currentContent.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <OrdoChip tone="gold" glyph="sigil-3">{f.tier || '—'}</OrdoChip>
                    </td>
                    <td style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>{f.name}</td>
                    <td className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13 }}>
                      {f.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === 'ITEM_TYPE' ? (
            /* Items: 2-column grid with icon slots */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {currentContent.map((item) => (
                <OrdoPanel key={item.id} padding={0} inset style={{ display: 'flex', gap: 12, padding: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--abyss)',
                    border: '1px solid var(--hairline)',
                  }}>
                    <Rune kind="sword" size={20} color="var(--gold-pale)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span className="ao-h6" style={{ fontSize: 14 }}>{item.name}</span>
                      {item.slot && (
                        <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{item.slot}</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 4 }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </OrdoPanel>
              ))}
            </div>
          ) : tab === 'CHARACTER_CLASS' ? (
            /* Classes: single card per class */
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {currentContent.map((cls) => (
                <OrdoPanel key={cls.id} padding={16} inset>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--abyss)',
                      border: '1px solid var(--hairline)',
                    }}>
                      <Rune kind="helm" size={22} color="var(--gold-pale)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="ao-h5">{cls.name}</div>
                      {cls.description && (
                        <p className="ao-italic" style={{ fontSize: 13, color: 'var(--ink-quiet)', marginTop: 4 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {currentContent.map((skill) => (
                <OrdoPanel key={skill.id} padding={12} inset>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span className="ao-h6" style={{ fontSize: 14 }}>{skill.name}</span>
                    {skill.skillType && (
                      <span className="ao-codex" style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{skill.skillType}</span>
                    )}
                  </div>
                  {skill.description && (
                    <p className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 4 }}>
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
        <AlertDialogContent style={{
          background: 'var(--obsidian)',
          border: '1px solid var(--rule-strong)',
          padding: 0,
          maxWidth: 520,
        }}>
          <div style={{ textAlign: 'center', padding: '28px 32px 0' }}>
            <Sigil size={56} glyph="sigil-2" color="var(--gold)" />
            <div className="ao-overline" style={{ marginTop: 14, color: 'var(--gold)', letterSpacing: '0.2em' }}>
              RITE OF INSTATEMENT
            </div>
            <div className="ao-h4" style={{ marginTop: 8 }}>
              Authorize this Doctrine?
            </div>
          </div>

          <OrdoDivider />

          <div style={{ padding: '0 32px' }}>
            {/* Package info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' }}>
              <VersionSeal version={pkg.version} size={48} />
              <div style={{ flex: 1 }}>
                <div className="ao-h6" style={{ fontSize: 16 }}>{pkg.title}</div>
                <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
                  by {pkg.authorUsername} <span style={{ margin: '0 4px' }}>|</span> {pkg.id.substring(0, 8)}
                </div>
              </div>
            </div>

            <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} compact />

            <AlertDialogHeader style={{ marginTop: 14 }}>
              <AlertDialogTitle style={{ display: 'none' }}>Authorize Instatement</AlertDialogTitle>
              <AlertDialogDescription style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink-quiet)' }}>
                By instatement, you may reference the contents of "{pkg.title}". The doctrine is not copied — should the author redact it, your reference shall be marked but not erased.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter style={{
            display: 'flex',
            gap: 10,
            padding: '18px 32px 24px',
            justifyContent: 'flex-end',
          }}>
            <AlertDialogCancel asChild>
              <button className="ao-btn ao-btn--ghost">
                <Rune kind="x" size={10} /> Withhold
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button className="ao-btn ao-btn--primary" onClick={handleInstall}>
                <Rune kind="diamond-fill" size={9} /> Seal Instatement
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
