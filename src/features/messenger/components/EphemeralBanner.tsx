import { cn } from '@/lib/utils';
import type { ChatSessionStatus } from '../types';
import { formatExpiry } from '../utils/format';
import s from './messenger.module.css';

/**
 * Persistent reminder that the conversation is NOT an archive (TZ 4.2). ACTIVE sessions show the
 * idle/retention policy; CLOSED sessions show the concrete delete time.
 */
export function EphemeralBanner({
  status,
  expiresAt,
}: {
  status: ChatSessionStatus;
  expiresAt: string | null;
}) {
  if (status === 'CLOSED') {
    return (
      <div className={cn(s.banner, s.bannerClosed)}>
        Сессия закрыта{expiresAt ? ` и будет удалена ${formatExpiry(expiresAt)}` : ''}. Откройте новую,
        чтобы продолжить переписку.
      </div>
    );
  }
  return (
    <div className={s.banner}>
      Сессия будет закрыта после 24 ч без сообщений и удалена через 48 ч после закрытия
      {expiresAt ? ` — ориентировочно ${formatExpiry(expiresAt)}` : ''}.
    </div>
  );
}
