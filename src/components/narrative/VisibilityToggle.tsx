import { OrdoInterfaceIcon } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './VisibilityToggle.module.css';

interface VisibilityToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export function VisibilityToggle({ visible, onToggle }: VisibilityToggleProps) {
  const t = useT();
  return (
    <button onClick={onToggle} className={cn(s.toggle, visible && s.on)}>
      <OrdoInterfaceIcon
        icon={visible ? 'visible' : 'hidden'}
        size={12}
        style={{ color: visible ? '#6db86a' : 'var(--ink-ghost)' }}
      />
      {visible ? t('cmp.visibility.revealed') : t('cmp.visibility.hidden')}
    </button>
  );
}
