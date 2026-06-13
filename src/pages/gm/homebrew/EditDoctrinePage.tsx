import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Rune, OrdoPanel, OrdoChip, PanelHeader } from '@/components/ordo';
import { ContentPills } from '@/components/homebrew';
import { RichClassWizard } from '@/components/homebrew/RichClassWizard';
import { RaceEditor } from '@/components/admin/RaceEditor';
import {
  useCreateHomebrewRace,
  useUpdateHomebrewRace,
  useEnableHomebrewRace,
  useDisableHomebrewRace,
} from '@/hooks/useRaces';
import type { RaceRequest } from '@/types';
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
import { useStatTypes } from '@/hooks/useAdmin';
import { homebrewApi } from '@/api/homebrew.api';
import { useT } from '@/i18n/I18nContext';
import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOTS } from '@/types';
import type { ContentSummaryDto, ContentType, EquipmentSlot } from '@/types';

const CONTENT_GROUPS: { titleKey: string; icon: string; type: ContentType }[] = [
  { titleKey: 'hb.edit.groupItems', icon: 'sword', type: 'ITEM_TYPE' },
  { titleKey: 'hb.edit.groupClasses', icon: 'helm', type: 'CHARACTER_CLASS' },
  { titleKey: 'hb.edit.groupSpecies', icon: 'hex', type: 'RACE' },
  { titleKey: 'hb.edit.groupSkills', icon: 'eye', type: 'SKILL' },
  { titleKey: 'hb.edit.groupFeats', icon: 'sigil-3', type: 'FEAT' },
  { titleKey: 'hb.edit.groupSubclasses', icon: 'cross-pat', type: 'SUBCLASS' },
  { titleKey: 'hb.edit.groupBuffs', icon: 'hex', type: 'BUFF_DEBUFF' },
];

