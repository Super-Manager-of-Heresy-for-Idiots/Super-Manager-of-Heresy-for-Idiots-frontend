import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Rune, OrdoPanel, OrdoChip, PanelHeader } from '@/components/ordo';
import { ContentPills } from '@/components/homebrew';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  useMyPackage,
  useUpdateHomebrew,
  useAddContent,
  useRemoveContent,
  usePublishHomebrew,
  useDeleteHomebrew,
} from '@/hooks/useHomebrew';
import { homebrewApi } from '@/api/homebrew.api';
import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOTS } from '@/types';
import type { ContentType, EquipmentSlot } from '@/types';

const CONTENT_GROUPS: { title: string; icon: string; type: ContentType }[] = [
  { title: 'Items', icon: 'sword', type: 'ITEM_TYPE' },
  { title: 'Classes', icon: 'helm', type: 'CHARACTER_CLASS' },
  { title: 'Skills', icon: 'eye', type: 'SKILL' },
  { title: 'Feats', icon: 'sigil-3', type: 'FEAT' },
];

export default function EditDoctrinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pkg, isLoading } = useMyPackage(id);
  const updateMutation = useUpdateHomebrew();
  const addContentMutation = useAddContent();
  const removeContentMutation = useRemoveContent();
  const publishMutation = usePublishHomebrew();
  const deleteMutation = useDeleteHomebrew();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagText, setTagText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<'existing' | 'new'>('new');
  const [addType, setAddType] = useState<ContentType>('ITEM_TYPE');
  const [addSearch, setAddSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newItemSlot, setNewItemSlot] = useState<EquipmentSlot>('MAIN_HAND');
  const [newSkillType, setNewSkillType] = useState('');
  const [newFeatPrerequisites, setNewFeatPrerequisites] = useState('');
  const [creatingContent, setCreatingContent] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  if (pkg && !metaLoaded) {
    setTitle(pkg.title);
    setDescription(pkg.description || '');
    setTags(pkg.tags);
    setMetaLoaded(true);
  }

  if (isLoading || !pkg) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div className="ao-overline">Homebrew editor</div>
            <div className="ao-h3" style={{ marginTop: 4 }}>Loading doctrine...</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ao-ph" style={{ width: '100%', height: 48 }} />
          ))}
        </div>
      </div>
    );
  }

  const isDraft = pkg.status === 'DRAFT';
  const s = pkg.contentSummary;
  const contentByType = pkg.contentByType || {};

  const normalizeTag = (raw: string) =>
    raw.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleAddTag = () => {
    const norm = normalizeTag(tagText);
    if (norm && !tags.includes(norm) && tags.length < 10) {
      setTags([...tags, norm]);
    }
    setTagText('');
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: pkg.id,
      data: {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      },
    });
  };

  const handleAddContent = () => {
    if (!addSearch.trim()) return;
    addContentMutation.mutate(
      { packageId: pkg.id, data: { contentType: addType, contentId: addSearch.trim() } },
      { onSuccess: () => setAddSearch('') },
    );
  };

  const resetNewContentForm = () => {
    setNewName('');
    setNewDescription('');
    setNewItemSlot('MAIN_HAND');
    setNewSkillType('');
    setNewFeatPrerequisites('');
  };

  const handleCreateAndAddContent = async () => {
    const name = newName.trim();
    if (!name) return;

    setCreatingContent(true);
    try {
      const description = newDescription.trim() || undefined;

      if (addType === 'ITEM_TYPE') {
        await homebrewApi.createPackageItemType(pkg.id, {
          name,
          description,
          slot: newItemSlot,
        });
      } else if (addType === 'CHARACTER_CLASS') {
        await homebrewApi.createPackageCharacterClass(pkg.id, { name, description });
      } else if (addType === 'SKILL') {
        await homebrewApi.createPackageSkill(pkg.id, {
          name,
          description,
          skillType: newSkillType.trim() || undefined,
        });
      } else if (addType === 'FEAT') {
        await homebrewApi.createPackageFeat(pkg.id, {
          name,
          description,
          prerequisites: newFeatPrerequisites.trim() || undefined,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', pkg.id] });
      resetNewContentForm();
      toast.success('Homebrew content created and slotted');
    } catch {
      toast.error('Failed to create homebrew-scoped content');
    } finally {
      setCreatingContent(false);
    }
  };

  const handleRemoveContent = (contentItemId: string) => {
    removeContentMutation.mutate({ packageId: pkg.id, contentItemId });
  };

  const handlePublish = () => {
    publishMutation.mutate(pkg.id, { onSuccess: () => setShowPublish(false) });
  };

  const handleDelete = () => {
    deleteMutation.mutate(pkg.id, {
      onSuccess: () => {
        setShowDelete(false);
        navigate('/gm/homebrew/my');
      },
    });
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate('/gm/homebrew/my')}>
          <Rune kind="arrow-l" size={11} /> Workshop
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrdoChip tone={isDraft ? 'rune' : 'gold'}>{pkg.status}</OrdoChip>
        </div>
      </div>

      <div className="ao-codex" style={{ marginBottom: 16, color: 'var(--ink-faint)' }}>
        {pkg.id.substring(0, 8)} &middot; {pkg.title} &middot; {pkg.status}
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Outer Inscription */}
          <OrdoPanel padding={0} frame>
            <PanelHeader title="Outer Inscription" glyph="scroll" sub="editable &middot; draft state" />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="ao-label">Title</label>
                <input
                  className="ao-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 17, width: '100%' }}
                />
              </div>
              <div>
                <label className="ao-label">Description</label>
                <textarea
                  className="ao-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                  rows={5}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="ao-label">Marks</label>
                <div style={{
                  padding: 8,
                  background: 'var(--abyss)',
                  border: '1px solid var(--hairline)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      background: 'rgba(var(--gold-rgb, 201,176,120), 0.1)',
                      border: '1px solid rgba(var(--gold-rgb, 201,176,120), 0.3)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--gold)',
                    }}>
                      <Rune kind="diamond-fill" size={5} color="var(--gold)" />
                      {t}
                      <button
                        onClick={() => setTags(tags.filter((_, j) => j !== i))}
                        style={{ marginLeft: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: 0, display: 'flex' }}
                      >
                        <Rune kind="x" size={9} color="currentColor" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="+ add"
                    style={{
                      flex: 1,
                      minWidth: 60,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--ink)',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      padding: '2px 4px',
                    }}
                  />
                </div>
              </div>
            </div>
          </OrdoPanel>

          {/* Lifecycle */}
          <OrdoPanel padding={0} frame>
            <PanelHeader title="Lifecycle" glyph="sigil-1" sub={`actions available in ${pkg.status}`} />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isDraft && (
                <button
                  className="ao-btn ao-btn--primary ao-btn--block"
                  onClick={() => setShowPublish(true)}
                  disabled={publishMutation.isPending}
                >
                  <Rune kind="diamond-fill" size={10} /> Seal &amp; Publish (v {pkg.version + 1})
                </button>
              )}
              <button
                className="ao-btn ao-btn--block"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Rune kind="diamond" size={10} /> Save as Draft
              </button>
              <button
                className="ao-btn ao-btn--ghost ao-btn--block"
                onClick={() => navigate(`/gm/homebrew/marketplace/${pkg.id}`)}
              >
                <Rune kind="book" size={10} /> Preview as Reader
              </button>
              <button
                className="ao-btn ao-btn--danger ao-btn--block"
                onClick={() => setShowDelete(true)}
                disabled={deleteMutation.isPending}
              >
                <Rune kind="flame" size={10} /> Redact (Soft Delete)
              </button>
            </div>
          </OrdoPanel>
        </div>

        {/* RIGHT column: Content Folio */}
        <OrdoPanel padding={0} frame>
          <PanelHeader
            title="Content Folio"
            glyph="book"
            sub={`${s.itemTypeCount} items \u00b7 ${s.classCount} classes \u00b7 ${s.skillCount} skills \u00b7 ${s.featCount} feats`}
            right={
              <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => setAdding(!adding)}>
                <Rune kind="plus" size={10} /> {adding ? 'Close' : 'Slot New Entry'}
              </button>
            }
          />

          {/* Add panel */}
          {adding && (
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}>
              <div className="ao-overline" style={{ marginBottom: 8 }}>Slot a content reference</div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'center', marginBottom: 10 }}>
                <select
                  className="ao-input"
                  value={addType}
                  onChange={(e) => {
                    setAddType(e.target.value as ContentType);
                    setAddSearch('');
                    resetNewContentForm();
                  }}
                  style={{ padding: '6px 10px' }}
                >
                  <option value="ITEM_TYPE">Item</option>
                  <option value="CHARACTER_CLASS">Class</option>
                  <option value="SKILL">Skill</option>
                  <option value="FEAT">Feat</option>
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`ao-btn ${addMode === 'existing' ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                    onClick={() => setAddMode('existing')}
                    style={{ flex: 1 }}
                  >
                    Existing
                  </button>
                  <button
                    className={`ao-btn ${addMode === 'new' ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                    onClick={() => setAddMode('new')}
                    style={{ flex: 1 }}
                  >
                    Create New
                  </button>
                </div>
              </div>

              {addMode === 'existing' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                    <input
                      className="ao-input"
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Existing content id..."
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddContent(); } }}
                      style={{ padding: '6px 12px' }}
                    />
                    <button className="ao-btn ao-btn--ghost" onClick={() => setAddSearch('')}>
                      <Rune kind="x" size={11} /> Clear
                    </button>
                    <button
                      className="ao-btn ao-btn--primary"
                      onClick={handleAddContent}
                      disabled={!addSearch.trim() || addContentMutation.isPending}
                    >
                      <Rune kind="plus" size={10} /> Slot
                    </button>
                  </div>
                  <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 8 }}>
                    This does not call admin catalogs. Use it only when the backend allows attaching an existing owned or vanilla content id.
                  </p>
                </>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: addType === 'ITEM_TYPE' ? '1fr 180px' : '1fr', gap: 8 }}>
                    <input
                      className="ao-input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="New content name..."
                      style={{ padding: '6px 12px' }}
                    />
                    {addType === 'ITEM_TYPE' && (
                      <select
                        className="ao-input"
                        value={newItemSlot}
                        onChange={(e) => setNewItemSlot(e.target.value as EquipmentSlot)}
                        style={{ padding: '6px 10px' }}
                      >
                        {EQUIPMENT_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {EQUIPMENT_SLOT_LABELS[slot]}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <textarea
                    className="ao-input"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description..."
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />

                  {addType === 'SKILL' && (
                    <input
                      className="ao-input"
                      value={newSkillType}
                      onChange={(e) => setNewSkillType(e.target.value)}
                      placeholder="Skill type (optional)"
                      style={{ padding: '6px 12px' }}
                    />
                  )}

                  {addType === 'FEAT' && (
                    <input
                      className="ao-input"
                      value={newFeatPrerequisites}
                      onChange={(e) => setNewFeatPrerequisites(e.target.value)}
                      placeholder="Prerequisites (optional)"
                      style={{ padding: '6px 12px' }}
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                      Creates the missing {addType.toLowerCase().replace('_', ' ')} and immediately slots it into this doctrine.
                    </p>
                    <button
                      className="ao-btn ao-btn--primary"
                      onClick={handleCreateAndAddContent}
                      disabled={!newName.trim() || creatingContent || addContentMutation.isPending}
                    >
                      <Rune kind="plus" size={10} /> Create &amp; Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content groups */}
          {CONTENT_GROUPS.map((grp) => {
            const rows = contentByType[grp.type] || [];
            return (
              <div key={grp.type}>
                {/* Section header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  background: 'var(--abyss)',
                  borderTop: '1px solid var(--rule)',
                  borderBottom: '1px solid var(--rule)',
                }}>
                  <Rune kind={grp.icon} size={13} color="var(--gold)" />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-bright)' }}>{grp.title}</span>
                  <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>&middot; {rows.length}</span>
                  <span style={{ flex: 1 }} />
                  <span className="ao-codex" style={{ color: 'var(--ink-ghost)', fontSize: 9 }}>drag to reorder</span>
                </div>

                {rows.length === 0 ? (
                  <div className="ao-italic" style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
                    No {grp.title.toLowerCase()} slotted yet.
                  </div>
                ) : (
                  rows.map((r) => (
                    <div key={r.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--hairline)',
                    }}>
                      {/* Drag handle */}
                      <Rune kind="dots" size={14} color="var(--ink-ghost)" />

                      {/* Icon slot */}
                      <div className="ao-slot ao-slot--epic" style={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Rune kind={grp.icon} size={16} color="var(--gold)" />
                      </div>

                      {/* Name + description */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 15, color: 'var(--ink-bright)' }}>
                          {r.name}
                        </div>
                        <div className="ao-codex" style={{
                          color: 'var(--ink-faint)',
                          fontSize: 11,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {r.description ? r.description.substring(0, 80) : '\u2014'}
                          {r.slot && ` \u00b7 ${r.slot}`}
                          {r.skillType && ` \u00b7 ${r.skillType}`}
                          {r.prerequisites && ` \u00b7 req: ${r.prerequisites}`}
                        </div>
                      </div>

                      {/* Book button */}
                      <button className="ao-iconbtn" style={{ width: 28, height: 28 }} title="View">
                        <Rune kind="book" size={12} />
                      </button>

                      {/* Remove button */}
                      <button
                        className="ao-iconbtn"
                        style={{ width: 28, height: 28, color: 'var(--ember)' }}
                        onClick={() => handleRemoveContent(r.id)}
                        title="Remove"
                      >
                        <Rune kind="x" size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </OrdoPanel>
      </div>

      {/* Publish dialog */}
      <AlertDialog open={showPublish} onOpenChange={setShowPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seal &amp; Publish Doctrine?</AlertDialogTitle>
            <AlertDialogDescription>
              Once sealed, &ldquo;{pkg.title}&rdquo; shall be entered into the Forbidden Catalogue and made visible to all. The version shall advance to v{pkg.version + 1}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Defer</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>Seal &amp; Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redact Doctrine?</AlertDialogTitle>
            <AlertDialogDescription>
              The doctrine will be marked as deleted. GMs who already instated it will retain their reference. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Redact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
