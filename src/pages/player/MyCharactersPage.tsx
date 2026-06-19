import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, Trash2, Eye } from 'lucide-react';
import { OrdoPanel, PanelHeader, EmptyVault, Bar } from '@/components/ordo';
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
import { useMyTemplates, useDeleteTemplate } from '@/hooks/useTemplates';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { isRetryableError } from '@/lib/errors';
import type { CharacterResponse } from '@/types';
import s from './MyCharactersPage.module.css';

export default function MyCharactersPage() {
  const navigate = useNavigate();
  const t = useT();
  const { data: templates, isLoading, error, refetch } = useMyTemplates();
  const deleteMutation = useDeleteTemplate();

  const [pendingDelete, setPendingDelete] = useState<CharacterResponse | null>(null);

  const handleConfirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id, {
      onSuccess: () => setPendingDelete(null),
    });
  };

  if (isLoading) {
    return (
      <div>
        <Header onCreate={() => navigate('/characters/templates/new')} />
        <div className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
          <span className="ao-frame-c" />
          <div className={cn('ao-ph', s.skelTitle)} />
          <div className={cn('ao-ph', s.skelLine)} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header onCreate={() => navigate('/characters/templates/new')} />
        <div className={s.errorBox}>
          <p className={cn('ao-italic', s.errorText)}>
            {t('chars.loadError')}
          </p>
          {isRetryableError(error) && (
            <button className="ao-btn" onClick={() => refetch()}>{t('common.retry')}</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header onCreate={() => navigate('/characters/templates/new')} />

      {!templates || templates.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          overline={t('chars.empty.overline')}
          title={t('chars.empty.title')}
          body={t('chars.empty.body')}
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/characters/templates/new')}>
              <Plus className="h-3 w-3 mr-1" /> {t('chars.createTemplate')}
            </button>
          }
        />
      ) : (
        <div className={s.grid}>
          {templates.map((char) => (
            <TemplateCard
              key={char.id}
              character={char}
              onOpen={() => navigate(`/characters/templates/${char.id}`)}
              onDelete={() => setPendingDelete(char)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chars.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('chars.delete.body', { name: pendingDelete?.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Header({ onCreate }: { onCreate: () => void }) {
  const t = useT();
  return (
    <div className={s.header}>
      <div>
        <p className={cn('ao-overline', s.overlineGold)}>{t('chars.overline')}</p>
        <h3 className={cn('ao-h3', s.title)}>{t('chars.title')}</h3>
        <p className={cn('ao-italic', s.subtitle)}>
          {t('chars.subtitle')}
        </p>
      </div>
      <button className="ao-btn ao-btn--primary" onClick={onCreate}>
        <Plus className="h-3 w-3 mr-1" /> {t('chars.createTemplate')}
      </button>
    </div>
  );
}

function TemplateCard({
  character,
  onOpen,
  onDelete,
}: {
  character: CharacterResponse;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const classLabel = character.classLevels?.length
    ? character.classLevels.map((c) => `${c.className} ${c.classLevel}`).join(' / ')
    : `LVL ${character.totalLevel}`;
  const raceLabel = character.race?.name ?? '—';
  const inCampaign = !!(character as CharacterResponse & { campaignId?: string | null }).campaignId;
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={character.name} glyph="helm" tone="gold" sub={inCampaign ? t('chars.inCampaign') : t('chars.template')} />
      <div className={s.cardBody}>
        <div className={cn('ao-codex', s.cardClass)}>
          {classLabel} · {raceLabel}
        </div>
        <Bar value={character.currentHp ?? 0} max={Math.max(1, character.maxHp ?? 0)} tone="ember" height={5} />
        <div className={cn('ao-codex', s.cardHp)}>
          HP {character.currentHp ?? 0}/{character.maxHp ?? 0} · XP {character.experience.toLocaleString()}
        </div>
        <div className={s.cardActions}>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onOpen}>
            <Eye className="h-3 w-3" /> <span className={s.openLabel}>{t('common.open')}</span>
          </button>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onDelete} title={t('chars.deleteTemplateTitle')}>
            <Trash2 className={cn('h-3 w-3', s.trashIcon)} />
          </button>
        </div>
      </div>
    </OrdoPanel>
  );
}
