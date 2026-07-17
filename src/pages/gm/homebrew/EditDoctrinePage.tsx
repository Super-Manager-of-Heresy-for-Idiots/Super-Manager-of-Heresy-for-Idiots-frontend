import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';
import { Rune, OrdoPanel, OrdoChip, PanelHeader } from '@/components/ordo';
import { HomebrewClassBuilder } from '@/features/class-builder/HomebrewClassBuilder';
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
  useAttachableContent,
  useRemoveContent,
  usePublishHomebrew,
  useDeleteHomebrew,
} from '@/hooks/useHomebrew';
import { useStatTypes } from '@/hooks/useAdmin';
import { homebrewApi } from '@/api/homebrew.api';
import { homebrewItemsApi } from '@/api/homebrew-items.api';
import { homebrewSpellsApi } from '@/api/homebrew-spells.api';
import { ImageUploadField } from '@/components/media/ImageUploadField';
import { ItemModal } from './ItemModal';
import { SpellModal } from './SpellModal';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOTS } from '@/types';
import type { ContentSummaryDto, ContentType, EquipmentSlot } from '@/types';
import s from './EditDoctrinePage.module.css';

// Иконки типов контента в браузируемом пикере «существующее».
const ADD_TYPE_ICON: Record<string, string> = {
  ITEM_TYPE: 'sword',
  SKILL: 'eye',
  FEAT: 'sigil-3',
  BUFF_DEBUFF: 'hex',
  BACKGROUND: 'book',
  CUSTOM_RESOURCE: 'flame',
  SPELL: 'sigil-1',
};

// P1-6: типы с полным CRUD сущности (kind в пути DELETE/PUT).
type CrudKind = 'item-types' | 'skills' | 'feats' | 'buffs-debuffs';
const CRUD_KIND: Partial<Record<ContentType, CrudKind>> = {
  ITEM_TYPE: 'item-types',
  SKILL: 'skills',
  FEAT: 'feats',
  BUFF_DEBUFF: 'buffs-debuffs',
};

