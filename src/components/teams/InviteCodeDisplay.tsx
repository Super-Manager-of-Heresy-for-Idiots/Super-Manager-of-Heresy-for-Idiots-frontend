import { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface InviteCodeDisplayProps {
  code: string;
}

export function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
      <span className="text-sm font-mono flex-1">
        {visible ? code : '••••••••'}
      </span>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setVisible(!visible)}>
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
