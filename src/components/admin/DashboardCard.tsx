import { useNavigate } from 'react-router-dom';
import { Panel, Rune } from '@/components/ao';

interface DashboardCardProps {
  title: string;
  value: number | undefined;
  glyph?: string;
  href: string;
  isLoading: boolean;
}

export function DashboardCard({ title, value, glyph = 'diamond', href, isLoading }: DashboardCardProps) {
  const navigate = useNavigate();

  return (
    <Panel
      frame
      className="ao-panel--hover"
      onClick={() => navigate(href)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="ao-overline">{title}</div>
          {isLoading ? (
            <div className="ao-skeleton" style={{ height: 32, width: 48, marginTop: 4 }} />
          ) : (
            <div className="ao-h4" style={{ color: 'var(--gold)', marginTop: 4 }}>
              {value ?? 0}
            </div>
          )}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--gold-a10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Rune kind={glyph} size={24} color="var(--gold)" />
        </div>
      </div>
    </Panel>
  );
}
