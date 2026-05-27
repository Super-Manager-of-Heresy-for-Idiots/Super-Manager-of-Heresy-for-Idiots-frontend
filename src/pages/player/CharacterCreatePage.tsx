import { useNavigate } from 'react-router-dom';
import { CharacterForm } from '@/components/characters/CharacterForm';
import { useCreateCharacter } from '@/hooks/useCharacters';

export default function CharacterCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateCharacter();

  const handleSubmit = (data: { name: string; level: number; classId: string; raceId: string }) => {
    createMutation.mutate(data, {
      onSuccess: (response) => {
        navigate(`/characters/${response.data.id}`);
      },
    });
  };

  return (
    <div>
      <CharacterForm
        title="Create New Character"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
