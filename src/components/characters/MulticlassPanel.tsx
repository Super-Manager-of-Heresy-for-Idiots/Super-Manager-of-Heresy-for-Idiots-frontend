import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './MulticlassPanel.module.css';

interface ClassLevel {
  classId: string;
  className: string;
  classLevel: number;
  subclassName?: string;
}

interface MulticlassPanelProps {
  classLevels: ClassLevel[];
  onAddClass?: () => void;
}

const CLASS_GLYPHS: Record<string, string> = {
  default: 'shield',
};

function getGlyph(className: string): string {
  const key = className.toLowerCase();
  return CLASS_GLYPHS[key] ?? CLASS_GLYPHS.default;
}

export function MulticlassPanel({ classLevels, onAddClass }: MulticlassPanelProps) {
  const t = useT();
  const totalLevel = classLevels.reduce((sum, cl) => sum + cl.classLevel, 0);

  return (
    <OrdoPanel frame>
      <PanelHeader
        title={t('cmp.multiclass.title')}
        glyph="shield"
        right={
          onAddClass ? (
            <button onClick={onAddClass} className={s.addBtn}>
              <Rune kind="plus" size={10} color="var(--ink-quiet)" />
              {t('cmp.multiclass.addClass')}
            </button>
          ) : undefined
        }
      />

      <div className={s.list}>
        {classLevels.map((cl, idx) => (
          <div key={cl.classId}>
            <div className={s.row}>
              <div className="ao-iconbox">
                <Rune kind={getGlyph(cl.className)} size={18} color="var(--gold)" />
              </div>

              <div className={s.info}>
                <div className={s.name}>{cl.className}</div>
                {cl.subclassName && <div className={s.sub}>{cl.subclassName}</div>}
              </div>

              <div className={s.level}>{cl.classLevel}</div>
            </div>

            {idx < classLevels.length - 1 && (
              <OrdoDivider glyph="diamond" color="var(--rule)" />
            )}
          </div>
        ))}
      </div>

      {/* Total level row */}
      <div className={s.total}>
        <span className={cn('ao-overline', s.totalLabel)}>{t('cmp.multiclass.totalLevel')}</span>
        <span className={s.totalValue}>{totalLevel}</span>
      </div>
    </OrdoPanel>
  );
}
