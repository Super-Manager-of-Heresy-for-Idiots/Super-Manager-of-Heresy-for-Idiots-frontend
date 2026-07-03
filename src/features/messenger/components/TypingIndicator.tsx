import { useMessengerStore } from '../state/messengerStore';
import type { UUID } from '../types';
import s from './messenger.module.css';

/** Transient "печатает…" line for the peer of the active session. */
export function TypingIndicator({ sessionId }: { sessionId: UUID }) {
  const typing = useMessengerStore((state) => state.typingBySession[sessionId]);
  return <div className={s.typing}>{typing ? `${typing.username} печатает…` : ''}</div>;
}
