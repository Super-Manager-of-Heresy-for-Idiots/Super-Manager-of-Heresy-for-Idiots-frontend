import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardCardProps {
  title: string;
  value: number | undefined;
  icon: React.ReactNode;
  href: string;
  isLoading: boolean;
}

export function DashboardCard({ title, value, icon, href, isLoading }: DashboardCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="border-gold/20 hover:border-gold/40 transition-colors cursor-pointer"
      onClick={() => navigate(href)}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-heading font-bold text-gold">{value ?? 0}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center text-gold">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
