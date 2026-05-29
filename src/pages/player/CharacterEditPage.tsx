import { useNavigate, useParams } from 'react-router-dom';
import { Sigil } from '@/components/ordo';
import { CharacterForm } from '@/components/characters/CharacterForm';
import { useCharacter, useUpdateCharacter } from '@/hooks/useCharacters';
import type { UpdateCharacterRequest } from '@/types';

export default function CharacterEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: character, isLoading, error, refetch } = useCharacter(id!);
  const updateMutation = useUpdateCharacter();

  const handleSubmit = (data: { name: string; raceId: string }) => {
    updateMutation.mutate(
      { id: id!, data: data as UpdateCharacterRequest },
      {
        onSuccess: () => {
          navigate(`/characters/${id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px' }}>
        <div className="ao-breathe" style={{ height: 384, background: 'var(--abyss)', borderRadius: 4 }} />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Sigil size={56} glyph="eye" />
        <p className="ao-italic" style={{ color: 'var(--ink-faint)', margin: '16px 0' }}>
          Failed to load character record
        </p>
        <button className="ao-btn ao-btn--ghost" onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Sigil size={64} glyph="sigil-2" />
        <p className="ao-codex" style={{ color: 'var(--gold)', letterSpacing: 4, marginTop: 16 }}>
          &mdash; RITE OF AMENDMENT &mdash;
        </p>
      </div>

      <CharacterForm
        title="Edit Character"
        character={character}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
