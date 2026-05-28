import { useState } from 'react';
import { Flame, X, Check, Minus, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/homebrew';
import {
  useAdminHomebrewPackages,
  useAdminHardDelete,
  useAdminTags,
  useAdminDeleteTag,
} from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { HomebrewStatus, HomebrewPackageResponse, HomebrewTagResponse } from '@/types';

type AdminTab = 'moderation' | 'tags';

export default function AdminHomebrewPage() {
  const [tab, setTab] = useState<AdminTab>('moderation');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-10 w-10 text-destructive" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Master Archive</p>
            <h1 className="text-xl font-heading font-bold">Inquisitorial Ledger</h1>
          </div>
        </div>
        <Badge variant="destructive" className="gap-1">
          <Flame className="h-3 w-3" /> Inquisitor access
        </Badge>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setTab('moderation')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'moderation' ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Doctrine Moderation
        </button>
        <button
          onClick={() => setTab('tags')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'tags' ? 'border-gold text-gold' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Tag Registry
        </button>
      </div>

      {tab === 'moderation' ? <ModerationPanel /> : <TagRegistryPanel />}
    </div>
  );
}

function ModerationPanel() {
  const [statusFilter, setStatusFilter] = useState<HomebrewStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusParam = statusFilter === 'all' ? undefined : statusFilter;
  const { data: pageData, isLoading } = useAdminHomebrewPackages({ status: statusParam, page, size: 20 });
  const hardDeleteMutation = useAdminHardDelete();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  const handleHardDelete = () => {
    if (deleteId) {
      hardDeleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const filtered = search
    ? packages.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.authorUsername.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
      )
    : packages;

  return (
    <>
      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Search by title, codex, or author..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80"
            />
            <div className="w-px h-6 bg-border" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
            {([
              { id: 'all' as const, label: 'All' },
              { id: 'PUBLISHED' as const, label: 'Sealed' },
              { id: 'DRAFT' as const, label: 'Draft' },
              { id: 'UNPUBLISHED' as const, label: 'Withheld' },
            ]).map((s) => (
              <Button
                key={s.id}
                variant={statusFilter === s.id ? 'gold' : 'outline'}
                size="sm"
                onClick={() => { setStatusFilter(s.id); setPage(0); }}
              >
                {s.label}
              </Button>
            ))}
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">{filtered.length} of {totalElements} rows</span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {isLoading ? (
        <Card className="h-96 animate-pulse">
          <div className="h-full bg-muted rounded-lg" />
        </Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Codex</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Doctrine</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Author</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">State</th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">v</th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Downloads</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Created</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Sealed</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <AdminDoctrineRow key={r.id} pkg={r} onHardDelete={() => setDeleteId(r.id)} />
              ))}
            </tbody>
          </table>
          <div className="flex justify-between px-4 py-3 border-t bg-muted/50">
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages || 1}</span>
            {totalPages > 1 && (
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</Button>
              </div>
            )}
          </div>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unmake this Doctrine — Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This Doctrine shall be unmade. Its content reference shall be severed from all instated Hands. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withdraw Order</AlertDialogCancel>
            <AlertDialogAction onClick={handleHardDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Authorize Unmaking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AdminDoctrineRow({ pkg, onHardDelete }: { pkg: HomebrewPackageResponse; onHardDelete: () => void }) {
  const isDeleted = pkg.isDeleted;

  return (
    <tr className={`border-b last:border-0 ${isDeleted ? 'bg-destructive/5' : ''}`}>
      <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{pkg.id.substring(0, 8)}</td>
      <td className={`px-4 py-2.5 ${isDeleted ? 'text-muted-foreground line-through' : 'font-medium'}`}>{pkg.title}</td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{pkg.authorUsername}</td>
      <td className="px-4 py-2.5"><StatusBadge status={isDeleted ? 'DELETED' : pkg.status} /></td>
      <td className="px-4 py-2.5 text-right font-mono text-gold">{pkg.version}</td>
      <td className="px-4 py-2.5 text-right font-mono">{pkg.downloadCount.toLocaleString()}</td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(pkg.createdAt)}</td>
      <td className="px-4 py-2.5 text-xs text-muted-foreground">{pkg.publishedAt ? formatDate(pkg.publishedAt) : '—'}</td>
      <td className="px-4 py-2.5 text-right">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onHardDelete} title="Hard delete">
          <Flame className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function TagRegistryPanel() {
  const { data: tags, isLoading } = useAdminTags();
  const deleteTagMutation = useAdminDeleteTag();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const allTags = tags || [];
  const filtered = search
    ? allTags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  const inUseCount = allTags.filter((t) => t.usageCount > 0).length;
  const unusedCount = allTags.filter((t) => t.usageCount === 0).length;

  const handleDeleteTag = () => {
    if (deleteId) {
      deleteTagMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Imperial Classification</p>
          <h2 className="text-xl font-heading font-bold mt-1">Classification Marks</h2>
          <p className="text-sm text-muted-foreground italic mt-1">
            Marks bind doctrines to one another.
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{allTags.length} marks · {inUseCount} in use</span>
      </div>

      {isLoading ? (
        <Card className="h-72 animate-pulse">
          <div className="h-full bg-muted rounded-lg" />
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-3 p-4 border-b">
            <Input placeholder="Search marks..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
            <Badge variant="gold" className="gap-1"><Check className="h-3 w-3" /> In use · {inUseCount}</Badge>
            <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> Unused · {unusedCount}</Badge>
            <div className="flex-1" />
            <span className="text-xs text-muted-foreground">sorted · usage descending</span>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Mark</th>
                <th className="text-right px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Doctrines using</th>
                <th className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">State</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => b.usageCount - a.usageCount)
                .map((t) => (
                  <TagRow key={t.id} tag={t} onDelete={() => setDeleteId(t.id)} />
                ))}
            </tbody>
          </table>

          <div className="p-3 bg-muted/50 border-t">
            <p className="text-xs text-muted-foreground italic">
              Marks bound to one or more doctrines cannot be unmade.
            </p>
          </div>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Classification Mark?</AlertDialogTitle>
            <AlertDialogDescription>
              This mark will be permanently removed. Only unused marks can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTag} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Mark
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TagRow({ tag, onDelete }: { tag: HomebrewTagResponse; onDelete: () => void }) {
  const inUse = tag.usageCount > 0;

  return (
    <tr className="border-b last:border-0">
      <td className="px-4 py-2.5">
        <span className="inline-flex items-center gap-2 px-2 py-1 bg-muted border rounded-sm font-mono text-xs">
          <span className={`w-1 h-1 rotate-45 ${inUse ? 'bg-gold' : 'bg-muted-foreground'}`} />
          {tag.name}
        </span>
      </td>
      <td className={`px-4 py-2.5 text-right font-mono ${inUse ? 'text-foreground' : 'text-muted-foreground'}`}>
        {tag.usageCount}
      </td>
      <td className="px-4 py-2.5">
        {inUse ? (
          <Badge variant="gold" className="gap-1"><Check className="h-3 w-3" /> In use</Badge>
        ) : (
          <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> Unused</Badge>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        <Button
          variant="ghost"
          size="icon"
          className={`h-7 w-7 ${inUse ? 'text-muted-foreground cursor-not-allowed' : 'text-destructive'}`}
          title={inUse ? `Cannot delete: in use by ${tag.usageCount} doctrines` : 'Delete mark'}
          disabled={inUse}
          onClick={onDelete}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}
