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
import type { CharacterResponse } from '@/types';

export default function MyCharactersPage() {
  const navigate = useNavigate();
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
        <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 200 }}>
          <span className="ao-frame-c" />
          <div className="ao-ph" style={{ width: '40%', height: 22, marginBottom: 12 }} />
          <div className="ao-ph" style={{ width: '60%', height: 14 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Header onCreate={() => navigate('/characters/templates/new')} />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
            Не удалось загрузить ваших персонажей.
          </p>
          <button className="ao-btn" onClick={() => refetch()}>Retry</button>
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
          overline="Шаблоны"
          title="У вас нет ванильных персонажей"
          body="Создайте «болванку» — её можно загружать в любую кампанию повторно."
          action={
            <button className="ao-btn ao-btn--primary" onClick={() => navigate('/characters/templates/new')}>
              <Plus className="h-3 w-3 mr-1" /> Создать шаблон
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
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
            <AlertDialogTitle>Удалить шаблон?</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.name}» будет удалён безвозвратно. Уже добавленные в кампании копии останутся.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Header({ onCreate }: { onCreate: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Vault of Souls</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Мои персонажи</h3>
        <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
          Ванильные «болванки» персонажей — без хоумбрю. Можно загрузить в любую кампанию.
        </p>
      </div>
      <button className="ao-btn ao-btn--primary" onClick={onCreate}>
        <Plus className="h-3 w-3 mr-1" /> Создать шаблон
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
  const classLabel = character.classLevels?.length
    ? character.classLevels.map((c) => `${c.className} ${c.classLevel}`).join(' / ')
    : `LVL ${character.totalLevel}`;
  const raceLabel = character.race?.name ?? '—';
  const inCampaign = !!(character as CharacterResponse & { campaignId?: string | null }).campaignId;
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={character.name} glyph="helm" tone="gold" sub={inCampaign ? 'В кампании' : 'Шаблон'} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ao-codex" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
          {classLabel} · {raceLabel}
        </div>
        <Bar value={character.currentHp ?? 0} max={Math.max(1, character.maxHp ?? 0)} tone="ember" height={5} />
        <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
          HP {character.currentHp ?? 0}/{character.maxHp ?? 0} · XP {character.experience.toLocaleString()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onOpen}>
            <Eye className="h-3 w-3" /> <span style={{ marginLeft: 4 }}>Открыть</span>
          </button>
          <button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={onDelete} title="Удалить шаблон">
            <Trash2 className="h-3 w-3" style={{ color: 'var(--ember)' }} />
          </button>
        </div>
      </div>
    </OrdoPanel>
  );
}
