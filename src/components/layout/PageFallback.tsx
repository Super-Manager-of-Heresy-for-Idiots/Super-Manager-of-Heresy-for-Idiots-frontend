import { Loader2 } from 'lucide-react';
import s from './PageFallback.module.css';

/**
 * Suspense fallback for lazily-loaded route chunks.
 * Centered, minimal — keeps the surrounding shell (rail/header/campaign nav) intact.
 */
export function PageFallback() {
  return (
    <div className={s.wrap} role="status" aria-live="polite">
      <Loader2 size={22} className={`animate-spin ${s.spinner}`} />
    </div>
  );
}
