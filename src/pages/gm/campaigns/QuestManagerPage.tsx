import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Rune, OrdoField, EmptyVault } from '@/components/ordo';
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
import { BackLink } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import type { QuestResponse, QuestStatus } from '@/types';

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

  const backTo = `/campaigns/${campaignId}`;
  /* ── loading ─────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <div>
        <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.questMgr.overline')}</p>
            <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.questMgr.title')}</h3>
          </div>
        </div>
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
          <span className="ao-frame-c" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div className="ao-ph" style={{ width: '40%', height: 14 }} />
              <div className="ao-ph" style={{ width: '15%', height: 14 }} />
              <div className="ao-ph" style={{ width: '10%', height: 14 }} />
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
        <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
            {t('camp2.questMgr.loadError')}
          </p>
          <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
        </div>
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
      <BackLink to={backTo} label={t('camp2.back.campaign')} style={{ marginBottom: 12 }} />
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <p className="ao-overline" style={{ color: 'var(--gold)' }}>{t('camp2.questMgr.overline')}</p>
          <h3 className="ao-h3" style={{ marginTop: 4 }}>{t('camp2.questMgr.title')}</h3>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 4 }}>
            {t('camp2.questMgr.subtitle')}
          </p>
        </div>
        <button
          className="ao-btn ao-btn--primary"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Rune kind="plus" size={14} color="currentColor" />
          <span style={{ marginLeft: 6 }}>{t('camp2.questMgr.newQuest')}</span>
        </button>
      </div>

      {/* Quest table */}
      {sorted.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title={t('camp2.questMgr.empty.title')}
          body={t('camp2.questMgr.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Rune kind="plus" size={14} color="currentColor" />
              <span style={{ marginLeft: 6 }}>{t('camp2.questMgr.newQuest')}</span>
            </button>
          }
        />
      ) : (
        <OrdoPanel frame padding={0}>
          {/* Column headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 140px 120px 80px',
              gap: 12,
              padding: '10px 18px',
              borderBottom: '1px solid var(--rule)',
              background: 'var(--abyss)',
            }}
          >
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp2.questMgr.col.quest')}</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp2.questMgr.col.status')}</span>
            <span className="ao-overline" style={{ fontSize: 9, color: 'var(--ink-faint)' }}>{t('camp2.questMgr.col.visibility')}</span>
            <span />
          </div>

          {/* Rows */}
          {sorted.map((quest: QuestResponse) => {
            const isArchived = quest.status === 'ARCHIVED';
            return (
              <div
                key={quest.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 120px 80px',
                  gap: 12,
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--hairline)',
                  alignItems: 'center',
                  opacity: isArchived ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {/* Quest name + subtitle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <Rune kind="scroll" size={16} color="var(--brass)" />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: 'var(--ink-bright)', fontWeight: 500 }}>
                      {quest.title}
                    </div>
                    {quest.description && (
                      <div
                        className="ao-italic"
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-faint)',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="ao-input"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t('camp2.questMgr.field.descriptionPlaceholder')}
                rows={3}
                style={{ resize: 'vertical' }}
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

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formVisible}
                onChange={(e) => setFormVisible(e.target.checked)}
              />
              <span className="ao-label" style={{ marginBottom: 0 }}>{t('camp2.questMgr.field.visible')}</span>
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
