import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Bar, OrdoDivider } from '@/components/ordo';
import { useTemplate, useDeleteTemplate } from '@/hooks/useTemplates';

export default function TemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { data: tpl, isLoading, error } = useTemplate(templateId);
  const deleteMutation = useDeleteTemplate();

  const back = () => navigate('/characters/templates');

  if (isLoading) {
    return (
      <div className="ao-panel ao-frame ao-breathe" style={{ padding: 24, minHeight: 160 }}>
        <span className="ao-frame-c" />
        <div className="ao-ph" style={{ width: '40%', height: 20, marginBottom: 12 }} />
        <div className="ao-ph" style={{ width: '60%', height: 14 }} />
      </div>
    );
  }

  if (error || !tpl) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', marginBottom: 16 }}>
          Шаблон не найден.
        </p>
        <button className="ao-btn" onClick={back}>← К списку</button>
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirm(`Удалить «${tpl.name}»? Действие нельзя отменить.`)) return;
    deleteMutation.mutate(tpl.id, { onSuccess: back });
  };

  const classLabel = tpl.classLevels?.length
    ? tpl.classLevels.map((c) => `${c.className} ${c.classLevel}`).join(' / ')
    : `LVL ${tpl.totalLevel}`;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button className="ao-btn ao-btn--ghost" onClick={back}>
          <ArrowLeft className="h-3 w-3" /> К списку
        </button>
        <button className="ao-btn ao-btn--ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" style={{ color: 'var(--ember)' }} />}
          <span style={{ marginLeft: 6 }}>Удалить</span>
        </button>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader title={tpl.name} glyph="helm" tone="gold" sub={classLabel} />
        <div style={{ padding: 16, display: 'grid', gap: 14 }}>
          <div className="ao-codex" style={{ fontSize: 13 }}>
            Раса: <strong>{tpl.race?.name ?? '—'}</strong>
          </div>
          {tpl.race?.description && (
            <div className="ao-italic" style={{ fontSize: 12, color: 'var(--ink-quiet)' }}>
              {tpl.race.description}
            </div>
          )}

          <OrdoDivider glyph="diamond" />

          <div>
            <div className="ao-overline" style={{ marginBottom: 6 }}>Здоровье</div>
            <Bar value={tpl.currentHp ?? 0} max={Math.max(1, tpl.maxHp ?? 0)} tone="ember" height={6} />
            <div className="ao-codex" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 4 }}>
              HP {tpl.currentHp ?? 0}/{tpl.maxHp ?? 0} · XP {tpl.experience.toLocaleString()}
            </div>
          </div>

          {tpl.stats?.length ? (
            <div>
              <div className="ao-overline" style={{ marginBottom: 6 }}>Характеристики</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                {tpl.stats.map((s) => (
                  <div key={s.id} style={{ padding: '6px 10px', border: '1px solid var(--hairline)' }}>
                    <div className="ao-overline" style={{ fontSize: 9 }}>{s.statTypeName}</div>
                    <div className="ao-h5" style={{ fontSize: 18 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </OrdoPanel>
    </div>
  );
}
