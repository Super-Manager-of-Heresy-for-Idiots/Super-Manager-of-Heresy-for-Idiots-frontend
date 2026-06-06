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
import type { CharacterResponse } from '@/types';

type Mode = 'choice' | 'pick-template';

export default function AddCharacterPage() {
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
      <BackLink to={`/campaigns/${campaignId}`} label="К кампании" style={{ marginBottom: 12 }} />

      <div style={{ marginBottom: 24 }}>
        <p className="ao-overline" style={{ color: 'var(--gold)' }}>Add Character</p>
        <h3 className="ao-h3" style={{ marginTop: 4 }}>Добавить персонажа</h3>
        {campaign && (
          <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, marginTop: 4 }}>
            Кампания: {campaign.name}
          </p>
        )}
      </div>

      {mode === 'choice' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <ChoiceCard
            glyph={<Sparkles className="h-5 w-5" style={{ color: 'var(--gold)' }} />}
            title="Создать нового"
            body="Запустить мастер создания персонажа для этой кампании. Доступен homebrew-контент, подключённый к кампании."
            onClick={() => navigate(`/campaigns/${campaignId}/characters/create`)}
          />
          <ChoiceCard
            glyph={<BookOpen className="h-5 w-5" style={{ color: 'var(--arcane)' }} />}
            title="Загрузить из шаблона"
            body="Использовать одного из ваших ванильных персонажей. Можно сделать копию или войти оригиналом."
            onClick={() => setMode('pick-template')}
          />
        </div>
      )}

      {mode === 'pick-template' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p className="ao-overline" style={{ color: 'var(--gold)' }}>Vault</p>
              <h4 className="ao-h4">Выберите шаблон</h4>
            </div>
            <button className="ao-btn ao-btn--ghost" onClick={() => setMode('choice')}>← Назад к выбору</button>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              marginBottom: 14,
              border: '1px solid var(--hairline)',
              background: 'var(--panel)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={moveOriginal}
              onChange={(e) => setMoveOriginal(e.target.checked)}
            />
            <span style={{ flex: 1 }}>
              <span style={{ color: 'var(--ink-bright)', fontSize: 13 }}>
                Войти оригиналом (не клонировать)
              </span>
              <span className="ao-italic" style={{ display: 'block', fontSize: 11, color: 'var(--ink-quiet)' }}>
                По умолчанию создаётся копия — оригинал остаётся в шаблонах. С включённой галкой оригинальный
                персонаж будет привязан к этой кампании и пропадёт из шаблонов.
              </span>
            </span>
          </label>

          {tplLoading ? (
            <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 160 }}>
              <span className="ao-frame-c" />
              <div className="ao-ph" style={{ width: '40%', height: 20, marginBottom: 12 }} />
              <div className="ao-ph" style={{ width: '60%', height: 14 }} />
            </div>
          ) : availableTemplates.length === 0 ? (
            <OrdoPanel frame padding={0}>
              <PanelHeader title="Нет доступных шаблонов" glyph="scroll" />
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p className="ao-italic" style={{ color: 'var(--ink-faint)' }}>
                  Все ваши шаблоны уже привязаны к кампаниям, или вы их ещё не создавали.
                </p>
                <button className="ao-btn ao-btn--primary" onClick={() => navigate('/characters/templates/new')}>
                  <Plus className="h-3 w-3" /> <span style={{ marginLeft: 6 }}>Создать шаблон</span>
                </button>
              </div>
            </OrdoPanel>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
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
              {moveOriginal ? 'Перенести оригинал?' : `Использовать «${selected?.name ?? ''}»?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {moveOriginal
                ? 'Оригинальный шаблон будет привязан к этой кампании. Использовать его повторно в других кампаниях уже не получится.'
                : 'Будет создана копия персонажа для этой кампании. Оригинальный шаблон останется для использования в других кампаниях.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleClone} disabled={cloneMutation.isPending}>
              {cloneMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              Подтвердить
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
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 20,
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 160,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {glyph}
        <span className="ao-h5" style={{ fontSize: 15 }}>{title}</span>
      </div>
      <p className="ao-italic" style={{ color: 'var(--ink-quiet)', fontSize: 13, margin: 0 }}>
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
  const classLabel = character.classLevels?.length
    ? character.classLevels.map((c) => `${c.className} ${c.classLevel}`).join(' / ')
    : `LVL ${character.totalLevel}`;
  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={character.name} glyph="helm" tone="gold" sub={`${classLabel} · ${character.race?.name ?? '—'}`} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Bar value={character.currentHp ?? 0} max={Math.max(1, character.maxHp ?? 0)} tone="ember" height={5} />
        <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
          HP {character.currentHp ?? 0}/{character.maxHp ?? 0} · XP {character.experience.toLocaleString()}
        </div>
        <button className="ao-btn ao-btn--primary ao-btn--sm" onClick={onPick}>
          Использовать шаблон
        </button>
      </div>
    </OrdoPanel>
  );
}
