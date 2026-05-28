import { ArrowUp } from 'lucide-react';

interface DownloadsProps {
  value: number;
}

export function Downloads({ value }: DownloadsProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <ArrowUp className="h-3 w-3" />
      <span className="text-sm font-mono text-foreground">{value.toLocaleString()}</span>
      <span className="text-[9px] uppercase tracking-wider">instated</span>
    </span>
  );
}
