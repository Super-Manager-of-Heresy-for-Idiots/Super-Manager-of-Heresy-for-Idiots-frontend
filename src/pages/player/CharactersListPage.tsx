import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CharacterCard } from '@/components/characters/CharacterCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCharacters, useDeleteCharacter } from '@/hooks/useCharacters';

export default function CharactersListPage() {
  const navigate = useNavigate();
  const { data: characters, isLoading, error, refetch } = useCharacters();
  const deleteMutation = useDeleteCharacter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground mb-4">Failed to load characters</p>
        <Button variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">My Characters</h1>
        <Button variant="gold" onClick={() => navigate('/characters/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Character
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !characters || characters.length === 0 ? (
        <div className="text-center py-16">
          <Sword className="h-16 w-16 text-gold/30 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold mb-2">No Characters Yet</h2>
          <p className="text-muted-foreground mb-6">Create your first character to begin your adventure!</p>
          <Button variant="gold" onClick={() => navigate('/characters/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Character
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Character?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This character and all their data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