export default function EditDoctrinePage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: pkg, isLoading } = useMyPackage(id);
  const updateMutation = useUpdateHomebrew();
  const addContentMutation = useAddContent();
  const removeContentMutation = useRemoveContent();
  const publishMutation = usePublishHomebrew();
  const deleteMutation = useDeleteHomebrew();
  const { data: statTypes } = useStatTypes();

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
  const [newBuffEffectType, setNewBuffEffectType] = useState('STAT_MODIFIER');
  const [newBuffTargetStatId, setNewBuffTargetStatId] = useState('');
  const [newBuffModifierValue, setNewBuffModifierValue] = useState('');
  const [newBuffDurationRounds, setNewBuffDurationRounds] = useState('');
  const [newBuffIsBuff, setNewBuffIsBuff] = useState('true');
  const [newDepClassIds, setNewDepClassIds] = useState<string[]>([]);
  const [newDepRaceIds, setNewDepRaceIds] = useState<string[]>([]);
  const [creatingContent, setCreatingContent] = useState(false);
  const [showRichClassWizard, setShowRichClassWizard] = useState(false);
  const [editingRichClass, setEditingRichClass] = useState<ContentSummaryDto | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showRaceEditor, setShowRaceEditor] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editingRaceSummary, setEditingRaceSummary] = useState<ContentSummaryDto | null>(null);

  const createRaceMutation = useCreateHomebrewRace();
  const updateRaceMutation = useUpdateHomebrewRace();
  const enableRaceMutation = useEnableHomebrewRace();
  const disableRaceMutation = useDisableHomebrewRace();

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
            <div className="ao-overline">{t('hb.edit.editorOverline')}</div>
            <div className="ao-h3" style={{ marginTop: 4 }}>{t('hb.edit.loading')}</div>
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
    setNewBuffEffectType('STAT_MODIFIER');
    setNewBuffTargetStatId('');
    setNewBuffModifierValue('');
    setNewBuffDurationRounds('');
    setNewBuffIsBuff('true');
    setNewDepClassIds([]);
    setNewDepRaceIds([]);
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
      } else if (addType === 'SKILL') {
        await homebrewApi.createPackageSkill(pkg.id, {
          name,
          description,
          skillType: newSkillType.trim() || undefined,
          classIds: newDepClassIds.length > 0 ? newDepClassIds : undefined,
          raceIds: newDepRaceIds.length > 0 ? newDepRaceIds : undefined,
        });
      } else if (addType === 'FEAT') {
        await homebrewApi.createPackageFeat(pkg.id, {
          name,
          description,
          prerequisites: newFeatPrerequisites.trim() || undefined,
          classIds: newDepClassIds.length > 0 ? newDepClassIds : undefined,
          raceIds: newDepRaceIds.length > 0 ? newDepRaceIds : undefined,
        });
      } else if (addType === 'BUFF_DEBUFF') {
        await homebrewApi.createPackageBuffDebuff(pkg.id, {
          name,
          description,
          effectType: newBuffEffectType,
          targetStatId: newBuffEffectType === 'STAT_MODIFIER' ? newBuffTargetStatId || undefined : undefined,
          modifierValue: newBuffModifierValue ? Number(newBuffModifierValue) : undefined,
          durationRounds: newBuffDurationRounds ? Number(newBuffDurationRounds) : undefined,
          isBuff: newBuffIsBuff === 'true',
          classIds: newDepClassIds.length > 0 ? newDepClassIds : undefined,
          raceIds: newDepRaceIds.length > 0 ? newDepRaceIds : undefined,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', pkg.id] });
      resetNewContentForm();
      toast.success(t('hb.edit.toastCreated'));
    } catch {
      toast.error(t('hb.edit.toastFailed'));
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

  const handleOpenNewRace = () => {
    setEditingRaceId(null);
    setEditingRaceSummary(null);
    setShowRaceEditor(true);
  };

  const handleOpenEditRace = (row: ContentSummaryDto) => {
    setEditingRaceId(row.id);
    setEditingRaceSummary(row);
    setShowRaceEditor(true);
  };

  const handleSubmitRace = (data: RaceRequest) => {
    if (editingRaceId) {
      updateRaceMutation.mutate(
        { packageId: pkg.id, raceId: editingRaceId, data },
        { onSuccess: () => setShowRaceEditor(false) },
      );
    } else {
      createRaceMutation.mutate(
        { packageId: pkg.id, data },
        { onSuccess: () => setShowRaceEditor(false) },
      );
    }
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
          <Rune kind="arrow-l" size={11} /> {t('hb.edit.workshop')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OrdoChip tone={isDraft ? 'rune' : 'gold'}>{pkg.status}</OrdoChip>
        </div>
      </div>

      <div className="ao-codex" style={{ marginBottom: 16, color: 'var(--ink-faint)' }}>
        {pkg.id.substring(0, 8)} &middot; {pkg.title} &middot; {pkg.status}
      </div>

      {/* Two-column grid */}
      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Outer Inscription */}
          <OrdoPanel padding={0} frame>
            <PanelHeader title={t('hb.edit.outerInscription')} glyph="scroll" sub={t('hb.edit.outerSub')} />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="ao-label">{t('hb.edit.titleLabel')}</label>
                <input
                  className="ao-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 17, width: '100%' }}
                />
              </div>
              <div>
                <label className="ao-label">{t('hb.edit.descriptionLabel')}</label>
                <textarea
                  className="ao-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                  rows={5}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="ao-label">{t('hb.edit.marksLabel')}</label>
                <div style={{
                  padding: 8,
                  background: 'var(--abyss)',
                  border: '1px solid var(--hairline)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                }}>
                  {tags.map((tag, i) => (
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
                      {tag}
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
                    placeholder={t('hb.edit.addPlaceholder')}
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
            <PanelHeader title={t('hb.edit.lifecycle')} glyph="sigil-1" sub={t('hb.edit.actionsIn', { status: pkg.status })} />
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {isDraft && (
                <button
                  className="ao-btn ao-btn--primary ao-btn--block"
                  onClick={() => setShowPublish(true)}
                  disabled={publishMutation.isPending}
                >
                  <Rune kind="diamond-fill" size={10} /> {t('hb.edit.sealPublish', { version: pkg.version + 1 })}
                </button>
              )}
              <button
                className="ao-btn ao-btn--block"
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Rune kind="diamond" size={10} /> {t('hb.edit.saveDraft')}
              </button>
              <button
                className="ao-btn ao-btn--ghost ao-btn--block"
                onClick={() => navigate(`/gm/homebrew/marketplace/${pkg.id}`)}
              >
                <Rune kind="book" size={10} /> {t('hb.edit.previewReader')}
              </button>
              <button
                className="ao-btn ao-btn--danger ao-btn--block"
                onClick={() => setShowDelete(true)}
                disabled={deleteMutation.isPending}
              >
                <Rune kind="flame" size={10} /> {t('hb.edit.redactSoft')}
              </button>
            </div>
          </OrdoPanel>
        </div>

        {/* RIGHT column: Content Folio */}
        <OrdoPanel padding={0} frame>
          <PanelHeader
            title={t('hb.edit.contentFolio')}
            glyph="book"
            sub={t('hb.edit.folioSub', { items: s.itemTypeCount ?? 0, classes: s.classCount ?? 0, skills: s.skillCount ?? 0, feats: s.featCount ?? 0 })}
            right={
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => {
                    setEditingRichClass(null);
                    setShowRichClassWizard(true);
                  }}
                >
                  <Rune kind="helm" size={10} /> {t('hb.edit.richClass')}
                </button>
                <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={handleOpenNewRace}>
                  <Rune kind="hex" size={10} /> {t('hb.edit.species')}
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => navigate(`/gm/homebrew/${pkg.id}/bestiary`)}
                >
                  <Rune kind="sword" size={10} /> {t('hb.edit.bestiary')}
                </button>
                <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => setAdding(!adding)}>
                  <Rune kind="plus" size={10} /> {adding ? t('hb.edit.close') : t('hb.edit.slotNewEntry')}
                </button>
              </div>
            }
          />

          {/* Add panel */}
          {adding && (
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}>
              <div className="ao-overline" style={{ marginBottom: 8 }}>{t('hb.edit.slotContentReference')}</div>
              <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, alignItems: 'center', marginBottom: 10 }}>
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
                  <option value="ITEM_TYPE">{t('hb.edit.optItem')}</option>
                  <option value="SKILL">{t('hb.edit.optSkill')}</option>
                  <option value="FEAT">{t('hb.edit.optFeat')}</option>
                  <option value="BUFF_DEBUFF">{t('hb.edit.optBuffDebuff')}</option>
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`ao-btn ${addMode === 'existing' ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                    onClick={() => setAddMode('existing')}
                    style={{ flex: 1 }}
                  >
                    {t('hb.edit.existing')}
                  </button>
                  <button
                    className={`ao-btn ${addMode === 'new' ? 'ao-btn--primary' : 'ao-btn--ghost'}`}
                    onClick={() => setAddMode('new')}
                    style={{ flex: 1 }}
                  >
                    {t('hb.edit.createNew')}
                  </button>
                </div>
              </div>

              {addMode === 'existing' ? (
                <>
                  <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center' }}>
                    <input
                      className="ao-input"
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder={t('hb.edit.existingIdPlaceholder')}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddContent(); } }}
                      style={{ padding: '6px 12px' }}
                    />
                    <button className="ao-btn ao-btn--ghost" onClick={() => setAddSearch('')}>
                      <Rune kind="x" size={11} /> {t('hb.edit.clear')}
                    </button>
                    <button
                      className="ao-btn ao-btn--primary"
                      onClick={handleAddContent}
                      disabled={!addSearch.trim() || addContentMutation.isPending}
                    >
                      <Rune kind="plus" size={10} /> {t('hb.edit.slot')}
                    </button>
                  </div>
                  <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, marginTop: 8 }}>
                    {t('hb.edit.existingHint')}
                  </p>
                </>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: addType === 'ITEM_TYPE' ? '1fr 180px' : '1fr', gap: 8 }}>
                    <input
                      className="ao-input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t('hb.edit.newNamePlaceholder')}
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
                    placeholder={t('hb.edit.descriptionPlaceholder')}
                    rows={3}
                    style={{ width: '100%', resize: 'vertical' }}
                  />

                  {addType === 'SKILL' && (
                    <input
                      className="ao-input"
                      value={newSkillType}
                      onChange={(e) => setNewSkillType(e.target.value)}
                      placeholder={t('hb.edit.skillTypePlaceholder')}
                      style={{ padding: '6px 12px' }}
                    />
                  )}

                  {addType === 'FEAT' && (
                    <input
                      className="ao-input"
                      value={newFeatPrerequisites}
                      onChange={(e) => setNewFeatPrerequisites(e.target.value)}
                      placeholder={t('hb.edit.prerequisitesPlaceholder')}
                      style={{ padding: '6px 12px' }}
                    />
                  )}

                  {addType === 'BUFF_DEBUFF' && (
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <select
                          className="ao-input"
                          value={newBuffEffectType}
                          onChange={(e) => setNewBuffEffectType(e.target.value)}
                          style={{ padding: '6px 10px' }}
                        >
                          <option value="STAT_MODIFIER">{t('hb.edit.effStatModifier')}</option>
                          <option value="CONDITION">{t('hb.edit.effCondition')}</option>
                          <option value="DAMAGE_OVER_TIME">{t('hb.edit.effDamageOverTime')}</option>
                          <option value="HEAL_OVER_TIME">{t('hb.edit.effHealOverTime')}</option>
                          <option value="IMMUNITY">{t('hb.edit.effImmunity')}</option>
                          <option value="VULNERABILITY">{t('hb.edit.effVulnerability')}</option>
                        </select>
                        <select
                          className="ao-input"
                          value={newBuffIsBuff}
                          onChange={(e) => setNewBuffIsBuff(e.target.value)}
                          style={{ padding: '6px 10px' }}
                        >
                          <option value="true">{t('hb.edit.buff')}</option>
                          <option value="false">{t('hb.edit.debuff')}</option>
                        </select>
                      </div>
                      {newBuffEffectType === 'STAT_MODIFIER' && (
                        <select
                          className="ao-input"
                          value={newBuffTargetStatId}
                          onChange={(e) => setNewBuffTargetStatId(e.target.value)}
                          style={{ padding: '6px 10px' }}
                        >
                          <option value="">{t('hb.edit.targetStatPlaceholder')}</option>
                          {(statTypes || []).map((stat) => (
                            <option key={stat.id} value={stat.id}>{stat.name}</option>
                          ))}
                        </select>
                      )}
                      <div className="ao-rgrid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                          className="ao-input"
                          type="number"
                          value={newBuffModifierValue}
                          onChange={(e) => setNewBuffModifierValue(e.target.value)}
                          placeholder={t('hb.edit.modifierPlaceholder')}
                          style={{ padding: '6px 12px' }}
                        />
                        <input
                          className="ao-input"
                          type="number"
                          value={newBuffDurationRounds}
                          onChange={(e) => setNewBuffDurationRounds(e.target.value)}
                          placeholder={t('hb.edit.durationPlaceholder')}
                          style={{ padding: '6px 12px' }}
                        />
                      </div>
                    </div>
                  )}

                  {(addType === 'SKILL' || addType === 'FEAT' || addType === 'BUFF_DEBUFF') && (
                    <div style={{ border: '1px solid var(--rule)', background: 'rgba(0,0,0,0.18)', padding: 12, display: 'grid', gap: 12 }}>
                      <div className="ao-overline" style={{ color: 'var(--gold-pale)' }}>{t('hb.edit.depTitle')}</div>
                      <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, margin: 0 }}>{t('hb.edit.depHint')}</p>
                      <div>
                        <label className="ao-label">{t('hb.edit.depClasses')}</label>
                        {(contentByType['CHARACTER_CLASS'] || []).length === 0 ? (
                          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, margin: '4px 0 0' }}>{t('hb.edit.depNoClasses')}</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {(contentByType['CHARACTER_CLASS'] || []).map((c) => {
                              const on = newDepClassIds.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  className={on ? 'ao-chip ao-chip--gold' : 'ao-chip'}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setNewDepClassIds(on ? newDepClassIds.filter((x) => x !== c.id) : [...newDepClassIds, c.id])}
                                >
                                  {c.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="ao-label">{t('hb.edit.depRaces')}</label>
                        {(contentByType['RACE'] || []).length === 0 ? (
                          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12, margin: '4px 0 0' }}>{t('hb.edit.depNoRaces')}</p>
                        ) : (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {(contentByType['RACE'] || []).map((r) => {
                              const on = newDepRaceIds.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  className={on ? 'ao-chip ao-chip--gold' : 'ao-chip'}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => setNewDepRaceIds(on ? newDepRaceIds.filter((x) => x !== r.id) : [...newDepRaceIds, r.id])}
                                >
                                  {r.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                    <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>
                      {t('hb.edit.createsMissing', { type: addType.toLowerCase().replace('_', ' ') })}
                    </p>
                    <button
                      className="ao-btn ao-btn--primary"
                      onClick={handleCreateAndAddContent}
                      disabled={!newName.trim() || creatingContent || addContentMutation.isPending}
                    >
                      <Rune kind="plus" size={10} /> {t('hb.edit.createSlot')}
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
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink-bright)' }}>{t(grp.titleKey)}</span>
                  <span className="ao-codex" style={{ color: 'var(--ink-faint)' }}>&middot; {rows.length}</span>
                  <span style={{ flex: 1 }} />
                  <span className="ao-codex" style={{ color: 'var(--ink-ghost)', fontSize: 9 }}>{t('hb.edit.dragToReorder')}</span>
                </div>

                {rows.length === 0 ? (
                  <div className="ao-italic" style={{ padding: '16px', textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
                    {t('hb.edit.noneSlotted', { label: t(grp.titleKey).toLowerCase() })}
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
                          {r.prerequisites && ` \u00b7 ${t('hb.edit.req')}: ${r.prerequisites}`}
                        </div>
                      </div>

                      {/* Book / Edit button */}
                      <button
                        className="ao-iconbtn"
                        style={{ width: 28, height: 28 }}
                        title={grp.type === 'CHARACTER_CLASS' ? t('hb.edit.editRichClass') : grp.type === 'RACE' ? t('hb.edit.editSpecies') : t('hb.edit.view')}
                        onClick={() => {
                          if (grp.type === 'CHARACTER_CLASS') {
                            setEditingRichClass(r);
                            setShowRichClassWizard(true);
                          } else if (grp.type === 'RACE') {
                            handleOpenEditRace(r);
                          }
                        }}
                      >
                        <Rune kind="book" size={12} />
                      </button>
                      {grp.type === 'RACE' && (
                        <button
                          className="ao-iconbtn"
                          style={{ width: 28, height: 28 }}
                          title={t('hb.edit.toggleActive')}
                          onClick={() => {
                            const active = (r as { active?: boolean }).active !== false;
                            if (active) {
                              disableRaceMutation.mutate({ packageId: pkg.id, raceId: r.id });
                            } else {
                              enableRaceMutation.mutate({ packageId: pkg.id, raceId: r.id });
                            }
                          }}
                        >
                          <Rune kind="sigil-1" size={12} />
                        </button>
                      )}

                      {/* Remove button */}
                      <button
                        className="ao-iconbtn"
                        style={{ width: 28, height: 28, color: 'var(--ember)' }}
                        onClick={() => handleRemoveContent(r.id)}
                        title={t('hb.edit.remove')}
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

      <RichClassWizard
        open={showRichClassWizard}
        onOpenChange={(nextOpen) => {
          setShowRichClassWizard(nextOpen);
          if (!nextOpen) setEditingRichClass(null);
        }}
        packageDetail={pkg}
        editingClass={editingRichClass}
      />

      <RaceEditor
        open={showRaceEditor}
        onClose={() => setShowRaceEditor(false)}
        onSubmit={handleSubmitRace}
        isSubmitting={createRaceMutation.isPending || updateRaceMutation.isPending}
        scope={{ kind: 'homebrew', packageId: pkg.id, packageTitle: pkg.title }}
        initial={
          editingRaceSummary
            ? {
                id: editingRaceSummary.id,
                name: editingRaceSummary.name,
                description: editingRaceSummary.description,
                sourceType: 'HOMEBREW',
                active: true,
                creatureType: 'HUMANOID',
                sizeOptions: ['MEDIUM'],
                defaultSize: 'MEDIUM',
                speed: { walk: 30 },
                traits: [],
                lineageOptions: [],
                lineageRequired: false,
                languages: [],
                proficiencies: [],
                resistances: [],
                vulnerabilities: [],
                immunities: [],
                conditionResistances: [],
                conditionAdvantages: [],
                allowAbilityScoreBonuses: false,
                abilityScoreBonuses: [],
              }
            : null
        }
      />

      {/* Publish dialog */}
      <AlertDialog open={showPublish} onOpenChange={setShowPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hb.edit.publishTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hb.edit.publishDescription', { title: pkg.title, version: pkg.version + 1 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('hb.edit.defer')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>{t('hb.edit.sealPublishAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hb.edit.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hb.edit.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('hb.edit.redactAction')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
