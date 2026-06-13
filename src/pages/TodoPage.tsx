import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './TodoPage.module.css';

interface TodoPageProps {
  title?: string;
}

export default function TodoPage({ title }: TodoPageProps) {
  const t = useT();
  return (
    <div className={cn('ao-panel ao-frame', s.panel)}>
      <span className="ao-frame-c" />
      <p className={cn('ao-overline', s.overlineGold)}>
        {title ?? t('player.todo.title')}
      </p>
      <h3 className="ao-h3">{t('player.todo.body')}</h3>
    </div>
  );
}
