import { useNavigate } from 'react-router-dom';
import { Panel, Button, Chip, Rune, Divider } from '@/components/ao';
import type { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  onDelete: (id: string) => void;
  basePath?: string;
  readOnly?: boolean;
}

export function CharacterCard({ character, onDelete, basePath = '/characters', readOnly = false }: CharacterCardProps) {
  const navigate = useNavigate();

  return (
    <Panel frame className="ao-rise">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--gold-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Rune kind="sword" size={22} color="var(--gold)" />
          </div>
          <div>
            <div className="ao-h4" style={{ margin: 0 }}>{character.name}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              {character.race?.name} {character.characterClass?.name}
            </div>
          </div>
        </div>
        <Chip tone="gold">Lv. {character.level}</Chip>
      </div>

      <Divider />

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button
          variant="ghost"
          size="sm"
          icon={<Rune kind="eye" size={14} />}
          onClick={() => navigate(`${basePath}/${character.id}`)}
          style={{ flex: 1 }}
        >
          View
        </Button>
        {!readOnly && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={<Rune kind="scroll" size={14} />}
              onClick={() => navigate(`${basePath}/${character.id}/edit`)}
              style={{ flex: 1 }}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Rune kind="x" size={14} />}
              onClick={() => onDelete(character.id)}
            />
          </>
        )}
      </div>
    </Panel>
  );
}
