import { useNavigate, useParams } from 'react-router-dom';
import { Panel, Button } from '@/components/ao';
import { CharacterForm } from '@/components/characters/CharacterForm';
import { useCharacter, useUpdateCharacter } from '@/hooks/useCharacters';

export default function CharacterEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading, error, refetch } = useCharacter(id!);
  const updateMutation = useUpdateCharacter();

  const handleSubmit = (data: { name: string; level: number; classId: string; raceId: string }) => {
    updateMutation.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          navigate(`/characters/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Panel style={{ height: 384 }} className="ao-breathe">
          <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
        </Panel>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load character</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <CharacterForm
      title="Edit Character"
      character={character}
      onSubmit={handleSubmit}
      isSubmitting={updateMutation.isPending}
    />
  );
}
