import { NavLink } from 'react-router-dom';
import { OrdoInterfaceIcon } from '@/components/ordo';
import { visibleSections, type CampaignSection } from '@/config/campaignSections';
import { useCampaignRole } from '@/hooks/useCampaignRole';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './SectionTabs.module.css';

interface SectionTabsProps {
  sections: CampaignSection[];
  /** Accessible name of the strip. */
  labelKey: string;
  className?: string;
}

/**
 * Role-filtered tab strip driven by `config/campaignSections`.
 * Used by the campaign shell and by the World / character sub-sections, so
 * every level of the campaign navigation looks and behaves the same.
 */
export function SectionTabs({ sections, labelKey, className }: SectionTabsProps) {
  const t = useT();
  const { isGm } = useCampaignRole();
  const items = visibleSections(sections, isGm);

  if (items.length <= 1) return null;

  return (
    <nav className={cn('ao-tabs', s.tabs, className)} aria-label={t(labelKey)}>
      {items.map((item) => (
        <NavLink
          key={item.to || 'index'}
          to={item.to}
          end={item.end}
          className={({ isActive }) => cn('ao-tab', isActive && 'is-active')}
        >
          <OrdoInterfaceIcon icon={item.icon} size={13} className={s.icon} />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </nav>
  );
}
