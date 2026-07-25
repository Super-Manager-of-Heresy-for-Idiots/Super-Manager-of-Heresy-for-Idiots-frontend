import { Link } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useCampaignStorage } from '@/hooks/useCampaigns';
import { useT } from '@/i18n/I18nContext';
import s from './CampStoragePanel.module.css';

interface CampStoragePanelProps {
  campaignId: string;
}

/**
 * Общий склад отряда на экране лагеря. Отдельного склада привал не заводит:
 * показывается сводка существующих контейнеров кампании, а перенос предметов
 * выполняется на странице склада, где эта механика уже реализована.
 */
export function CampStoragePanel({ campaignId }: CampStoragePanelProps) {
  const t = useT();
  const { data: containers, isLoading } = useCampaignStorage(campaignId);

  const totalItems = (containers ?? []).reduce((sum, container) => sum + container.items.length, 0);

  return (
    <OrdoPanel padding={0}>
      <PanelHeader
        title={t('campfire.storage.title')}
        sub={t('campfire.storage.sub')}
        glyph="square-rot"
        right={(
          <Link className="ao-btn ao-btn--sm" to="../storage">
            <Rune kind="arrow-r" size={11} />
            {t('campfire.storage.open')}
          </Link>
        )}
      />

      <div className={s.body}>
        {isLoading && <span className={`ao-italic ${s.quiet}`}>{t('campfire.loading')}</span>}

        {!isLoading && (containers ?? []).length === 0 && (
          <span className={`ao-italic ${s.quiet}`}>{t('campfire.storage.empty')}</span>
        )}

        {(containers ?? []).map((container) => (
          <div key={container.id} className={s.row}>
            <Rune kind="square-rot" size={13} color="var(--bronze-warm)" />
            <span className={s.name}>{container.name}</span>
            <span className="ao-codex">
              {t('campfire.storage.count', { count: container.items.length })}
            </span>
          </div>
        ))}

        {!isLoading && (containers ?? []).length > 0 && (
          <span className={`ao-codex ${s.total}`}>
            {t('campfire.storage.total', { count: totalItems })}
          </span>
        )}
      </div>
    </OrdoPanel>
  );
}
