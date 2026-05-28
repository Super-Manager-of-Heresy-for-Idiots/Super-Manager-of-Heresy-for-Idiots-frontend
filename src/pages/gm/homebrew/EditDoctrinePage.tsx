import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Diamond, BookOpen, Flame, Plus, X, Sword, Shield, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { ContentPills } from '@/components/homebrew';
import {
  useMyPackage,
  useUpdateHomebrew,
  useAddContent,
  useRemoveContent,
  usePublishHomebrew,
  useDeleteHomebrew,
} from '@/hooks/useHomebrew';
import { adminApi } from '@/api/admin.api';
import type { ContentType } from '@/types';

const CONTENT_GROUPS: { title: string; icon: React.ElementType; type: ContentType }[] = [
  { title: 'Items', icon: Sword, type: 'ITEM_TYPE' },
  { title: 'Classes', icon: Shield, type: 'CHARACTER_CLASS' },
  { title: 'Skills', icon: Eye, type: 'SKILL' },
  { title: 'Feats', icon: Star, type: 'FEAT' },
];

export default function EditDoctrinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: pkg, isLoading } = useMyPackage(id);
  const updateMutation = useUpdateHomebrew();
  const addContentMutation = useAddContent();
  const removeContentMutation = useRemoveContent();
  const publishMutation = usePublishHomebrew();
  const deleteMutation = useDeleteHomebrew();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagText, setTagText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [metaLoaded, setMetaLoaded] = useState(false);

  const [adding, setAdding] = useState(false);
  const [addType, setAddType] = useState<ContentType>('ITEM_TYPE');
  const [addSearch, setAddSearch] = useState('');
  const [showPublish, setShowPublish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: itemTypes } = useQuery({
    queryKey: ['item-types'],
    queryFn: async () => (await adminApi.getItemTypes()).data,
  });
  const { data: charClasses } = useQuery({
    queryKey: ['character-classes'],
    queryFn: async () => (await adminApi.getCharacterClasses()).data,
  });
  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => (await adminApi.getSkills()).data,
  });
  const { data: feats } = useQuery({
    queryKey: ['feats'],
    queryFn: async () => (await adminApi.getFeats()).data,
  });

  if (pkg && !metaLoaded) {
    setTitle(pkg.title);
    setDescription(pkg.description || '');
    setTags(pkg.tags);
    setMetaLoaded(true);
  }

  if (isLoading || !pkg) {
    return (
      <Card className="h-96 animate-pulse">
        <div className="h-full bg-muted rounded-lg" />
      </Card>
    );
  }

  const isDraft = pkg.status === 'DRAFT';
  const s = pkg.contentSummary;
  const contentByType = pkg.contentByType || {};

  const normalizeTag = (raw: string) =>
    raw.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleAddTag = () => {
    const norm = normalizeTag(tagText);
    if (norm && !tags.includes(norm) && tags.length < 10) {
      setTags([...tags, norm]);
    }
    setTagText('');
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: pkg.id,
      data: {
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      },
    });
  };

  const handleAddContent = () => {
    if (!addSearch.trim()) return;
    const searchLower = addSearch.toLowerCase();
    let contentId: string | undefined;

    if (addType === 'ITEM_TYPE') {
      contentId = itemTypes?.find((i) => i.name.toLowerCase().includes(searchLower))?.id;
    } else if (addType === 'CHARACTER_CLASS') {
      contentId = charClasses?.find((c) => c.name.toLowerCase().includes(searchLower))?.id;
    } else if (addType === 'SKILL') {
      contentId = skills?.find((s) => s.name.toLowerCase().includes(searchLower))?.id;
    } else if (addType === 'FEAT') {
      contentId = feats?.find((f) => f.name.toLowerCase().includes(searchLower))?.id;
    }

    if (contentId) {
      addContentMutation.mutate(
        { packageId: pkg.id, data: { contentType: addType, contentId } },
        { onSuccess: () => setAddSearch('') },
      );
    }
  };

  const handleRemoveContent = (contentItemId: string) => {
    removeContentMutation.mutate({ packageId: pkg.id, contentItemId });
  };

  const handlePublish = () => {
    publishMutation.mutate(pkg.id, { onSuccess: () => setShowPublish(false) });
  };

  const handleDelete = () => {
    deleteMutation.mutate(pkg.id, {
      onSuccess: () => {
        setShowDelete(false);
        navigate('/gm/homebrew/my');
      },
    });
  };

  const getAvailableContent = () => {
    const searchLower = addSearch.toLowerCase();
    if (addType === 'ITEM_TYPE') return (itemTypes || []).filter((i) => i.name.toLowerCase().includes(searchLower));
    if (addType === 'CHARACTER_CLASS') return (charClasses || []).filter((c) => c.name.toLowerCase().includes(searchLower));
    if (addType === 'SKILL') return (skills || []).filter((s) => s.name.toLowerCase().includes(searchLower));
    if (addType === 'FEAT') return (feats || []).filter((f) => f.name.toLowerCase().includes(searchLower));
    return [];
  };

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/gm/homebrew/my')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Workshop
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant={isDraft ? 'secondary' : 'gold'}>{pkg.status}</Badge>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
            <Diamond className="h-4 w-4 mr-1" /> Save Draft
          </Button>
          {isDraft && (
            <Button variant="gold" size="sm" onClick={() => setShowPublish(true)}>
              <Diamond className="h-4 w-4 mr-1" /> Seal & Publish
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-mono">{pkg.id.substring(0, 8)} · {pkg.title} · {pkg.status}</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        {/* LEFT: metadata */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outer Inscription</CardTitle>
              <p className="text-xs text-muted-foreground">editable · draft state</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 120))} className="font-heading" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 2000))} rows={5} />
              </div>
              <div>
                <Label>Marks</Label>
                <div className="p-2 bg-muted border rounded-md flex flex-wrap gap-1.5">
                  {tags.map((t, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/10 border border-gold/30 text-xs font-mono text-gold rounded-sm">
                      <span className="w-1 h-1 bg-gold rotate-45" />
                      {t}
                      <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="ml-0.5 text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagText}
                    onChange={(e) => setTagText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="+ add"
                    className="flex-1 min-w-[60px] bg-transparent border-0 text-foreground outline-none font-mono text-xs px-1 py-0.5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifecycle</CardTitle>
              <p className="text-xs text-muted-foreground">actions available in {pkg.status}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {isDraft && (
                <Button variant="gold" className="w-full" onClick={() => setShowPublish(true)} disabled={publishMutation.isPending}>
                  <Diamond className="h-4 w-4 mr-1" /> Seal & Publish (v {pkg.version + 1})
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={handleSave} disabled={updateMutation.isPending}>
                <Diamond className="h-4 w-4 mr-1" /> Save as Draft
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate(`/gm/homebrew/marketplace/${pkg.id}`)}>
                <BookOpen className="h-4 w-4 mr-1" /> Preview as Reader
              </Button>
              <Button variant="ghost" className="w-full text-destructive" onClick={() => setShowDelete(true)} disabled={deleteMutation.isPending}>
                <Flame className="h-4 w-4 mr-1" /> Redact (Soft Delete)
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Content Folio</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {s.itemTypeCount} items · {s.classCount} classes · {s.skillCount} skills · {s.featCount} feats
              </p>
            </div>
            <Button variant="gold" size="sm" onClick={() => setAdding(!adding)}>
              <Plus className="h-4 w-4 mr-1" /> {adding ? 'Close' : 'Slot New Entry'}
            </Button>
          </CardHeader>

          {adding && (
            <div className="px-6 pb-4 border-b bg-muted/30">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Slot a content reference</p>
              <div className="grid grid-cols-[120px_1fr_auto] gap-2">
                <Select value={addType} onValueChange={(v) => { setAddType(v as ContentType); setAddSearch(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ITEM_TYPE">Item</SelectItem>
                    <SelectItem value="CHARACTER_CLASS">Class</SelectItem>
                    <SelectItem value="SKILL">Skill</SelectItem>
                    <SelectItem value="FEAT">Feat</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search by name..."
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddContent(); } }}
                />
                <Button variant="gold" onClick={handleAddContent} disabled={addContentMutation.isPending}>
                  <Plus className="h-4 w-4 mr-1" /> Slot
                </Button>
              </div>
              {addSearch && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {getAvailableContent().slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        addContentMutation.mutate(
                          { packageId: pkg.id, data: { contentType: addType, contentId: item.id } },
                          { onSuccess: () => setAddSearch('') },
                        );
                      }}
                      className="px-2.5 py-1 bg-muted border rounded text-sm hover:bg-accent transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <CardContent className="p-0">
            {CONTENT_GROUPS.map((grp) => {
              const rows = contentByType[grp.type] || [];
              const Icon = grp.icon;
              return (
                <div key={grp.type}>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-t border-b">
                    <Icon className="h-3.5 w-3.5 text-gold" />
                    <span className="text-xs font-medium">{grp.title}</span>
                    <span className="text-xs text-muted-foreground">· {rows.length}</span>
                  </div>
                  {rows.length === 0 ? (
                    <div className="px-4 py-4 text-center text-sm text-muted-foreground italic">
                      No {grp.title.toLowerCase()} slotted yet.
                    </div>
                  ) : (
                    rows.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0">
                        <div className="w-9 h-9 shrink-0 flex items-center justify-center bg-card rounded border border-gold/20">
                          <Icon className="h-4 w-4 text-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-medium text-[15px]">{r.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.description ? r.description.substring(0, 80) : '—'}
                            {r.slot && ` · ${r.slot}`}
                            {r.skillType && ` · ${r.skillType}`}
                            {r.prerequisites && ` · req: ${r.prerequisites}`}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveContent(r.id)} title="Remove">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showPublish} onOpenChange={setShowPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seal & Publish Doctrine?</AlertDialogTitle>
            <AlertDialogDescription>
              Once sealed, "{pkg.title}" shall be entered into the Forbidden Catalogue and made visible to all. The version shall advance to v{pkg.version + 1}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Defer</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish}>Seal & Publish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redact Doctrine?</AlertDialogTitle>
            <AlertDialogDescription>
              The doctrine will be marked as deleted. GMs who already instated it will retain their reference. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Redact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
