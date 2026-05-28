import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Panel, PanelHeader, Button, Rune, AlertDialog } from '@/components/ao';
import { CharacterCard } from '@/components/characters/CharacterCard';
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
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 16 }}>Failed to load characters</p>
        <Button variant="ghost" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="ao-h2">My Characters</h1>
        <Button
          variant="primary"
          icon={<Rune kind="plus" size={14} />}
          onClick={() => navigate('/characters/new')}
        >
          Create Character
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Panel key={i} style={{ height: 180 }} className="ao-breathe">
              <div style={{ background: 'var(--surface)', height: '100%', borderRadius: 4 }} />
            </Panel>
          ))}
        </div>
      ) : !characters || characters.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Rune kind="sword" size={64} color="var(--gold-dim)" style={{ marginBottom: 16 }} />
          <h2 className="ao-h3" style={{ marginBottom: 8 }}>No Characters Yet</h2>
          <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>
            Create your first character to begin your adventure!
          </p>
          <Button
            variant="primary"
            icon={<Rune kind="plus" size={14} />}
            onClick={() => navigate('/characters/new')}
          >
            Create Your First Character
          </Button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Character?"
        description="This action cannot be undone. This character and all their data will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
