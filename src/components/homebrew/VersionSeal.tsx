import { cn } from '@/lib/utils';

interface VersionSealProps {
  version: number | string;
  size?: number;
  className?: string;
}

export function VersionSeal({ version, size = 44, className }: VersionSealProps) {
  return (
    <div
      className={cn('relative flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 border border-gold/30 bg-card"
        style={{ clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)' }}
      />
      <div className="relative text-center leading-none">
        <div className="text-[8px] uppercase tracking-widest text-muted-foreground">VER</div>
        <div className="font-heading font-semibold text-gold" style={{ fontSize: size * 0.38 }}>
          {version}
        </div>
      </div>
    </div>
  );
}
