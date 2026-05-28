import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Plus, Diamond, Lock, Flame, ScrollText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads } from '@/components/homebrew';
import { useMyPackages, useDeleteHomebrew, usePublishHomebrew, useUnpublishHomebrew } from '@/hooks/useHomebrew';
import { useAuthStore } from '@/store/authStore';
import { formatTimeAgo } from '@/lib/utils';
import type { HomebrewPackageResponse, HomebrewStatus } from '@/types';

type FilterStatus = 'all' | HomebrewStatus | 'DELETED';

export default function MyDoctrinesPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const statusParam = filter === 'all' ? undefined : filter;
  const { data: pageData, isLoading } = useMyPackages({ status: statusParam as HomebrewStatus | 'DELETED' | undefined, page, size: 20 });
  const deleteMutation = useDeleteHomebrew();
  const publishMutation = usePublishHomebrew();
  const unpublishMutation = useUnpublishHomebrew();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
    }
  };

  const statusCounts = {
    draft: packages.filter((p) => p.status === 'DRAFT').length,
    published: packages.filter((p) => p.status === 'PUBLISHED').length,
    unpublished: packages.filter((p) => p.status === 'UNPUBLISHED').length,
    deleted: packages.filter((p) => p.isDeleted).length,
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <Card>
        <div className="grid grid-cols-5">
          <div className="p-5 border-r flex items-center gap-3 col-span-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Game-Master · {user?.username}</p>
              <h2 className="font-heading font-semibold mt-1">Private Archive</h2>
              <p className="text-xs text-muted-foreground">restricted workshop</p>
            </div>
          </div>
          {[
            { l: 'Drafts', v: statusCounts.draft },
            { l: 'Sealed', v: statusCounts.published, gold: true },
            { l: 'Withheld', v: statusCounts.unpublished },
            { l: 'Redacted', v: statusCounts.deleted, danger: true },
          ].map((s, i) => (
            <div key={i} className={`p-5 ${i < 3 ? 'border-r' : ''}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
              <p className={`text-3xl font-heading mt-1 ${s.gold ? 'text-gold' : s.danger ? 'text-destructive' : 'text-muted-foreground'}`}>
                {s.v}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/gm/homebrew/marketplace')}>
            <ArrowRight className="h-4 w-4 mr-1" /> Catalogue
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/gm/homebrew/installed')}>
            <BookOpen className="h-4 w-4 mr-1" /> Instated
          </Button>
        </div>
        <Button variant="gold" size="sm" onClick={() => navigate('/gm/homebrew/new')}>
          <Plus className="h-4 w-4 mr-1" /> Author New Doctrine
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex border-b">
        {([
          { id: 'all' as FilterStatus, label: `All · ${totalElements}` },
          { id: 'DRAFT' as FilterStatus, label: `Draft · ${statusCounts.draft}` },
          { id: 'PUBLISHED' as FilterStatus, label: `Sealed · ${statusCounts.published}` },
          { id: 'UNPUBLISHED' as FilterStatus, label: `Withheld · ${statusCounts.unpublished}` },
          { id: 'DELETED' as FilterStatus, label: `Redacted · ${statusCounts.deleted}` },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => { setFilter(t.id); setPage(0); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              filter === t.id
                ? 'border-gold text-gold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <Card className="h-72 animate-pulse">
          <div className="h-full bg-muted rounded-lg" />
        </Card>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold mb-2">No Doctrines Yet</h2>
          <p className="text-muted-foreground mb-6">Author your first doctrine and publish it to the marketplace.</p>
          <Button variant="gold" onClick={() => navigate('/gm/homebrew/new')}>
            <Plus className="h-4 w-4 mr-1" /> Author Your First Doctrine
          </Button>
        </div>
      ) : (
        <Card>
          {/* Table header */}
          <div className="grid grid-cols-[60px_1fr_180px_180px_140px_120px] px-4 py-2.5 border-b bg-muted/50 items-center text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Ver</span>
            <span>Doctrine</span>
            <span>State</span>
            <span>Content</span>
            <span>Last Update</span>
            <span />
          </div>

          {packages.map((p, i) => (
            <PackageRow
              key={p.id}
              pkg={p}
              isLast={i === packages.length - 1}
              onEdit={() => navigate(`/gm/homebrew/${p.id}/edit`)}
              onPublish={() => publishMutation.mutate(p.id)}
              onUnpublish={() => unpublishMutation.mutate(p.id)}
              onDelete={() => setDeleteId(p.id)}
              onView={() => navigate(`/gm/homebrew/${p.id}/edit`)}
            />
          ))}
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redact Doctrine?</AlertDialogTitle>
            <AlertDialogDescription>
              The doctrine will be marked as deleted. GMs who already instated it will retain their reference. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Redact
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


function PackageRow({
  pkg,
  isLast,
  onEdit,
  onPublish,
  onUnpublish,
  onDelete,
  onView,
}: {
  pkg: HomebrewPackageResponse;
  isLast: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const isDeleted = pkg.isDeleted;
  const isPublished = pkg.status === 'PUBLISHED';
  const isUnpub = pkg.status === 'UNPUBLISHED';
  const isDraft = pkg.status === 'DRAFT';
  const s = pkg.contentSummary;

  return (
    <div
      className={`grid grid-cols-[60px_1fr_180px_180px_140px_120px] px-4 py-4 items-center relative ${
        !isLast ? 'border-b' : ''
      } ${isDeleted ? 'bg-destructive/5 opacity-85' : ''}`}
    >
      <VersionSeal version={isDraft ? '—' : pkg.version} size={40} />

      <div>
        <div className="flex items-center gap-2">
          <span className={`font-heading font-medium text-[15px] ${isDeleted ? 'text-muted-foreground line-through decoration-destructive/60' : ''}`}>
            {pkg.title}
          </span>
          {isDeleted && (
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-destructive/20 text-destructive font-mono">
              [REDACTED]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-mono text-muted-foreground">{pkg.id.substring(0, 8)}</span>
          <span className="text-xs text-muted-foreground">·</span>
          <div className="flex gap-1">
            {pkg.tags.slice(0, 3).map((t) => <HBTag key={t}>{t}</HBTag>)}
            {pkg.tags.length > 3 && <span className="text-xs text-muted-foreground">+{pkg.tags.length - 3}</span>}
          </div>
        </div>
      </div>

      <div>
        <StatusBadge status={isDeleted ? 'DELETED' : pkg.status} />
        {isPublished && <div className="mt-1"><Downloads value={pkg.downloadCount} /></div>}
        {isDeleted && <p className="text-xs text-destructive/70 mt-1">{pkg.downloadCount} installs persist</p>}
      </div>

      <div>
        <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} compact />
      </div>

      <div className="text-xs text-muted-foreground">{formatTimeAgo(pkg.createdAt)}</div>

      <div className="flex gap-1 justify-end">
        {isDraft && (
          <Button variant="gold" size="sm" onClick={onEdit}>
            <Diamond className="h-3 w-3 mr-1" /> Edit
          </Button>
        )}
        {isPublished && (
          <Button variant="outline" size="sm" onClick={onUnpublish}>
            <Lock className="h-3 w-3 mr-1" /> Withhold
          </Button>
        )}
        {isUnpub && (
          <Button variant="gold" size="sm" onClick={onPublish}>
            <Diamond className="h-3 w-3 mr-1" /> Re-Seal
          </Button>
        )}
        {!isDeleted && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} title="Delete">
            <Flame className="h-3.5 w-3.5 text-destructive" />
          </Button>
        )}
        {isDeleted && (
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onView}>
            Audit
          </Button>
        )}
      </div>
    </div>
  );
}
