import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoInterfaceIcon, OrdoPanel, Rune, OrdoField, EmptyVault, ErrorAltar } from '@/components/ordo';
import { VisibilityToggle, QuestStatusBadge } from '@/components/narrative';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCampaignQuests, useCreateQuest } from '@/hooks/useQuests';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { QuestResponse, QuestStatus } from '@/types';
import css from './QuestManagerPage.module.css';

/* ── constants ───────────────────────────────────────────────── */

const QUEST_STATUSES: QuestStatus[] = ['ACTIVE', 'COMPLETED', 'FAILED', 'HIDDEN', 'ARCHIVED'];

/* ── page ────────────────────────────────────────────────────── */

export default function QuestManagerPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { data: quests, isLoading, error, refetch } = useCampaignQuests(campaignId!);
  const createMutation = useCreateQuest();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<QuestStatus>('ACTIVE');
  const [formVisible, setFormVisible] = useState(true);

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormStatus('ACTIVE');
    setFormVisible(true);
  };

  const handleCreate = () => {
    createMutation.mutate(
      {
        campaignId: campaignId!,
        data: {
          title: formTitle,
          description: formDescription || undefined,
          status: formStatus,
          isVisibleToPlayers: formVisible,
        },
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          resetForm();
        },
      },
    );
  };

  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <div className={css.header}>
          <div>
            <p className={cn('ao-overline', css.overlineGold)}>{t('camp2.questMgr.overline')}</p>
            <h3 className={cn('ao-h3', css.title)}>{t('camp2.questMgr.title')}</h3>
          </div>
        </div>
        <div className={cn('ao-panel ao-frame ao-breathe', css.skelPanel)}>
          <span className="ao-frame-c" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={css.skelRow}>
              <div className={cn('ao-ph', css.phW40)} />
              <div className={cn('ao-ph', css.phW15)} />
              <div className={cn('ao-ph', css.phW10)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── error ───────────────────────────────────────────────── */

  if (error) {
    return (
      <div>
        <ErrorAltar
          icon="quest"
          title={t('camp2.questMgr.loadError')}
          error={error}
          onRetry={() => refetch()}
          retryLabel={t('common.retry')}
        />
      </div>
    );
  }

  /* ── sort: archived at the bottom ────────────────────────── */

  const sorted = [...(quests || [])].sort((a, b) => {
    if (a.status === 'ARCHIVED' && b.status !== 'ARCHIVED') return 1;
    if (a.status !== 'ARCHIVED' && b.status === 'ARCHIVED') return -1;
    return 0;
  });

  /* ── main ────────────────────────────────────────────────── */

  return (
    <div>
      {/* Header */}
      <div className={css.header}>
        <div>
          <p className={cn('ao-overline', css.overlineGold)}>{t('camp2.questMgr.overline')}</p>
          <h3 className={cn('ao-h3', css.title)}>{t('camp2.questMgr.title')}</h3>
          <p className={cn('ao-italic', css.sub)}>
            {t('camp2.questMgr.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span className={css.ml6}>{t('camp2.questMgr.newQuest')}</span>
        </button>
      </div>

      {/* Quest table */}
      {sorted.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          icon="quest"
          title={t('camp2.questMgr.empty.title')}
          body={t('camp2.questMgr.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span className={css.ml6}>{t('camp2.questMgr.newQuest')}</span>
            </button>
          }
        />
      ) : (
        <OrdoPanel frame padding={0}>
          {/* Column headers */}
          <div className={cn('ao-rgrid', css.questGrid, css.colHead)}>
            <span className={cn('ao-overline', css.colLabel)}>{t('camp2.questMgr.col.quest')}</span>
            <span className={cn('ao-overline', css.colLabel)}>{t('camp2.questMgr.col.status')}</span>
            <span className={cn('ao-overline', css.colLabel)}>{t('camp2.questMgr.col.visibility')}</span>
            <span />
          </div>

          {/* Rows */}
          {sorted.map((quest: QuestResponse) => {
            const isArchived = quest.status === 'ARCHIVED';
            return (
              <div key={quest.id} className={cn('ao-rgrid', css.questGrid, css.row, isArchived && css.archived)}>
                {/* Quest name + subtitle */}
                <div className={css.nameCell}>
                  <OrdoInterfaceIcon icon="quest" size={16} style={{ color: 'var(--brass)' }} />
                  <div className={css.nameMain}>
                    <div className={css.questTitle}>
                      {quest.title}
                    </div>
                    {quest.description && (
                      <div className={cn('ao-italic', css.questDesc)}>
                        {quest.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <QuestStatusBadge status={quest.status} />
                </div>

                {/* Visibility */}
                <div>
                  <VisibilityToggle
                    visible={quest.isVisibleToPlayers}
                    onToggle={() => {/* handled in detail page */}}
                  />
                </div>

                {/* Open button */}
                <div>
                  <button
                    className="ao-btn ao-btn--sm"
                    onClick={() => navigate(`/campaigns/${campaignId}/quests/${quest.id}`)}
                  >
                    {t('common.open')}
                  </button>
                </div>
              </div>
            );
          })}
        </OrdoPanel>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('camp2.questMgr.dialog.title')}</DialogTitle>
          </DialogHeader>
          <div className={css.dialogCol}>
            <OrdoField label={t('camp2.questMgr.field.name')} required>
              <input
                className="ao-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t('camp2.questMgr.field.namePlaceholder')}
              />
            </OrdoField>

            <OrdoField label={t('camp2.questMgr.field.description')} hint={t('camp2.questMgr.field.descriptionHint')}>
              <textarea
                className={cn('ao-input', css.resizeV)}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('camp2.questMgr.field.descriptionPlaceholder')}
                rows={3}
              />
            </OrdoField>

            <OrdoField label={t('camp2.questMgr.field.status')}>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as QuestStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('camp2.questMgr.field.selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  {QUEST_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`camp2.questStatus.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </OrdoField>

            <label className={css.checkRow}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className={cn('ao-label', css.labelNoMb)}>{t('camp2.questMgr.field.visible')}</span>
            </label>
          </div>
          <DialogFooter>
            <button
              className="ao-btn ao-btn--ghost"
              onClick={() => setDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              {t('camp2.questMgr.withhold')}
            </button>
            <button
              type="button"
              className="ao-btn ao-btn--primary"
              onClick={handleCreate}
              disabled={!formTitle || createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('camp2.questMgr.record')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
