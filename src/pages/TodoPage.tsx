interface TodoPageProps {
  title?: string;
}

export default function TodoPage({ title = 'TODO' }: TodoPageProps) {
  return (
    <div className="ao-panel ao-frame" style={{ padding: 24 }}>
      <span className="ao-frame-c" />
      <p className="ao-overline" style={{ color: 'var(--gold)', marginBottom: 8 }}>
        {title}
      </p>
      <h3 className="ao-h3">TODO: функционал страницы</h3>
    </div>
  );
}
