import { useT } from '@/i18n/I18nContext';

interface TodoPageProps {
  title?: string;
}

export default function TodoPage({ title }: TodoPageProps) {
  const t = useT();
  return (
    <div className="ao-panel ao-frame" style={{ padding: 24 }}>
      <span className="ao-frame-c" />
      <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 8 }}>
        {title ?? t('player.todo.title')}
      </p>
      <h3 className="ao-h3">{t('player.todo.body')}</h3>
    </div>
  );
}
