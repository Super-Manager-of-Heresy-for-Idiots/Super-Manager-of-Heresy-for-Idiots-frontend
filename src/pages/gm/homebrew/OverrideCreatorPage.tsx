import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import {
  OrdoPanel,
  PanelHeader,
  Rune,
  OrdoField,
  OrdoDivider,
  EmptyVault,
} from '@/components/ordo';
import { useCreateOverrideHomebrew } from '@/hooks/useHomebrewV2';
import { useMarketplace } from '@/hooks/useHomebrew';
import type { HomebrewPackageResponse } from '@/types';

/* ── page ────────────────────────────────────────────────────── */

export default function OverrideCreatorPage() {
  const navigate = useNavigate();
  const createMutation = useCreateOverrideHomebrew();
  const { data: marketplaceData, isLoading: mpLoading } = useMarketplace({ size: 200 });

  const [parentId, setParentId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');

  const packages: HomebrewPackageResponse[] = marketplaceData?.content ?? [];

  const selectedParent = packages.find((p) => p.id === parentId);

  const handleCreate = () => {
    if (!parentId || !formTitle) return;
    createMutation.mutate(
      {
        parentId,
        title: formTitle,
        description: formDescription || undefined,
        tagNames: formTags ? formTags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      },
      {
        onSuccess: () => {
          navigate('/gm/homebrew');
        },
      },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (mpLoading) {
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>Doctrine Forge</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>Override Creator</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {[0, 1].map((i) => (
            <div key={i} className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 280 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '50%', height: 16, marginBottom: 16 }} />
              <div className="ao-ph" style={{ width: '80%', height: 14, marginBottom: 8 }} />
              <div className="ao-ph" style={{ width: '60%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Doctrine Forge</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Override Creator</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
          Forge a new doctrine that extends and overrides an existing parent package.
        </p>
      </div>

      {/* Dependency Warning Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: 14,
          background: 'rgba(201,128,58,0.08)',
          border: '1px solid rgba(201,128,58,0.25)',
          borderLeft: '3px solid #c9803a',
          marginBottom: 24,
        }}
      >
        <Rune kind="eye" size={16} color="#c9803a" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#c9803a', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            Override Advisory
          </div>
          <div className="ao-italic" style={{ fontSize: 11, marginTop: 3, color: 'var(--ink-quiet)' }}>
            An override package depends on its parent. If the parent is deleted or significantly changed,
            the override may become invalid. Choose your parent carefully.
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* Left: Parent Selector + Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Parent Selector */}
          <OrdoPanel frame padding={0}>
            <PanelHeader title="PARENT DOCTRINE" glyph="sigil-1" tone="gold" sub="Select the base package" />
            <div style={{ padding: 18 }}>
              <OrdoField label="Parent Package" required hint="The doctrine this override is based upon">
                <select
                  className="ao-input"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">-- Select parent --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.title} (by {pkg.authorUsername})
                    </option>
                  ))}
                </select>
              </OrdoField>

              {selectedParent && (
                <div
                  style={{
                    marginTop: 14,
                    padding: 12,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Rune kind="scroll" size={12} color="var(--brass)" />
                    <span style={{ fontSize: 13, color: 'var(--ink-bright)', fontWeight: 500 }}>
                      {selectedParent.title}
                    </span>
                  </div>
                  <span className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                    v{selectedParent.version} &middot; by {selectedParent.authorUsername}
                  </span>
                  {selectedParent.description && (
                    <p className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)', marginTop: 6 }}>
                      {selectedParent.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </OrdoPanel>

          {/* Title Form */}
          <OrdoPanel frame padding={0}>
            <PanelHeader title="DOCTRINE DETAILS" glyph="scroll" tone="gold" sub="Define your override" />
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <OrdoField label="Title" required>
                <input
                  className="ao-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Override doctrine title"
                />
              </OrdoField>

              <OrdoField label="Description">
                <textarea
                  className="ao-input"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="What does this override change?"
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </OrdoField>

              <OrdoField label="Tags" hint="Comma-separated">
                <input
                  className="ao-input"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. balance, homebrew, override"
                />
              </OrdoField>
            </div>
          </OrdoPanel>
        </div>

        {/* Right: Overrides Panel */}
        <OrdoPanel frame padding={0}>
          <PanelHeader title="OVERRIDES" glyph="sigil-2" tone="arcane" sub="Content modifications" />
          <div style={{ padding: 18 }}>
            {!parentId ? (
              <EmptyVault
                glyph="sigil-2"
                title="No Parent Selected"
                body="Select a parent doctrine to view available content that can be overridden."
              />
            ) : (
              <div>
                <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginBottom: 16 }}>
                  After creating the override package, you can add content entries that replace or extend the parent doctrine.
                </p>

                {selectedParent && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="sword" size={12} color="var(--gold-pale)" />
                      <span style={{ fontSize: 12, color: 'var(--ink)' }}>
                        {selectedParent.contentSummary.itemTypeCount} Item Types
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="helm" size={12} color="var(--gold-pale)" />
                      <span style={{ fontSize: 12, color: 'var(--ink)' }}>
                        {selectedParent.contentSummary.classCount} Classes
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="eye" size={12} color="var(--gold-pale)" />
                      <span style={{ fontSize: 12, color: 'var(--ink)' }}>
                        {selectedParent.contentSummary.skillCount} Skills
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--rule)' }}>
                      <Rune kind="sigil-3" size={12} color="var(--gold-pale)" />
                      <span style={{ fontSize: 12, color: 'var(--ink)' }}>
                        {selectedParent.contentSummary.featCount} Feats
                      </span>
                    </div>
                  </div>
                )}

                <OrdoDivider glyph="diamond" />

                {/* Create button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    className="ao-btn ao-btn--primary"
                    onClick={handleCreate}
                    disabled={!parentId || !formTitle || createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Rune kind="sigil-2" size={14} color="currentColor" />
                        <span style={{ marginLeft: 6 }}>Forge Override</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </OrdoPanel>
      </div>
    </div>
  );
}
