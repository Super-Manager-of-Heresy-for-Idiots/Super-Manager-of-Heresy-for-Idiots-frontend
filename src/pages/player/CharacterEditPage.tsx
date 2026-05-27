import { useNavigate, useParams } from 'react-router-dom';
import { CharacterForm } from '@/components/characters/CharacterForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
    return <Skeleton className="h-96 max-w-2xl mx-auto" />;
  }

  if (error || !character) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load character</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <CharacterForm
        title="Edit Character"
        character={character}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
