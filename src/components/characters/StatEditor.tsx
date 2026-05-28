import { useState } from 'react';
import { Button, Input, Rune } from '@/components/ao';
import type { CharacterStat } from '@/types';

interface StatEditorProps {
  stat: CharacterStat;
  onSave: (value: number) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function StatEditor({ stat, onSave, onCancel, isSaving }: StatEditorProps) {
  const [value, setValue] = useState(stat.value);

  const label = stat.statType.name.length > 3
    ? stat.statType.name.slice(0, 3).toUpperCase()
    : stat.statType.name.toUpperCase();

  const handleSave = () => {
    if (value >= 1 && value <= 30) {
      onSave(value);
    }
  };

  return (
    <div
      className="ao-stat ao-frame"
      style={{ borderColor: 'var(--gold)', background: 'var(--gold-dim)' }}
    >
      <span className="ao-frame__corner ao-frame__corner--tl" />
      <span className="ao-frame__corner ao-frame__corner--tr" />
      <span className="ao-frame__corner ao-frame__corner--bl" />
      <span className="ao-frame__corner ao-frame__corner--br" />
      <div className="ao-stat__label ao-overline">{label}</div>
      <Input
        type="number"
        min={1}
        max={30}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
        style={{ width: 64, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
        autoFocus
      />
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          icon={isSaving
            ? <Rune kind="sigil-3" size={14} className="ao-spin" />
            : <Rune kind="check" size={14} color="var(--arcane)" />
          }
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSaving}
          icon={<Rune kind="x" size={14} color="var(--ember)" />}
        />
      </div>
    </div>
  );
}
