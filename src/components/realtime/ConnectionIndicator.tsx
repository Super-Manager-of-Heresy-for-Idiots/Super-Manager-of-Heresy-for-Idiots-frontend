import { useWsStore, type ConnectionState } from '@/store/wsStore';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './ConnectionIndicator.module.css';

const STATE_LABEL: Record<ConnectionState, string> = {
  connected: 'camp.ws.connected',
  reconnecting: 'camp.ws.reconnecting',
  offline: 'camp.ws.offline',
};

/**
 * Small live dot + label reflecting the campaign WebSocket connection state.
 * Reads the shared ws store, so it stays in sync with auto-reconnect transitions.
 */
export function ConnectionIndicator() {
  const t = useT();
  const state = useWsStore((st) => st.connectionState);
  const label = t(STATE_LABEL[state]);

  return (
    <span className={cn(s.wrap, s[state])} role="status" aria-live="polite" title={label}>
      <span className={s.dot} aria-hidden="true" />
      <span className={s.label}>{label}</span>
    </span>
  );
}
