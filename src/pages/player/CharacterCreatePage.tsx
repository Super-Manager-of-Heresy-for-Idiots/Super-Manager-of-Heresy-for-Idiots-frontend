import { useNavigate } from 'react-router-dom';
import { Sigil } from '@/components/ordo';
import { CharacterForm } from '@/components/characters/CharacterForm';
import { useCreateCharacter } from '@/hooks/useCharacters';
import type { CreateCharacterRequest } from '@/types';

export default function CharacterCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCharacter();

  const handleSubmit = (data: { name: string; classId?: string; raceId: string }) => {
    createMutation.mutate(data as CreateCharacterRequest, {
      onSuccess: (response) => {
        navigate(`/characters/${response.data?.id}`);
      },
    });
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Sigil size={64} glyph="sigil-2" />
        <p className="ao-codex" style={{ color: 'var(--gold)', letterSpacing: 4, marginTop: 16 }}>
          &mdash; RITE OF CREATION &mdash;
        </p>
      </div>

      <CharacterForm
        title="Create New Character"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
