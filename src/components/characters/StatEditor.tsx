import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CharacterStatResponse } from '@/types';

interface StatEditorProps {
  stat: CharacterStatResponse;
  onSave: (value: number) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function StatEditor({ stat, onSave, onCancel, isSaving }: StatEditorProps) {
  const [value, setValue] = useState(stat.value);

  const handleSave = () => {
    if (value >= 1 && value <= 30) {
      onSave(value);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 rounded-lg border-2 border-gold bg-gold/10 min-w-[100px]">
      <span className="text-xs font-heading font-semibold text-gold uppercase tracking-wider mb-2">
        {stat.statTypeName.length > 3 ? stat.statTypeName.slice(0, 3).toUpperCase() : stat.statTypeName.toUpperCase()}
      </span>
      <Input
        type="number"
        min={1}
        max={30}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
        className="w-20 text-center text-lg font-bold"
        autoFocus
      />
      <div className="flex gap-1 mt-2">
        <Button size="icon" variant="ghost" onClick={handleSave} disabled={isSaving} className="h-7 w-7">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-500" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={onCancel} disabled={isSaving} className="h-7 w-7">
          <X className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}
