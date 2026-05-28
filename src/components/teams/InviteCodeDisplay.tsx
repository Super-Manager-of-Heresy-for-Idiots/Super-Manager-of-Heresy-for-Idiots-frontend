import { useState } from 'react';
import { Button, Rune } from '@/components/ao';
import { showToast } from '@/components/ao';

interface InviteCodeDisplayProps {
  code: string;
}

export function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    showToast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      background: 'var(--surface)',
      borderRadius: 6,
      padding: '6px 12px',
      border: '1px solid var(--rule)',
    }}>
      <span style={{
        fontSize: 13,
        fontFamily: 'var(--font-mono, monospace)',
        flex: 1,
        letterSpacing: '0.1em',
      }}>
        {visible ? code : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setVisible(!visible)}
        icon={<Rune kind={visible ? 'x' : 'eye'} size={14} />}
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        icon={<Rune kind={copied ? 'check' : 'scroll'} size={14} color={copied ? 'var(--arcane)' : undefined} />}
      />
    </div>
  );
}
