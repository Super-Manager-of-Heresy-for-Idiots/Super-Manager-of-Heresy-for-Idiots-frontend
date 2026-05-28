import { Badge } from '@/components/ui/badge';
import { Diamond, Lock, Minus, XCircle, Check } from 'lucide-react';

type BadgeStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED' | 'INSTALLED';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const STATUS_MAP: Record<BadgeStatus, { icon: React.ReactNode; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'gold' }> = {
  DRAFT:       { icon: <Minus className="h-3 w-3" />,    label: 'Draft',     variant: 'secondary' },
  PUBLISHED:   { icon: <Diamond className="h-3 w-3" />,  label: 'Sealed',    variant: 'gold' },
  UNPUBLISHED: { icon: <Lock className="h-3 w-3" />,     label: 'Withheld',  variant: 'outline' },
  DELETED:     { icon: <XCircle className="h-3 w-3" />,  label: 'Redacted',  variant: 'destructive' },
  INSTALLED:   { icon: <Check className="h-3 w-3" />,    label: 'Instated',  variant: 'default' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const m = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <Badge variant={m.variant} className="gap-1 text-[10px] uppercase tracking-wider">
      {m.icon}
      {m.label}
    </Badge>
  );
}
