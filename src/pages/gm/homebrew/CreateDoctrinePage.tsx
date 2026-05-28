import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Diamond, Check, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCreateHomebrew } from '@/hooks/useHomebrew';

export default function CreateDoctrinePage() {
  const navigate = useNavigate();
  const createMutation = useCreateHomebrew();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagText, setTagText] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const isValid = title.trim().length > 0;

  const normalizeTag = (raw: string) =>
    raw.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleAddTag = () => {
    const norm = normalizeTag(tagText);
    if (norm && !tags.includes(norm) && tags.length < 10) {
      setTags([...tags, norm]);
    }
    setTagText('');
  };

  const handleSubmit = () => {
    createMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: (res) => {
          const pkg = res.data;
          navigate(`/gm/homebrew/${pkg.id}/edit`);
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/gm/homebrew/my')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Workshop
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/gm/homebrew/my')}>
            <X className="h-4 w-4 mr-1" /> Discard
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            <Diamond className="h-4 w-4 mr-1" /> Inscribe as Draft
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-wider text-gold mt-3">— RITE OF REGISTRATION —</p>
        <h1 className="text-3xl font-heading font-bold mt-2">A New Doctrine</h1>
        <p className="text-sm text-muted-foreground italic mt-2">
          Inscribe its outer form. Content shall be added once it is laid into the Workshop.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Outer Inscription</CardTitle>
          <p className="text-xs text-muted-foreground">metadata · tags · description</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Title */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <Label>Title <span className="text-destructive">· required</span></Label>
              <span className="text-xs text-muted-foreground">{title.length} / 120</span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              placeholder="Enter doctrine title..."
              className="font-heading text-lg"
            />
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <Label>Description</Label>
              <span className="text-xs text-muted-foreground">{description.length} / 2000</span>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={5}
              placeholder="Describe the contents of your doctrine..."
            />
            <p className="text-xs text-muted-foreground mt-1.5">The first 240 characters appear on the catalogue card.</p>
          </div>

          {/* Tags */}
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <Label>Classification Marks</Label>
              <span className="text-xs text-muted-foreground">{tags.length} / 10 · lowercase, hyphenated</span>
            </div>
            <div className="p-2.5 bg-muted border rounded-md flex flex-wrap gap-1.5 items-center">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-gold/10 border border-gold/30 text-xs font-mono text-gold rounded-sm"
                >
                  <span className="w-1 h-1 bg-gold rotate-45" />
                  {t}
                  <button
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-foreground ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="add mark and press Enter"
                className="flex-1 min-w-[140px] bg-transparent border-0 text-foreground outline-none font-mono text-xs px-1.5 py-1"
              />
            </div>
            {tagText && (
              <p className="text-xs text-gold mt-1.5">
                will be sealed as · <span className="font-mono">{normalizeTag(tagText)}</span>
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Examples: <span className="font-mono">dark-fantasy</span> · <span className="font-mono">necromancy</span> · <span className="font-mono">imperial</span>
            </p>
          </div>

          {/* Validation strip */}
          <div className={`flex items-center gap-3 p-3 rounded-md border ${isValid ? 'border-gold/30 bg-gold/5' : 'border-destructive/30 bg-destructive/5'}`}>
            {isValid ? (
              <Check className="h-4 w-4 text-gold shrink-0" />
            ) : (
              <Minus className="h-4 w-4 text-destructive shrink-0" />
            )}
            <div className="flex-1">
              <p className={`text-xs font-medium ${isValid ? 'text-gold' : 'text-destructive'}`}>
                {isValid ? 'Inscription valid' : 'Title required'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isValid
                  ? 'Doctrine may now be registered as a draft. Content can be added afterwards.'
                  : 'Please provide a title to continue.'}
              </p>
            </div>
            <Badge variant="secondary" className="text-[10px]">DRAFT</Badge>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-muted-foreground">By registering, thou agree to the Archive Charter.</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => navigate('/gm/homebrew/my')}>Cancel</Button>
              <Button
                variant="gold"
                size="lg"
                onClick={handleSubmit}
                disabled={!isValid || createMutation.isPending}
              >
                <Diamond className="h-4 w-4 mr-1" /> Register Draft
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
