import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rune, EmptyVault, OrdoField } from '@/components/ordo';
import {
  useMyBlueprintDetail,
  useCreateBlueprint,
  useUpdateBlueprint,
  useSaveBlueprintNpc,
  useDeleteBlueprintNpc,
  useSaveBlueprintQuest,
  useDeleteBlueprintQuest,
  useSaveBlueprintLocation,
  useDeleteBlueprintLocation,
  useAttachBlueprintHomebrew,
  useDetachBlueprintHomebrew,
  useLinkBlueprintCharacter,
  useUnlinkBlueprintCharacter,
} from '@/hooks/useCampaignBlueprints';
import { useUniverses } from '@/hooks/useUniverses';
import { useHomebrewLibrary } from '@/hooks/useHomebrewCampaign';
import { useMyTemplates } from '@/hooks/useTemplates';
import { CreateUniverseModal } from './CreateUniverseModal';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { QuestStatus } from '@/types';
import s from './blueprints.module.css';

type TabId = 'lore' | 'universe' | 'homebrew' | 'npcs' | 'quests' | 'locations' | 'characters';

const TABS: { id: TabId; labelKey: string; metaOnly: boolean }[] = [
  { id: 'lore', labelKey: 'bp.tab.lore', metaOnly: true },
  { id: 'universe', labelKey: 'bp.tab.universe', metaOnly: true },
  { id: 'homebrew', labelKey: 'bp.tab.homebrew', metaOnly: false },
  { id: 'npcs', labelKey: 'bp.tab.npcs', metaOnly: false },
  { id: 'quests', labelKey: 'bp.tab.quests', metaOnly: false },
  { id: 'locations', labelKey: 'bp.tab.locations', metaOnly: false },
  { id: 'characters', labelKey: 'bp.tab.characters', metaOnly: false },
];

const QUEST_STATUSES: QuestStatus[] = ['ACTIVE', 'COMPLETED', 'FAILED', 'HIDDEN', 'ARCHIVED'];

