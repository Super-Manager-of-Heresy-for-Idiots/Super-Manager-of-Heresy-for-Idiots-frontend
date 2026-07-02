import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import s from './ExpandableRow.module.css';

/**
 * Shared "click to reveal details" primitive.
 *
 * Extracted from the campaign-bestiary monster expander so every list
 * (bestiary, spells, items, buffs…) gets the same disclosure UX and
 * animation. Single-open accordion state is owned by each page (a plain
 * `useState<string | null>`), matching the existing bestiary behaviour.
 */

export function ExpandChevron({ open, size = 15, className }: { open: boolean; size?: number; className?: string }) {
  return <ChevronDown size={size} className={cn(s.chevron, open && s.chevronOpen, className)} aria-hidden />;
}

/**
 * Animated reveal container. Children mount on first open and then stay
 * mounted (visually collapsed) so a lazy detail query fires exactly once
 * and stays cached on re-open.
 */
export function ExpandablePanel({
  open,
  children,
  className,
  innerClassName,
}: {
  open: boolean;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  const [everOpened, setEverOpened] = useState(false);
  useEffect(() => {
    if (open) setEverOpened(true);
  }, [open]);
  return (
    <div className={cn(s.grid, open && s.gridOpen, className)}>
      <div className={s.clip}>
        <div className={cn(s.inner, open && s.innerOpen, innerClassName)}>
          {everOpened ? children : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Table variant: a full-width detail `<tr>` that expands beneath a summary
 * row. Drop it in as a sibling right after the clickable `<tr>`.
 */
export function ExpandableRow({ open, colSpan, children }: { open: boolean; colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn(s.cell, open && s.cellOpen)}>
        <ExpandablePanel open={open}>{children}</ExpandablePanel>
      </td>
    </tr>
  );
}

/** Loading / error placeholder styled to match the bestiary detail row. */
export function DetailStatus({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(s.status, className)}>{children}</div>;
}
