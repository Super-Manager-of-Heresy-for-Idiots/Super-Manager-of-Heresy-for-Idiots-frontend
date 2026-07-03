import { useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import s from './messenger.module.css';

/**
 * Message composer. Enter sends, Shift+Enter inserts a newline. Emits a throttled typing signal while
 * the user writes and a "stopped typing" signal shortly after they pause.
 */
export function MessageInput({
  disabled,
  onSend,
  onTyping,
}: {
  disabled: boolean;
  onSend: (body: string) => void;
  onTyping: (typing: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const typingResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submit = () => {
    const body = value.trim();
    if (!body || disabled) return;
    onSend(body);
    setValue('');
    onTyping(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleChange = (next: string) => {
    setValue(next);
    onTyping(true);
    if (typingResetRef.current) clearTimeout(typingResetRef.current);
    typingResetRef.current = setTimeout(() => onTyping(false), 2500);
  };

  return (
    <div className={s.inputBar}>
      <textarea
        className={s.textarea}
        value={value}
        placeholder={disabled ? 'Сессия закрыта' : 'Написать сообщение…'}
        disabled={disabled}
        maxLength={2000}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button type="button" className={cn('ao-btn', 'ao-btn--primary')} disabled={disabled} onClick={submit}>
        Отправить
      </button>
    </div>
  );
}