export default function BlueprintEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const t = useT();
  const navigate = useNavigate();

  const { data: bp, isLoading, error, refetch } = useMyBlueprintDetail(id);
  const createMutation = useCreateBlueprint();
  const updateMutation = useUpdateBlueprint();

  const { data: universes } = useUniverses();
  const { data: library } = useHomebrewLibrary();
  const { data: templates } = useMyTemplates();

  const saveNpc = useSaveBlueprintNpc();
  const deleteNpc = useDeleteBlueprintNpc();
  const saveQuest = useSaveBlueprintQuest();
  const deleteQuest = useDeleteBlueprintQuest();
  const saveLocation = useSaveBlueprintLocation();
  const deleteLocation = useDeleteBlueprintLocation();
  const attachHomebrew = useAttachBlueprintHomebrew();
  const detachHomebrew = useDetachBlueprintHomebrew();
  const linkCharacter = useLinkBlueprintCharacter();
  const unlinkCharacter = useUnlinkBlueprintCharacter();

  const [tab, setTab] = useState<TabId>('lore');

  /* meta form */
  const [title, setTitle] = useState('');
  const [lore, setLore] = useState('');
  const [universeSlug, setUniverseSlug] = useState('');
  const [allowForks, setAllowForks] = useState(true);
  const [coverUrl, setCoverUrl] = useState('');
  const [universeModalOpen, setUniverseModalOpen] = useState(false);

  /* sub-entity inline forms */
  const [npcName, setNpcName] = useState('');
  const [npcPublic, setNpcPublic] = useState('');
  const [npcPrivate, setNpcPrivate] = useState('');
  const [npcVisible, setNpcVisible] = useState(true);

  const [questTitle, setQuestTitle] = useState('');
  const [questDesc, setQuestDesc] = useState('');
  const [questStatus, setQuestStatus] = useState<QuestStatus>('ACTIVE');
  const [questVisible, setQuestVisible] = useState(true);

  const [locName, setLocName] = useState('');
  const [locDesc, setLocDesc] = useState('');
  const [locVisible, setLocVisible] = useState(true);

  const [homebrewPick, setHomebrewPick] = useState('');
  const [charPick, setCharPick] = useState('');

  // Hydrate the form only when a different blueprint loads (id change), not on
  // every refetch — otherwise a background refetch would clobber in-progress edits.
  useEffect(() => {
    if (bp) {
      setTitle(bp.title);
      setLore(bp.loreDescription ?? '');
      setUniverseSlug(bp.universeSlug);
      setAllowForks(bp.allowForks);
      setCoverUrl(bp.coverUrl ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bp?.id]);

  const resolvedUniverseId = (universes ?? []).find((u) => u.slug === universeSlug)?.id ?? '';
  const isVanilla = universeSlug === 'vanilla';

  const handlePrimary = () => {
    if (!title.trim() || !resolvedUniverseId) return;
    const payload = {
      title: title.trim(),
      loreDescription: lore.trim() || undefined,
      universeId: resolvedUniverseId,
      allowForks,
      coverUrl: coverUrl.trim() || undefined,
    };
    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: (res) => {
          const newId = res.data?.id;
          if (newId) navigate(`/blueprints/my/${newId}/edit`);
        },
      });
    } else if (id) {
      updateMutation.mutate({ id, data: payload });
    }
  };

  if (!isNew && isLoading) {
    return (
      <div>
        <div className={cn('ao-ph', s.skelLine1)} />
        <div className={cn('ao-ph', s.skelLine3)} />
      </div>
    );
  }

  if (!isNew && (error || !bp)) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>{t('bp.editor.error')}</p>
        {isRetryableError(error) && (
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        )}
      </div>
    );
  }

  const primaryPending = createMutation.isPending || updateMutation.isPending;
  const primaryDisabled = primaryPending || !title.trim() || !resolvedUniverseId;

  return (
    <div>
      <button className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.backBtn)} onClick={() => navigate('/blueprints/my')}>
        <Rune kind="chev-l" size={12} color="currentColor" />
        <span className={s.btnLabelL}>{t('bp.my.heading')}</span>
      </button>

      <div className={s.headRow}>
        <div className={s.header}>
          <p className={cn('ao-overline', s.overline)}>{t('bp.editor.overline')}</p>
          <h3 className={cn('ao-h3', s.heading)}>{isNew ? t('bp.editor.newTitle') : title || bp?.title}</h3>
        </div>
        <div className={s.detailActions}>
          <button className="ao-btn ao-btn--primary" onClick={handlePrimary} disabled={primaryDisabled}>
            {primaryPending ? t('bp.editor.saving') : isNew ? t('bp.my.create') : t('common.save')}
          </button>
        </div>
      </div>

      <div className={s.editorRail}>
        {TABS.map((tb) => {
          const disabled = isNew && !tb.metaOnly;
          return (
            <button
              key={tb.id}
              className={cn('ao-tab', tab === tb.id && 'is-active')}
              onClick={() => !disabled && setTab(tb.id)}
              disabled={disabled}
            >
              {t(tb.labelKey)}
            </button>
          );
        })}
      </div>

      <div className={s.editorSection}>
        {/* ── Lore / meta ── */}
        {tab === 'lore' && (
          <div className={s.formGrid}>
            <OrdoField label={t('bp.editor.titleLabel')} required>
              <input
                className="ao-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('bp.editor.titlePlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('bp.editor.loreLabel')}>
              <textarea
                className="ao-input"
                rows={8}
                value={lore}
                onChange={(e) => setLore(e.target.value)}
                placeholder={t('bp.editor.lorePlaceholder')}
              />
            </OrdoField>
            <OrdoField label={t('bp.editor.coverLabel')}>
              <input
                className="ao-input"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder={t('bp.editor.coverPlaceholder')}
              />
            </OrdoField>
            <label className={s.checkRow}>
              <input type="checkbox" checked={allowForks} onChange={(e) => setAllowForks(e.target.checked)} />
              <span>{t('bp.editor.allowForks')}</span>
            </label>
          </div>
        )}

        {/* ── Universe ── */}
        {tab === 'universe' && (
          <div className={s.formGrid}>
            <OrdoField label={t('bp.editor.universeLabel')} required>
              <select
                className="ao-input"
                value={universeSlug}
                onChange={(e) => {
                  if (e.target.value === '__create__') {
                    setUniverseModalOpen(true);
                  } else {
                    setUniverseSlug(e.target.value);
                  }
                }}
              >
                <option value="">{t('bp.editor.universePick')}</option>
                {(universes ?? []).map((u) => (
                  <option key={u.id} value={u.slug}>{u.name}</option>
                ))}
                <option value="__create__">{t('bp.editor.universeCreate')}</option>
              </select>
            </OrdoField>
          </div>
        )}

        {/* ── Homebrew ── */}
        {tab === 'homebrew' && bp && (
          isVanilla ? (
            <div className={s.noticeBox}>{t('bp.editor.vanillaHomebrewBlocked')}</div>
          ) : (
            <div>
              <div className={s.addBar}>
                <div className={s.addBarField}>
                  <select className="ao-input" value={homebrewPick} onChange={(e) => setHomebrewPick(e.target.value)}>
                    <option value="">{t('bp.editor.homebrewPick')}</option>
                    {(library ?? [])
                      .filter((p) => !bp.homebrew.some((h) => h.packageId === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                  </select>
                </div>
                <button
                  className="ao-btn ao-btn--primary"
                  disabled={!homebrewPick || attachHomebrew.isPending}
                  onClick={() =>
                    attachHomebrew.mutate(
                      { id: bp.id, data: { homebrewPackageId: homebrewPick } },
                      { onSuccess: () => setHomebrewPick('') },
                    )
                  }
                >
                  {t('bp.editor.homebrewAdd')}
                </button>
              </div>
              {bp.homebrew.length === 0 ? (
                <EmptyVault glyph="book" title={t('bp.editor.homebrewEmpty')} />
              ) : (
                <div className={s.rowList}>
                  {bp.homebrew.map((h) => (
                    <div key={h.packageId} className={s.row}>
                      <div className={s.rowMain}>
                        <div className={s.rowTitle}>{h.title}</div>
                        {h.pinnedVersion && <div className={s.rowSub}>v{h.pinnedVersion}</div>}
                      </div>
                      <div className={s.rowActions}>
                        <button
                          className="ao-iconbtn"
                          title={t('common.delete')}
                          onClick={() => detachHomebrew.mutate({ id: bp.id, packageId: h.packageId })}
                        >
                          <Rune kind="x" size={13} color="var(--ink-quiet)" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* ── NPCs ── */}
        {tab === 'npcs' && bp && (
          <div>
            <div className={s.inlineForm}>
              <div className={s.twoCol}>
                <OrdoField label={t('bp.field.name')} required>
                  <input className="ao-input" value={npcName} onChange={(e) => setNpcName(e.target.value)} />
                </OrdoField>
                <label className={s.checkRow}>
                  <input type="checkbox" checked={npcVisible} onChange={(e) => setNpcVisible(e.target.checked)} />
                  <span>{t('bp.field.visible')}</span>
                </label>
              </div>
              <OrdoField label={t('bp.field.publicDesc')}>
                <textarea className="ao-input" rows={2} value={npcPublic} onChange={(e) => setNpcPublic(e.target.value)} />
              </OrdoField>
              <OrdoField label={t('bp.field.privateDesc')}>
                <textarea className="ao-input" rows={2} value={npcPrivate} onChange={(e) => setNpcPrivate(e.target.value)} />
              </OrdoField>
              <div className="ao-row ao-justify-end">
                <button
                  className="ao-btn ao-btn--primary"
                  disabled={!npcName.trim() || saveNpc.isPending}
                  onClick={() =>
                    saveNpc.mutate(
                      {
                        id: bp.id,
                        data: {
                          name: npcName.trim(),
                          publicDescription: npcPublic.trim() || undefined,
                          privateDescription: npcPrivate.trim() || undefined,
                          isVisibleToPlayers: npcVisible,
                        },
                      },
                      {
                        onSuccess: () => {
                          setNpcName('');
                          setNpcPublic('');
                          setNpcPrivate('');
                          setNpcVisible(true);
                        },
                      },
                    )
                  }
                >
                  <Rune kind="plus" size={11} color="currentColor" /> {t('bp.editor.npcAdd')}
                </button>
              </div>
            </div>
            {bp.npcs.length === 0 ? (
              <EmptyVault glyph="helm" title={t('bp.editor.npcEmpty')} />
            ) : (
              <div className={s.rowList}>
                {bp.npcs.map((n) => (
                  <div key={n.id} className={s.row}>
                    <div className={s.rowMain}>
                      <div className={s.rowTitle}>{n.name}</div>
                      {n.publicDescription && <div className={s.rowSub}>{n.publicDescription}</div>}
                    </div>
                    <div className={s.rowActions}>
                      <button
                        className="ao-iconbtn"
                        title={t('common.delete')}
                        onClick={() => deleteNpc.mutate({ id: bp.id, npcId: n.id })}
                      >
                        <Rune kind="x" size={13} color="var(--ink-quiet)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Quests ── */}
        {tab === 'quests' && bp && (
          <div>
            <div className={s.inlineForm}>
              <div className={s.twoCol}>
                <OrdoField label={t('bp.field.title')} required>
                  <input className="ao-input" value={questTitle} onChange={(e) => setQuestTitle(e.target.value)} />
                </OrdoField>
                <OrdoField label={t('bp.field.status')}>
                  <select className="ao-input" value={questStatus} onChange={(e) => setQuestStatus(e.target.value as QuestStatus)}>
                    {QUEST_STATUSES.map((st) => (
                      <option key={st} value={st}>{t(`bp.questStatus.${st}`)}</option>
                    ))}
                  </select>
                </OrdoField>
              </div>
              <OrdoField label={t('bp.field.description')}>
                <textarea className="ao-input" rows={2} value={questDesc} onChange={(e) => setQuestDesc(e.target.value)} />
              </OrdoField>
              <label className={s.checkRow}>
                <input type="checkbox" checked={questVisible} onChange={(e) => setQuestVisible(e.target.checked)} />
                <span>{t('bp.field.visible')}</span>
              </label>
              <div className="ao-row ao-justify-end">
                <button
                  className="ao-btn ao-btn--primary"
                  disabled={!questTitle.trim() || saveQuest.isPending}
                  onClick={() =>
                    saveQuest.mutate(
                      {
                        id: bp.id,
                        data: {
                          title: questTitle.trim(),
                          description: questDesc.trim() || undefined,
                          status: questStatus,
                          isVisibleToPlayers: questVisible,
                        },
                      },
                      {
                        onSuccess: () => {
                          setQuestTitle('');
                          setQuestDesc('');
                          setQuestStatus('ACTIVE');
                          setQuestVisible(true);
                        },
                      },
                    )
                  }
                >
                  <Rune kind="plus" size={11} color="currentColor" /> {t('bp.editor.questAdd')}
                </button>
              </div>
            </div>
            {bp.quests.length === 0 ? (
              <EmptyVault glyph="scroll" title={t('bp.editor.questEmpty')} />
            ) : (
              <div className={s.rowList}>
                {bp.quests.map((q) => (
                  <div key={q.id} className={s.row}>
                    <div className={s.rowMain}>
                      <div className={s.rowTitle}>{q.title}</div>
                      {q.description && <div className={s.rowSub}>{q.description}</div>}
                    </div>
                    <div className={s.rowActions}>
                      <span className={s.statusChip}>{t(`bp.questStatus.${q.status}`)}</span>
                      <button
                        className="ao-iconbtn"
                        title={t('common.delete')}
                        onClick={() => deleteQuest.mutate({ id: bp.id, questId: q.id })}
                      >
                        <Rune kind="x" size={13} color="var(--ink-quiet)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Locations ── */}
        {tab === 'locations' && bp && (
          <div>
            <div className={s.inlineForm}>
              <OrdoField label={t('bp.field.name')} required>
                <input className="ao-input" value={locName} onChange={(e) => setLocName(e.target.value)} />
              </OrdoField>
              <OrdoField label={t('bp.field.description')}>
                <textarea className="ao-input" rows={2} value={locDesc} onChange={(e) => setLocDesc(e.target.value)} />
              </OrdoField>
              <label className={s.checkRow}>
                <input type="checkbox" checked={locVisible} onChange={(e) => setLocVisible(e.target.checked)} />
                <span>{t('bp.field.visible')}</span>
              </label>
              <div className="ao-row ao-justify-end">
                <button
                  className="ao-btn ao-btn--primary"
                  disabled={!locName.trim() || saveLocation.isPending}
                  onClick={() =>
                    saveLocation.mutate(
                      {
                        id: bp.id,
                        data: {
                          name: locName.trim(),
                          description: locDesc.trim() || undefined,
                          isVisibleToPlayers: locVisible,
                        },
                      },
                      {
                        onSuccess: () => {
                          setLocName('');
                          setLocDesc('');
                          setLocVisible(true);
                        },
                      },
                    )
                  }
                >
                  <Rune kind="plus" size={11} color="currentColor" /> {t('bp.editor.locationAdd')}
                </button>
              </div>
            </div>
            {bp.locations.length === 0 ? (
              <EmptyVault glyph="hex" title={t('bp.editor.locationEmpty')} />
            ) : (
              <div className={s.rowList}>
                {bp.locations.map((l) => (
                  <div key={l.id} className={s.row}>
                    <div className={s.rowMain}>
                      <div className={s.rowTitle}>{l.name}</div>
                      {l.description && <div className={s.rowSub}>{l.description}</div>}
                    </div>
                    <div className={s.rowActions}>
                      <button
                        className="ao-iconbtn"
                        title={t('common.delete')}
                        onClick={() => deleteLocation.mutate({ id: bp.id, locationId: l.id })}
                      >
                        <Rune kind="x" size={13} color="var(--ink-quiet)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Characters ── */}
        {tab === 'characters' && bp && (
          <div>
            <div className={s.addBar}>
              <div className={s.addBarField}>
                <select className="ao-input" value={charPick} onChange={(e) => setCharPick(e.target.value)}>
                  <option value="">{t('bp.editor.characterPick')}</option>
                  {(templates ?? [])
                    .filter((c) => !bp.preBuiltCharacters.some((p) => p.id === c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <button
                className="ao-btn ao-btn--primary"
                disabled={!charPick || linkCharacter.isPending}
                onClick={() =>
                  linkCharacter.mutate(
                    { id: bp.id, characterId: charPick },
                    { onSuccess: () => setCharPick('') },
                  )
                }
              >
                {t('bp.editor.characterAdd')}
              </button>
            </div>
            {bp.preBuiltCharacters.length === 0 ? (
              <EmptyVault glyph="shield" title={t('bp.editor.characterEmpty')} />
            ) : (
              <div className={s.rowList}>
                {bp.preBuiltCharacters.map((c) => (
                  <div key={c.id} className={s.row}>
                    <div className={s.rowMain}>
                      <div className={s.rowTitle}>{c.name}</div>
                      <div className={s.rowSub}>{c.ownerUsername}</div>
                    </div>
                    <div className={s.rowActions}>
                      <button
                        className="ao-iconbtn"
                        title={t('common.delete')}
                        onClick={() => unlinkCharacter.mutate({ id: bp.id, characterId: c.id })}
                      >
                        <Rune kind="x" size={13} color="var(--ink-quiet)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CreateUniverseModal
        open={universeModalOpen}
        onOpenChange={setUniverseModalOpen}
        onCreated={(u) => setUniverseSlug(u.slug)}
      />
    </div>
  );
}
