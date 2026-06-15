import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sparkles, BookOpen, Loader2, Plus } from 'lucide-react';
import { OrdoPanel, PanelHeader, Bar } from '@/components/ordo';
import { BackLink } from '@/components/campaigns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCampaign } from '@/hooks/useCampaigns';
import { useMyTemplates, useCloneTemplateToCampaign } from '@/hooks/useTemplates';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { CharacterResponse } from '@/types';
import s from './AddCharacterPage.module.css';

type Mode = 'choice' | 'pick-template';

export default function AddCharacterPage() {
  const t = useT();
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const { data: campaign } = useCampaign(campaignId!);
  const { data: templates, isLoading: tplLoading } = useMyTemplates();
  const cloneMutation = useCloneTemplateToCampaign();

  const [mode, setMode] = useState<Mode>('choice');
  const [selected, setSelected] = useState<CharacterResponse | null>(null);
  // If true, original record itself becomes the campaign character; otherwise a copy is added.
  const [moveOriginal, setMoveOriginal] = useState(false);

  const backToDashboard = () => navigate(`/campaigns/${campaignId}`);

  const availableTemplates = useMemo(() => {
    const list = templates ?? [];
    // Only show templates not already attached to a campaign.
    return list.filter((c) => !(c as CharacterResponse & { campaignId?: string | null }).campaignId);
  }, [templates]);

  const handleClone = () => {
    if (!selected || !campaignId) return;
    cloneMutation.mutate(
      {
        campaignId,
        templateId: selected.id,
        mode: moveOriginal ? 'move' : 'clone',
      },
      {
        onSuccess: () => {
          setSelected(null);
          backToDashboard();
        },
      },
    );
  };

  return (
    <div>
      <BackLink to={`/campaigns/${campaignId}`} label={t('camp2.back.campaign')} className={s.backLink} />

      <div className={s.header}>
        <p className={cn('ao-overline', s.overlineGold)}>{t('camp.add.overline')}</p>
        <h3 className={cn('ao-h3', s.title)}>{t('camp.add.title')}</h3>
        {campaign && (
          <p className={cn('ao-italic', s.metaLine)}>
            {t('camp.add.campaign', { name: campaign.name })}
          </p>
        )}
      </div>

      {mode === 'choice' && (
        <div className={s.choiceGrid}>
          <ChoiceCard
            glyph={<Sparkles className={cn('h-5 w-5', s.iconGold)} />}
            title={t('camp.add.createNew.title')}
            body={t('camp.add.createNew.body')}
            onClick={() => navigate(`/campaigns/${campaignId}/characters/create`)}
          />
          <ChoiceCard
            glyph={<BookOpen className={cn('h-5 w-5', s.iconArcane)} />}
            title={t('camp.add.fromTemplate.title')}
            body={t('camp.add.fromTemplate.body')}
            onClick={() => setMode('pick-template')}
          />
        </div>
      )}

      {mode === 'pick-template' && (
        <div>
          <div className={s.pickHeader}>
            <div>
              <p className={cn('ao-overline', s.overlineGold)}>{t('camp.add.vault')}</p>
              <h4 className="ao-h4">{t('camp.add.chooseTemplate')}</h4>
            </div>
            <button className="ao-btn ao-btn--ghost" onClick={() => setMode('choice')}>{t('camp.add.backToChoice')}</button>
          </div>

          <label className={s.moveLabel}>
            <input
              type="checkbox"
              checked={moveOriginal}
              onChange={(e) => setMoveOriginal(e.target.checked)}
            />
            <span className={s.moveMain}>
              <span className={s.moveTitle}>
                {t('camp.add.moveOriginal')}
              </span>
              <span className={cn('ao-italic', s.moveHint)}>
                {t('camp.add.moveOriginal.hint')}
              </span>
            </span>
          </label>

          {tplLoading ? (
            <div className={cn('ao-panel ao-frame ao-breathe', s.skelPanel)}>
              <span className="ao-frame-c" />
              <div className={cn('ao-ph', s.phTitle)} />
              <div className={cn('ao-ph', s.phSub)} />
            </div>
          ) : availableTemplates.length === 0 ? (
            <OrdoPanel frame padding={0}>
              <PanelHeader title={t('camp.add.noTemplates.title')} glyph="scroll" />
              <div className={s.emptyBody}>
                <p className={cn('ao-italic', s.emptyText)}>
                  {t('camp.add.noTemplates.body')}
                </p>
                <button className="ao-btn ao-btn--primary" onClick={() => navigate('/characters/templates/new')}>
                  <Plus className="h-3 w-3" /> <span className={s.ml6}>{t('camp.add.createTemplate')}</span>
                </button>
              </div>
            </OrdoPanel>
          ) : (
            <div className={s.templateGrid}>
              {availableTemplates.map((tpl) => (
                <TemplateChooserCard
                  key={tpl.id}
                  character={tpl}
                  onPick={() => setSelected(tpl)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moveOriginal ? t('camp.add.moveTitle') : t('camp.add.useTitle', { name: selected?.name ?? '' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {moveOriginal
                ? t('camp.add.moveBody')
                : t('camp.add.cloneBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClone} disabled={cloneMutation.isPending}>
              {cloneMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ChoiceCard({
  glyph,
  title,
  body,
  onClick,
}: {
  glyph: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={s.choiceCard}>
      <div className={s.choiceCardHead}>
        {glyph}
        <span className={cn('ao-h5', s.choiceCardTitle)}>{title}</span>
      </div>
      <p className={cn('ao-italic', s.choiceCardBody)}>
        {body}
      </p>
    </button>
  );
}

function TemplateChooserCard({
  character,
  onPick,
}: {
  character: CharacterResponse;
  onPick: () => void;
}) {
  const t = useT();
  const classLabel = character.classLevels?.length
    ? character.classLevels.map((c) => `${c.className} ${c.classLevel}`).join(' / ')
    : `LVL ${character.totalLevel}`;
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={character.name} glyph="helm" tone="gold" sub={`${classLabel} · ${character.race?.name ?? '—'}`} />
      <div className={s.tplBody}>
        <Bar value={character.currentHp ?? 0} max={Math.max(1, character.maxHp ?? 0)} tone="ember" height={5} />
        <div className={cn('ao-codex', s.tplMeta)}>
          HP {character.currentHp ?? 0}/{character.maxHp ?? 0} · XP {character.experience.toLocaleString()}
        </div>
        <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={onPick}>
          {t('camp.add.useTemplate')}
        </button>
      </div>
    </OrdoPanel>
  );
}
