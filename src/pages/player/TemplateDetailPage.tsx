import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { OrdoPanel, PanelHeader, Bar, OrdoDivider } from '@/components/ordo';
import { EditableSheetField } from '@/components/characters';
import { useTemplate, useDeleteTemplate, useUpdateTemplate } from '@/hooks/useTemplates';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './TemplateDetailPage.module.css';

export default function TemplateDetailPage() {
  const t = useT();
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { data: tpl, isLoading, error } = useTemplate(templateId);
  const deleteMutation = useDeleteTemplate();
  const updateMutation = useUpdateTemplate();

  const saveField = (field: 'proficiencies' | 'equipment', next: string) => {
    if (!templateId) return;
    updateMutation.mutate({ templateId, data: { [field]: next } });
  };

  const back = () => navigate('/characters/templates');

  if (isLoading) {
    return (
      <div className={cn('ao-panel ao-frame ao-breathe', s.skel)}>
        <span className="ao-frame-c" />
        <div className={cn('ao-ph', s.skelTitle)} />
        <div className={cn('ao-ph', s.skelLine)} />
      </div>
    );
  }

  if (error || !tpl) {
    return (
      <div className={s.errorBox}>
        <p className={cn('ao-italic', s.errorText)}>
          {t('player.template.notFound')}
        </p>
        <button className="ao-btn" onClick={back}>{t('player.template.backToList')}</button>
      </div>
    );
  }

  const handleDelete = () => {
    if (!confirm(t('player.template.deleteConfirm', { name: tpl.name }))) return;
    deleteMutation.mutate(tpl.id, { onSuccess: back });
  };

  const classLabel = tpl.classLevels?.length
    ? tpl.classLevels.map((c) => `${c.className} ${c.classLevel}`).join(' / ')
    : t('player.template.levelShort', { level: tpl.totalLevel });

  return (
    <div>
      <div className={s.toolbar}>
        <button className="ao-btn ao-btn--ghost" onClick={back}>
          <ArrowLeft className="h-3 w-3" /> {t('player.template.backToListShort')}
        </button>
        <button className="ao-btn ao-btn--ghost" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className={cn('h-3 w-3', s.trashIcon)} />}
          <span className={s.delLabel}>{t('player.template.delete')}</span>
        </button>
      </div>

      <OrdoPanel frame padding={0}>
        <PanelHeader title={tpl.name} glyph="helm" tone="gold" sub={classLabel} />
        <div className={s.bodyGrid}>
          <div className={cn('ao-codex', s.raceLine)}>
            {t('player.template.race')}: <strong>{tpl.race?.name ?? t('player.template.dash')}</strong>
          </div>
          {tpl.race?.description && (
            <div className={cn('ao-italic', s.raceDesc)}>
              {tpl.race.description}
            </div>
          )}

          <OrdoDivider glyph="diamond" />

          <div>
            <div className={cn('ao-overline', s.sectionLabel)}>{t('player.template.health')}</div>
            <Bar value={tpl.currentHp ?? 0} max={Math.max(1, tpl.maxHp ?? 0)} tone="ember" height={6} />
            <div className={cn('ao-codex', s.hpMeta)}>
              HP {tpl.currentHp ?? 0}/{tpl.maxHp ?? 0} · XP {tpl.experience.toLocaleString()}
            </div>
          </div>

          {tpl.stats?.length ? (
            <div>
              <div className={cn('ao-overline', s.sectionLabel)}>{t('player.template.stats')}</div>
              <div className={s.statsGrid}>
                {tpl.stats.map((st) => (
                  <div key={st.id} className={s.statCell}>
                    <div className={cn('ao-overline', s.statLabel)}>{st.statTypeName}</div>
                    <div className={cn('ao-h5', s.statValue)}>{st.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </OrdoPanel>

      <div className={s.sideGrid}>
        <OrdoPanel padding={14}>
          <div className="ao-overline">{t('camp2.folio.playerName')}</div>
          <div className={cn('ao-h6', s.ownerName)}>{tpl.ownerUsername}</div>
          <div className={cn('ao-codex', s.ownerFrom)}>{t('camp2.folio.playerFromOwner')}</div>
        </OrdoPanel>
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.folio.profsLanguages')} glyph="scroll" />
          <EditableSheetField
            value={tpl.proficiencies ?? null}
            placeholder={t('camp2.folio.noProfs')}
            saving={updateMutation.isPending}
            onSave={(next) => saveField('proficiencies', next)}
          />
        </OrdoPanel>
        <OrdoPanel frame padding={0}>
          <PanelHeader title={t('camp2.folio.equipmentTitle')} glyph="coin" tone="gold" />
          <EditableSheetField
            value={tpl.equipment ?? null}
            placeholder={t('camp2.folio.noEquipment')}
            saving={updateMutation.isPending}
            onSave={(next) => saveField('equipment', next)}
          />
        </OrdoPanel>
      </div>
    </div>
  );
}
