import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ScrollText, BookOpen, Flame, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { VersionSeal, StatusBadge, ContentPills } from '@/components/homebrew';
import { useInstalledPackages, useUninstallPackage } from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { InstalledHomebrewResponse } from '@/types';

export default function InstalledDoctrinesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const { data: pageData, isLoading } = useInstalledPackages({ page, size: 20 });
  const uninstallMutation = useUninstallPackage();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  const activeCount = packages.filter((p) => !p.isDeleted).length;
  const redactedCount = packages.filter((p) => p.isDeleted).length;

  const handleRevoke = () => {
    if (revokeId) {
      uninstallMutation.mutate(revokeId, { onSuccess: () => setRevokeId(null) });
    }
  };

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">References · not copies</p>
          <h1 className="text-2xl font-heading font-bold mt-1">Linked Doctrines</h1>
          <p className="text-sm text-muted-foreground italic mt-1 max-w-xl">
            The Archive grants reference, not possession. Should an author redact a doctrine, thy link shall be marked but not severed.
          </p>
        </div>
        <div className="flex gap-6 items-end">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Active</p>
            <p className="text-2xl font-heading">{activeCount}</p>
          </div>
          <div className="w-px h-9 bg-border" />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Redacted</p>
            <p className="text-2xl font-heading text-destructive">{redactedCount}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/gm/homebrew/marketplace')}>
          <ArrowRight className="h-4 w-4 mr-1" /> Catalogue
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/gm/homebrew/my')}>
          <ScrollText className="h-4 w-4 mr-1" /> My Doctrines
        </Button>
      </div>

      {/* Redacted warning */}
      {redactedCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-destructive/5 border-l-2 border-destructive border rounded-md">
          <Flame className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-destructive">
              {redactedCount} doctrine{redactedCount > 1 ? 's have' : ' has'} been redacted
            </p>
            <p className="text-xs text-muted-foreground italic mt-0.5">
              Reference persists; no further updates shall arrive.
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <Card className="h-96 animate-pulse">
          <div className="h-full bg-muted rounded-lg" />
        </Card>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold mb-2">No Instated Doctrines</h2>
          <p className="text-muted-foreground mb-6">Browse the catalogue and instate doctrines to gain reference.</p>
          <Button variant="gold" onClick={() => navigate('/gm/homebrew/marketplace')}>
            <ArrowRight className="h-4 w-4 mr-1" /> Browse Catalogue
          </Button>
        </div>
      ) : (
        <Card>
          {packages.map((p, i) => (
            <InstalledRow
              key={p.installationId}
              pkg={p}
              isLast={i === packages.length - 1}
              onView={() => navigate(`/gm/homebrew/marketplace/${p.packageId}`)}
              onRevoke={() => setRevokeId(p.installationId)}
            />
          ))}
          <div className="py-3 text-center bg-muted/50 border-t">
            <span className="text-xs text-muted-foreground">{totalElements} instatement{totalElements !== 1 ? 's' : ''}</span>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Instatement?</AlertDialogTitle>
            <AlertDialogDescription>
              The doctrine reference will be removed. Content from this doctrine will no longer be available in your sessions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InstalledRow({
  pkg,
  isLast,
  onView,
  onRevoke,
}: {
  pkg: InstalledHomebrewResponse;
  isLast: boolean;
  onView: () => void;
  onRevoke: () => void;
}) {
  const deleted = pkg.isDeleted;
  const s = pkg.contentSummary;

  return (
    <div className={`grid grid-cols-[56px_1.2fr_140px_1fr_140px_180px] items-center gap-3 px-4 py-4 ${!isLast ? 'border-b' : ''} ${deleted ? 'bg-destructive/5' : ''}`}>
      <VersionSeal version={pkg.sourceVersion} size={42} />

      <div>
        <div className="flex items-center gap-2">
          <span className={`font-heading font-medium text-[15px] ${deleted ? 'text-muted-foreground line-through decoration-destructive/60' : ''}`}>
            {pkg.title}
          </span>
          {deleted && (
            <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-destructive/20 text-destructive font-mono">
              [REDACTED]
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          by <span className="text-foreground">{pkg.authorUsername}</span> · {pkg.packageId.substring(0, 8)}
        </p>
      </div>

      <div>
        {deleted ? <StatusBadge status="DELETED" /> : <StatusBadge status="PUBLISHED" />}
        <p className="text-xs text-muted-foreground mt-1">{deleted ? 'reference persists' : 'live link'}</p>
      </div>

      <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} compact />

      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Instated</p>
        <p className="text-xs">{formatDate(pkg.installedAt)}</p>
      </div>

      <div className="flex gap-1.5 justify-end">
        {!deleted && (
          <Button variant="outline" size="sm" onClick={onView}>
            <BookOpen className="h-3 w-3 mr-1" /> View
          </Button>
        )}
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={onRevoke}>
          <X className="h-3 w-3 mr-1" /> Revoke
        </Button>
      </div>
    </div>
  );
}