const CONTENT_GROUPS: { titleKey: string; icon: string; type: ContentType }[] = [
  { titleKey: 'hb.edit.groupItems', icon: 'sword', type: 'ITEM_TYPE' },
  { titleKey: 'hb.edit.groupClasses', icon: 'helm', type: 'CHARACTER_CLASS' },
  { titleKey: 'hb.edit.groupSpecies', icon: 'hex', type: 'RACE' },
  { titleKey: 'hb.edit.groupSkills', icon: 'eye', type: 'SKILL' },
  { titleKey: 'hb.edit.groupFeats', icon: 'sigil-3', type: 'FEAT' },
  { titleKey: 'hb.edit.groupSubclasses', icon: 'cross-pat', type: 'SUBCLASS' },
  { titleKey: 'hb.edit.groupBuffs', icon: 'hex', type: 'BUFF_DEBUFF' },
  { titleKey: 'hb.edit.groupItems', icon: 'diamond', type: 'ITEM' },
  { titleKey: 'hb.edit.groupBackgrounds', icon: 'book', type: 'BACKGROUND' },
  { titleKey: 'hb.edit.groupResources', icon: 'flame', type: 'CUSTOM_RESOURCE' },
  { titleKey: 'hb.edit.groupSpells', icon: 'sigil-1', type: 'SPELL' },
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
  // Оптимистичный показ новой обложки сразу после загрузки/удаления, без рефетча.
  const [coverOverride, setCoverOverride] = useState<string | null | undefined>(undefined);

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
  // P2-3: предыстория
  const [newBgSkills, setNewBgSkills] = useState('');
  const [newBgExtras, setNewBgExtras] = useState('');
  // P2-3: ресурс (custom_resource_types)
  const [newCrMaxValue, setNewCrMaxValue] = useState('');
  const [newCrMaxFormula, setNewCrMaxFormula] = useState('');
  const [newCrShortRecovery, setNewCrShortRecovery] = useState('none');
  const [newCrShortFormula, setNewCrShortFormula] = useState('');
  const [newCrLongRecovery, setNewCrLongRecovery] = useState('full');
  const [newCrLongFormula, setNewCrLongFormula] = useState('');
  const [newCrClassId, setNewCrClassId] = useState('');
  const [newDepClassIds, setNewDepClassIds] = useState<string[]>([]);
  const [newDepRaceIds, setNewDepRaceIds] = useState<string[]>([]);
  const [creatingContent, setCreatingContent] = useState(false);
  const [showRichClassWizard, setShowRichClassWizard] = useState(false);
  const [editingRichClass, setEditingRichClass] = useState<ContentSummaryDto | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteEntityTarget, setDeleteEntityTarget] = useState<{ kind: CrudKind | 'items' | 'spells'; id: string; name: string } | null>(null);
  const [deletingEntity, setDeletingEntity] = useState(false);
  const [editingContent, setEditingContent] = useState<{ type: ContentType; id: string } | null>(null);
  const [showMagicItem, setShowMagicItem] = useState(false);
  const [editingMagicItemId, setEditingMagicItemId] = useState<string | null>(null);
  const [duplicatingMagicItemId, setDuplicatingMagicItemId] = useState<string | null>(null);
  const [showSpell, setShowSpell] = useState(false);
  const [editingSpellId, setEditingSpellId] = useState<string | null>(null);
  const [duplicatingSpellId, setDuplicatingSpellId] = useState<string | null>(null);
  const [showRaceEditor, setShowRaceEditor] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
  const [editingRaceSummary, setEditingRaceSummary] = useState<ContentSummaryDto | null>(null);

  const createRaceMutation = useCreateHomebrewRace();
  const updateRaceMutation = useUpdateHomebrewRace();
  const enableRaceMutation = useEnableHomebrewRace();
  const disableRaceMutation = useDisableHomebrewRace();

  // Браузируемый список существующего контента автора для режима «существующее».
  const attachable = useAttachableContent(id, addType, adding && addMode === 'existing');

  if (pkg && !metaLoaded) {
    setTitle(pkg.title);
    setDescription(pkg.description || '');
    setTags(pkg.tags);
    setMetaLoaded(true);
  }

  if (isLoading || !pkg) {
    return (
      <div>
        <div className={s.loadHead}>
          <div>
            <div className="ao-overline">{t('hb.edit.editorOverline')}</div>
            <div className={cn('ao-h3', s.loadTitle)}>{t('hb.edit.loading')}</div>
          </div>
        </div>
        <div className={s.loadList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={cn('ao-ph', s.loadPh)} />
          ))}
        </div>
      </div>
    );
  }

  const isDraft = pkg.status === 'DRAFT';
  const cs = pkg.contentSummary;
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

  const handleAttachExisting = (contentId: string) => {
    addContentMutation.mutate(
      { packageId: pkg.id, data: { contentType: addType, contentId } },
    );
  };

  const attachableQuery = addSearch.trim().toLowerCase();
  const filteredAttachable = (attachable.data ?? []).filter((it) =>
    !attachableQuery || it.name.toLowerCase().includes(attachableQuery),
  );

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
    setNewBgSkills('');
    setNewBgExtras('');
    setNewCrMaxValue('');
    setNewCrMaxFormula('');
    setNewCrShortRecovery('none');
    setNewCrShortFormula('');
    setNewCrLongRecovery('full');
    setNewCrLongFormula('');
    setNewCrClassId('');
    setNewDepClassIds([]);
    setNewDepRaceIds([]);
    setEditingContent(null);
  };

  const handleCreateAndAddContent = async () => {
    const name = newName.trim();
    if (!name) return;

    setCreatingContent(true);
    try {
      const description = newDescription.trim() || undefined;

      const editId = editingContent?.id;
      const depIds = {
        classIds: newDepClassIds.length > 0 ? newDepClassIds : undefined,
        raceIds: newDepRaceIds.length > 0 ? newDepRaceIds : undefined,
      };
      if (addType === 'ITEM_TYPE') {
        const body = { name, description, slot: newItemSlot };
        if (editId) await homebrewApi.updatePackageItemType(pkg.id, editId, body);
        else await homebrewApi.createPackageItemType(pkg.id, body);
      } else if (addType === 'SKILL') {
        const body = { name, description, skillType: newSkillType.trim() || undefined, ...depIds };
        if (editId) await homebrewApi.updatePackageSkill(pkg.id, editId, body);
        else await homebrewApi.createPackageSkill(pkg.id, body);
      } else if (addType === 'FEAT') {
        const body = { name, description, prerequisites: newFeatPrerequisites.trim() || undefined, ...depIds };
        if (editId) await homebrewApi.updatePackageFeat(pkg.id, editId, body);
        else await homebrewApi.createPackageFeat(pkg.id, body);
      } else if (addType === 'BUFF_DEBUFF') {
        const body = {
          name,
          description,
          effectType: newBuffEffectType,
          targetStatId: newBuffEffectType === 'STAT_MODIFIER' ? newBuffTargetStatId || undefined : undefined,
          modifierValue: newBuffModifierValue ? Number(newBuffModifierValue) : undefined,
          durationRounds: newBuffDurationRounds ? Number(newBuffDurationRounds) : undefined,
          isBuff: newBuffIsBuff === 'true',
          ...depIds,
        };
        if (editId) await homebrewApi.updatePackageBuffDebuff(pkg.id, editId, body);
        else await homebrewApi.createPackageBuffDebuff(pkg.id, body);
      } else if (addType === 'BACKGROUND') {
        const skillProficiencyNames = newBgSkills
          .split(',').map((x) => x.trim()).filter(Boolean);
        await homebrewApi.createPackageBackground(pkg.id, {
          name,
          description,
          skillProficiencyNames: skillProficiencyNames.length > 0 ? skillProficiencyNames : undefined,
          grantedExtras: newBgExtras.trim() || undefined,
        });
      } else if (addType === 'CUSTOM_RESOURCE') {
        await homebrewApi.createPackageCustomResource(pkg.id, {
          name,
          description,
          maxValue: newCrMaxValue ? Number(newCrMaxValue) : undefined,
          maxFormula: newCrMaxFormula.trim() || undefined,
          shortRestRecovery: newCrShortRecovery,
          shortRestFormula: newCrShortRecovery === 'formula' ? (newCrShortFormula.trim() || undefined) : undefined,
          longRestRecovery: newCrLongRecovery,
          longRestFormula: newCrLongRecovery === 'formula' ? (newCrLongFormula.trim() || undefined) : undefined,
          classBoundId: newCrClassId || undefined,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', pkg.id] });
      const wasEdit = !!editId;
      resetNewContentForm();
      toast.success(wasEdit ? t('hb.edit.toastUpdated') : t('hb.edit.toastCreated'));
    } catch {
      toast.error(t('hb.edit.toastFailed'));
    } finally {
      setCreatingContent(false);
    }
  };

  const handleRemoveContent = (contentItemId: string) => {
    removeContentMutation.mutate({ packageId: pkg.id, contentItemId });
  };

  const startEditContent = (type: ContentType, row: ContentSummaryDto) => {
    setAddType(type);
    setAddMode('new');
    setAdding(true);
    setEditingContent({ type, id: row.id });
    setNewName(row.name);
    setNewDescription(row.description ?? '');
    setNewItemSlot((row.slot as EquipmentSlot) || 'MAIN_HAND');
    setNewSkillType(row.skillType ?? '');
    setNewFeatPrerequisites(row.prerequisites ?? '');
    setNewBuffEffectType(row.effectType ?? 'STAT_MODIFIER');
    setNewBuffTargetStatId(row.targetStatId ?? '');
    setNewBuffModifierValue(row.modifierValue != null ? String(row.modifierValue) : '');
    setNewBuffDurationRounds(row.durationRounds != null ? String(row.durationRounds) : '');
    setNewBuffIsBuff(row.isBuff === false ? 'false' : 'true');
    setNewDepClassIds([]);
    setNewDepRaceIds([]);
  };

  const handleDeleteEntity = async () => {
    if (!deleteEntityTarget) return;
    setDeletingEntity(true);
    try {
      if (deleteEntityTarget.kind === 'items') {
        await homebrewItemsApi.remove(pkg.id, deleteEntityTarget.id);
      } else if (deleteEntityTarget.kind === 'spells') {
        await homebrewSpellsApi.remove(pkg.id, deleteEntityTarget.id);
      } else {
        await homebrewApi.deletePackageEntity(pkg.id, deleteEntityTarget.kind, deleteEntityTarget.id);
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', pkg.id] });
      setDeleteEntityTarget(null);
      toast.success(t('hb.edit.entityDeleted'));
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      toast.error(status === 409 ? t('hb.edit.entityInUse') : t('hb.edit.toastFailed'));
    } finally {
      setDeletingEntity(false);
    }
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
      <div className={s.topBar}>
        <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => navigate('/gm/homebrew/my')}>
          <Rune kind="arrow-l" size={11} /> {t('hb.edit.workshop')}
        </button>
        <div className={s.topRight}>
          <OrdoChip tone={isDraft ? 'rune' : 'gold'}>{pkg.status}</OrdoChip>
        </div>
      </div>

      <div className={cn('ao-codex', s.codexLine)}>
        {pkg.id.substring(0, 8)} &middot; {pkg.title} &middot; {pkg.status}
      </div>

      {/* Two-column grid */}
      <div className={cn('ao-rgrid', s.grid)}>
        {/* LEFT column */}
        <div className={s.leftCol}>
          {/* Outer Inscription */}
          <OrdoPanel padding={0} frame>
            <PanelHeader title={t('hb.edit.outerInscription')} glyph="scroll" sub={t('hb.edit.outerSub')} />
            <div className={s.panelBody}>
              <div>
                <label className="ao-label">{t('hb.edit.titleLabel')}</label>
                <input
                  className={cn('ao-input', s.titleInput)}
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                />
              </div>
              <div>
                <label className="ao-label">Обложка</label>
                <ImageUploadField
                  ownerType="HOMEBREW_COVER"
                  ownerId={pkg.id}
                  value={coverOverride !== undefined ? coverOverride : (pkg.coverUrl ?? null)}
                  canEdit={pkg.status === 'DRAFT' || pkg.status === 'PUBLISHED'}
                  onChange={setCoverOverride}
                  alt={pkg.title}
                  placeholder="Нет обложки"
                  previewClassName={s.coverPreview}
                />
              </div>
              <div>
                <label className="ao-label">{t('hb.edit.descriptionLabel')}</label>
                <textarea
                  className={cn('ao-input', s.descInput)}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
                  rows={5}
                />
              </div>
              <div>
                <label className="ao-label">{t('hb.edit.marksLabel')}</label>
                <div className={s.tagBox}>
                  {tags.map((tag, i) => (
                    <span key={i} className={s.tag}>
                      <Rune kind="diamond-fill" size={5} color="var(--gold)" />
                      {tag}
                      <button
                        onClick={() => setTags(tags.filter((_, j) => j !== i))}
                        className={s.tagRemove}
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
                    className={s.tagInput}
                  />
                </div>
              </div>
            </div>
          </OrdoPanel>

          {/* Lifecycle */}
          <OrdoPanel padding={0} frame>
            <PanelHeader title={t('hb.edit.lifecycle')} glyph="sigil-1" sub={t('hb.edit.actionsIn', { status: pkg.status })} />
            <div className={s.lifecycleBody}>
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
            sub={t('hb.edit.folioSub', { items: cs.itemTypeCount ?? 0, classes: cs.classCount ?? 0, skills: cs.skillCount ?? 0, feats: cs.featCount ?? 0 })}
            right={
              <div className={s.folioActions}>
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
                  onClick={() => { setEditingMagicItemId(null); setDuplicatingMagicItemId(null); setShowMagicItem(true); }}
                >
                  <Rune kind="diamond" size={10} /> {t('hb.item.item')}
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => { setEditingSpellId(null); setDuplicatingSpellId(null); setShowSpell(true); }}
                >
                  <Rune kind="sigil-1" size={10} /> {t('hb.spell.spell')}
                </button>
                <button
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => navigate(`/gm/homebrew/${pkg.id}/bestiary`)}
                >
                  <Rune kind="sword" size={10} /> {t('hb.edit.bestiary')}
                </button>
                <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={() => { const next = !adding; setAdding(next); if (!next) resetNewContentForm(); }}>
                  <Rune kind="plus" size={10} /> {adding ? t('hb.edit.close') : t('hb.edit.slotNewEntry')}
                </button>
              </div>
            }
          />

          {/* Add panel */}
          {adding && (
            <div className={s.addPanel}>
              <div className={cn('ao-overline', s.addOverline)}>{t('hb.edit.slotContentReference')}</div>
              <div className={cn('ao-rgrid', s.addTypeRow)}>
                <select
                  className={cn('ao-input', s.inputSm)}
                  value={addType}
                  onChange={(e) => {
                    setAddType(e.target.value as ContentType);
                    setAddSearch('');
                    resetNewContentForm();
                  }}
                >
                  <option value="ITEM_TYPE">{t('hb.edit.optItem')}</option>
                  <option value="SKILL">{t('hb.edit.optSkill')}</option>
                  <option value="FEAT">{t('hb.edit.optFeat')}</option>
                  <option value="BUFF_DEBUFF">{t('hb.edit.optBuffDebuff')}</option>
                  <option value="BACKGROUND">{t('hb.edit.optBackground')}</option>
                  <option value="CUSTOM_RESOURCE">{t('hb.edit.optResource')}</option>
                </select>
                <div className={s.modeRow}>
                  <button
                    className={cn('ao-btn', addMode === 'existing' ? 'ao-btn--primary' : 'ao-btn--ghost', s.modeBtn)}
                    onClick={() => { setAddMode('existing'); setEditingContent(null); }}
                    disabled={!!editingContent}
                  >
                    {t('hb.edit.existing')}
                  </button>
                  <button
                    className={cn('ao-btn', addMode === 'new' ? 'ao-btn--primary' : 'ao-btn--ghost', s.modeBtn)}
                    onClick={() => { if (editingContent) resetNewContentForm(); setAddMode('new'); }}
                  >
                    {t('hb.edit.createNew')}
                  </button>
                </div>
              </div>

              {addMode === 'existing' ? (
                <div className={s.pickWrap}>
                  <div className={s.pickSearchRow}>
                    <Rune kind="search" size={13} color="var(--ink-faint)" />
                    <input
                      className={s.pickSearch}
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder={t('hb.edit.existingSearchPlaceholder')}
                    />
                  </div>
                  {attachable.isLoading ? (
                    <div className={cn('ao-italic', s.pickEmpty)}>{t('hb.edit.loading')}</div>
                  ) : attachable.isError ? (
                    <div className={cn('ao-italic', s.pickEmpty)}>
                      {t('hb.edit.existingError')}{' '}
                      <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => attachable.refetch()}>
                        {t('common.retry')}
                      </button>
                    </div>
                  ) : filteredAttachable.length === 0 ? (
                    <div className={cn('ao-italic', s.pickEmpty)}>{t('hb.edit.existingEmpty')}</div>
                  ) : (
                    <div className={s.pickList}>
                      {filteredAttachable.map((it) => (
                        <button
                          key={it.contentId}
                          type="button"
                          className={s.pickCard}
                          disabled={addContentMutation.isPending}
                          onClick={() => handleAttachExisting(it.contentId)}
                        >
                          <div className={cn('ao-slot ao-slot--epic', s.iconSlot)}>
                            <Rune kind={ADD_TYPE_ICON[addType] || 'diamond'} size={15} color="var(--gold)" />
                          </div>
                          <div className={s.pickCardMain}>
                            <div className={s.pickCardName}>{it.name}</div>
                            <div className={cn('ao-codex', s.pickCardDesc)}>
                              {it.description ? it.description.substring(0, 90) : '—'}
                            </div>
                            <div className={cn('ao-codex', s.pickCardSrc)}>
                              <Rune kind="book" size={9} color="var(--ink-faint)" /> {t('hb.edit.existingFrom')} {it.sourcePackageTitle}
                            </div>
                          </div>
                          <Rune kind="plus" size={12} color="var(--gold-pale)" />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className={cn('ao-italic', s.existHint)}>{t('hb.edit.existingBrowseHint')}</p>
                </div>
              ) : (
                <div className={s.newGrid}>
                  <div className={cn('ao-rgrid', s.newNameRow)} style={{ gridTemplateColumns: addType === 'ITEM_TYPE' ? '1fr 180px' : '1fr' }}>
                    <input
                      className={cn('ao-input', s.inputSm2)}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t('hb.edit.newNamePlaceholder')}
                    />
                    {addType === 'ITEM_TYPE' && (
                      <select
                        className={cn('ao-input', s.inputSm)}
                        value={newItemSlot}
                        onChange={(e) => setNewItemSlot(e.target.value as EquipmentSlot)}
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
                    className={cn('ao-input', s.descInput)}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder={t('hb.edit.descriptionPlaceholder')}
                    rows={3}
                  />

                  {addType === 'SKILL' && (
                    <input
                      className={cn('ao-input', s.inputSm2)}
                      value={newSkillType}
                      onChange={(e) => setNewSkillType(e.target.value)}
                      placeholder={t('hb.edit.skillTypePlaceholder')}
                    />
                  )}

                  {addType === 'FEAT' && (
                    <input
                      className={cn('ao-input', s.inputSm2)}
                      value={newFeatPrerequisites}
                      onChange={(e) => setNewFeatPrerequisites(e.target.value)}
                      placeholder={t('hb.edit.prerequisitesPlaceholder')}
                    />
                  )}

                  {addType === 'BUFF_DEBUFF' && (
                    <div className={s.buffGrid}>
                      <div className={cn('ao-rgrid', s.buffPair)}>
                        <select
                          className={cn('ao-input', s.inputSm)}
                          value={newBuffEffectType}
                          onChange={(e) => setNewBuffEffectType(e.target.value)}
                        >
                          <option value="STAT_MODIFIER">{t('hb.edit.effStatModifier')}</option>
                          <option value="CONDITION">{t('hb.edit.effCondition')}</option>
                          <option value="DAMAGE_OVER_TIME">{t('hb.edit.effDamageOverTime')}</option>
                          <option value="HEAL_OVER_TIME">{t('hb.edit.effHealOverTime')}</option>
                          <option value="IMMUNITY">{t('hb.edit.effImmunity')}</option>
                          <option value="VULNERABILITY">{t('hb.edit.effVulnerability')}</option>
                        </select>
                        <select
                          className={cn('ao-input', s.inputSm)}
                          value={newBuffIsBuff}
                          onChange={(e) => setNewBuffIsBuff(e.target.value)}
                        >
                          <option value="true">{t('hb.edit.buff')}</option>
                          <option value="false">{t('hb.edit.debuff')}</option>
                        </select>
                      </div>
                      {newBuffEffectType === 'STAT_MODIFIER' && (
                        <select
                          className={cn('ao-input', s.inputSm)}
                          value={newBuffTargetStatId}
                          onChange={(e) => setNewBuffTargetStatId(e.target.value)}
                        >
                          <option value="">{t('hb.edit.targetStatPlaceholder')}</option>
                          {(statTypes || []).map((stat) => (
                            <option key={stat.id} value={stat.id}>{stat.name}</option>
                          ))}
                        </select>
                      )}
                      <div className={cn('ao-rgrid', s.buffPair)}>
                        <input
                          className={cn('ao-input', s.inputSm2)}
                          type="number"
                          value={newBuffModifierValue}
                          onChange={(e) => setNewBuffModifierValue(e.target.value)}
                          placeholder={t('hb.edit.modifierPlaceholder')}
                        />
                        <input
                          className={cn('ao-input', s.inputSm2)}
                          type="number"
                          value={newBuffDurationRounds}
                          onChange={(e) => setNewBuffDurationRounds(e.target.value)}
                          placeholder={t('hb.edit.durationPlaceholder')}
                        />
                      </div>
                    </div>
                  )}

                  {addType === 'BACKGROUND' && (
                    <div className={s.buffGrid}>
                      <input
                        className={cn('ao-input', s.inputSm2)}
                        value={newBgSkills}
                        onChange={(e) => setNewBgSkills(e.target.value)}
                        placeholder={t('hb.edit.bgSkillsPlaceholder')}
                      />
                      <textarea
                        className={cn('ao-input', s.inputSm2)}
                        value={newBgExtras}
                        onChange={(e) => setNewBgExtras(e.target.value)}
                        placeholder={t('hb.edit.bgExtrasPlaceholder')}
                        rows={2}
                      />
                    </div>
                  )}

                  {addType === 'CUSTOM_RESOURCE' && (
                    <div className={s.buffGrid}>
                      <div className={cn('ao-rgrid', s.buffPair)}>
                        <input
                          className={cn('ao-input', s.inputSm2)}
                          type="number"
                          value={newCrMaxValue}
                          onChange={(e) => setNewCrMaxValue(e.target.value)}
                          placeholder={t('hb.edit.crMaxValuePlaceholder')}
                        />
                        <input
                          className={cn('ao-input', s.inputSm2)}
                          value={newCrMaxFormula}
                          onChange={(e) => setNewCrMaxFormula(e.target.value)}
                          placeholder={t('hb.edit.crMaxFormulaPlaceholder')}
                        />
                      </div>
                      <div className={cn('ao-rgrid', s.buffPair)}>
                        <select
                          className={cn('ao-input', s.inputSm)}
                          value={newCrShortRecovery}
                          onChange={(e) => setNewCrShortRecovery(e.target.value)}
                        >
                          <option value="none">{t('hb.edit.crShortNone')}</option>
                          <option value="full">{t('hb.edit.crShortFull')}</option>
                          <option value="formula">{t('hb.edit.crShortFormula')}</option>
                        </select>
                        {newCrShortRecovery === 'formula' && (
                          <input
                            className={cn('ao-input', s.inputSm2)}
                            value={newCrShortFormula}
                            onChange={(e) => setNewCrShortFormula(e.target.value)}
                            placeholder={t('hb.edit.crShortFormulaPlaceholder')}
                          />
                        )}
                      </div>
                      <div className={cn('ao-rgrid', s.buffPair)}>
                        <select
                          className={cn('ao-input', s.inputSm)}
                          value={newCrLongRecovery}
                          onChange={(e) => setNewCrLongRecovery(e.target.value)}
                        >
                          <option value="none">{t('hb.edit.crLongNone')}</option>
                          <option value="full">{t('hb.edit.crLongFull')}</option>
                          <option value="formula">{t('hb.edit.crLongFormula')}</option>
                        </select>
                        {newCrLongRecovery === 'formula' && (
                          <input
                            className={cn('ao-input', s.inputSm2)}
                            value={newCrLongFormula}
                            onChange={(e) => setNewCrLongFormula(e.target.value)}
                            placeholder={t('hb.edit.crLongFormulaPlaceholder')}
                          />
                        )}
                      </div>
                      <select
                        className={cn('ao-input', s.inputSm)}
                        value={newCrClassId}
                        onChange={(e) => setNewCrClassId(e.target.value)}
                      >
                        <option value="">{t('hb.edit.crClassNone')}</option>
                        {(contentByType['CHARACTER_CLASS'] || []).map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(addType === 'SKILL' || addType === 'FEAT' || addType === 'BUFF_DEBUFF') && (
                    <div className={s.depBox}>
                      <div className={cn('ao-overline', s.depTitle)}>{t('hb.edit.depTitle')}</div>
                      <p className={cn('ao-italic', s.depHint)}>{t('hb.edit.depHint')}</p>
                      <div>
                        <label className="ao-label">{t('hb.edit.depClasses')}</label>
                        {(contentByType['CHARACTER_CLASS'] || []).length === 0 ? (
                          <p className={cn('ao-italic', s.depNote)}>{t('hb.edit.depNoClasses')}</p>
                        ) : (
                          <div className={s.chipWrap}>
                            {(contentByType['CHARACTER_CLASS'] || []).map((c) => {
                              const on = newDepClassIds.includes(c.id);
                              return (
                                <button
                                  key={c.id}
                                  type="button"
                                  className={cn(on ? 'ao-chip ao-chip--gold' : 'ao-chip', s.chipBtn)}
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
                          <p className={cn('ao-italic', s.depNote)}>{t('hb.edit.depNoRaces')}</p>
                        ) : (
                          <div className={s.chipWrap}>
                            {(contentByType['RACE'] || []).map((r) => {
                              const on = newDepRaceIds.includes(r.id);
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  className={cn(on ? 'ao-chip ao-chip--gold' : 'ao-chip', s.chipBtn)}
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

                  <div className={s.createRow}>
                    <p className={cn('ao-italic', s.createNote)}>
                      {editingContent ? t('hb.edit.editingEntity') : t('hb.edit.createsMissing', { type: addType.toLowerCase().replace('_', ' ') })}
                    </p>
                    <button
                      className="ao-btn ao-btn--primary"
                      onClick={handleCreateAndAddContent}
                      disabled={!newName.trim() || creatingContent || addContentMutation.isPending}
                    >
                      <Rune kind={editingContent ? 'scroll' : 'plus'} size={10} /> {editingContent ? t('hb.edit.saveEntity') : t('hb.edit.createSlot')}
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
                <div className={s.sectionHead}>
                  <Rune kind={grp.icon} size={13} color="var(--gold)" />
                  <span className={s.sectionTitle}>{t(grp.titleKey)}</span>
                  <span className={cn('ao-codex', s.sectionCount)}>&middot; {rows.length}</span>
                  <span className={s.grow} />
                  <span className={cn('ao-codex', s.sectionHint)}>{t('hb.edit.dragToReorder')}</span>
                </div>

                {rows.length === 0 ? (
                  <div className={cn('ao-italic', s.emptyRow)}>
                    {t('hb.edit.noneSlotted', { label: t(grp.titleKey).toLowerCase() })}
                  </div>
                ) : (
                  rows.map((r) => (
                    <div key={r.id} className={s.contentRow}>
                      {/* Drag handle */}
                      <Rune kind="dots" size={14} color="var(--ink-ghost)" />

                      {/* Icon slot */}
                      <div className={cn('ao-slot ao-slot--epic', s.iconSlot)}>
                        <Rune kind={grp.icon} size={16} color="var(--gold)" />
                      </div>

                      {/* Name + description */}
                      <div className={s.rowMain}>
                        <div className={s.rowName}>
                          {r.name}
                        </div>
                        <div className={cn('ao-codex', s.rowDesc)}>
                          {r.description ? r.description.substring(0, 80) : '\u2014'}
                          {r.slot && ` \u00b7 ${r.slot}`}
                          {r.skillType && ` \u00b7 ${r.skillType}`}
                          {r.prerequisites && ` \u00b7 ${t('hb.edit.req')}: ${r.prerequisites}`}
                        </div>
                      </div>

                      {/* Book / Edit button */}
                      <button
                        className={cn('ao-iconbtn', s.iconBtnSm)}
                        title={grp.type === 'CHARACTER_CLASS' ? t('hb.edit.editRichClass') : grp.type === 'RACE' ? t('hb.edit.editSpecies') : (CRUD_KIND[grp.type] || grp.type === 'ITEM' || grp.type === 'SPELL') ? t('hb.edit.editEntity') : t('hb.edit.view')}
                        onClick={() => {
                          if (grp.type === 'CHARACTER_CLASS') {
                            setEditingRichClass(r);
                            setShowRichClassWizard(true);
                          } else if (grp.type === 'RACE') {
                            handleOpenEditRace(r);
                          } else if (grp.type === 'ITEM') {
                            setDuplicatingMagicItemId(null);
                            setEditingMagicItemId(r.id);
                            setShowMagicItem(true);
                          } else if (grp.type === 'SPELL') {
                            setDuplicatingSpellId(null);
                            setEditingSpellId(r.id);
                            setShowSpell(true);
                          } else if (CRUD_KIND[grp.type]) {
                            startEditContent(grp.type, r);
                          }
                        }}
                      >
                        <Rune kind={(CRUD_KIND[grp.type] || grp.type === 'ITEM' || grp.type === 'SPELL') ? 'scroll' : 'book'} size={12} />
                      </button>
                      {grp.type === 'RACE' && (
                        <button
                          className={cn('ao-iconbtn', s.iconBtnSm)}
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

                      {/* Дублировать / создать на основе (HB_MODES Ф1 DERIVED) — для предметов и заклинаний */}
                      {(grp.type === 'ITEM' || grp.type === 'SPELL') && (
                        <button
                          className={cn('ao-iconbtn', s.iconBtnSm)}
                          title={t('hb.edit.duplicateEntity')}
                          onClick={() => {
                            if (grp.type === 'ITEM') {
                              setEditingMagicItemId(null);
                              setDuplicatingMagicItemId(r.id);
                              setShowMagicItem(true);
                            } else {
                              setEditingSpellId(null);
                              setDuplicatingSpellId(r.id);
                              setShowSpell(true);
                            }
                          }}
                        >
                          <Copy size={12} />
                        </button>
                      )}

                      {/* Remove / delete-entity button (P1-6) */}
                      <button
                        className={cn('ao-iconbtn', s.iconBtnSm, s.ember)}
                        onClick={() => {
                          const kind = CRUD_KIND[grp.type];
                          if (kind) setDeleteEntityTarget({ kind, id: r.id, name: r.name });
                          else if (grp.type === 'ITEM') setDeleteEntityTarget({ kind: 'items', id: r.id, name: r.name });
                          else if (grp.type === 'SPELL') setDeleteEntityTarget({ kind: 'spells', id: r.id, name: r.name });
                          else handleRemoveContent(r.id);
                        }}
                        title={(CRUD_KIND[grp.type] || grp.type === 'ITEM' || grp.type === 'SPELL') ? t('hb.edit.deleteEntity') : t('hb.edit.remove')}
                      >
                        <Rune kind={(CRUD_KIND[grp.type] || grp.type === 'ITEM' || grp.type === 'SPELL') ? 'flame' : 'x'} size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </OrdoPanel>
      </div>

      <HomebrewClassBuilder
        open={showRichClassWizard}
        onOpenChange={(nextOpen) => {
          setShowRichClassWizard(nextOpen);
          if (!nextOpen) setEditingRichClass(null);
        }}
        packageId={pkg.id}
        editingId={editingRichClass?.id}
        onSaved={() => setEditingRichClass(null)}
      />

      <ItemModal
        open={showMagicItem}
        onClose={() => { setShowMagicItem(false); setEditingMagicItemId(null); setDuplicatingMagicItemId(null); }}
        packageId={pkg.id}
        editingId={editingMagicItemId}
        duplicateFromId={duplicatingMagicItemId}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
          queryClient.invalidateQueries({ queryKey: ['homebrew-my', pkg.id] });
        }}
      />

      <SpellModal
        open={showSpell}
        onClose={() => { setShowSpell(false); setEditingSpellId(null); setDuplicatingSpellId(null); }}
        packageId={pkg.id}
        editingId={editingSpellId}
        duplicateFromId={duplicatingSpellId}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
          queryClient.invalidateQueries({ queryKey: ['homebrew-my', pkg.id] });
        }}
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

      {/* Delete content entity (P1-6) */}
      <AlertDialog open={!!deleteEntityTarget} onOpenChange={(o) => !o && setDeleteEntityTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('hb.edit.deleteEntityTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('hb.edit.deleteEntityDesc', { name: deleteEntityTarget?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingEntity}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteEntity(); }}
              disabled={deletingEntity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('hb.edit.deleteEntity')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
