import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, Sword } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <Card className="border-gold/20 hover:border-gold/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gold/20 flex items-center justify-center">
              <Sword className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-lg">{character.name}</h3>
              <p className="text-sm text-muted-foreground">
                {character.race?.name} {character.characterClass?.name}
              </p>
            </div>
          </div>
          <Badge variant="gold">Lv. {character.level}</Badge>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`${basePath}/${character.id}`)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {!readOnly && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`${basePath}/${character.id}/edit`)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(character.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
