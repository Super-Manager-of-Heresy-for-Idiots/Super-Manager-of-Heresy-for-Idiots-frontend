import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BookOpen, ScrollText, Diamond } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads } from '@/components/homebrew';
import { useMarketplace, useInstallPackage } from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { HomebrewPackageResponse } from '@/types';

export default function MarketplaceBrowsePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'downloads'>('newest');
  const [page, setPage] = useState(0);

  const { data: pageData, isLoading } = useMarketplace({
    search: search || undefined,
    tags: activeTags.length > 0 ? activeTags.join(',') : undefined,
    sort,
    page,
    size: 20,
  });

  const installMutation = useInstallPackage();

  const packages = pageData?.content || [];
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Imperial Catalogue</p>
          <h1 className="text-2xl font-heading font-bold mt-1">Forbidden Doctrines</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Sealed compendia inscribed by Game-Masters. Browse and instate to gain reference.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/gm/homebrew/installed')}>
            <BookOpen className="h-4 w-4 mr-1" /> Instated
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/gm/homebrew/my')}>
            <ScrollText className="h-4 w-4 mr-1" /> My Doctrines
          </Button>
          <Button variant="gold" size="sm" onClick={() => navigate('/gm/homebrew/new')}>
            <Plus className="h-4 w-4 mr-1" /> Author New
          </Button>
        </div>
      </div>

      {/* Filter rail */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
            <div className="h-6 w-px bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Sort</span>
            {([['newest', 'Newest'], ['oldest', 'Oldest'], ['downloads', 'Most Instated']] as const).map(([val, label]) => (
              <Button
                key={val}
                variant={sort === val ? 'gold' : 'outline'}
                size="sm"
                onClick={() => { setSort(val); setPage(0); }}
              >
                {label}
              </Button>
            ))}
          </div>
          {activeTags.length > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">Active Tags</span>
              {activeTags.map((tag) => (
                <HBTag key={tag} active onClick={() => { setActiveTags(activeTags.filter((t) => t !== tag)); setPage(0); }}>
                  {tag}
                </HBTag>
              ))}
              <Button variant="ghost" size="sm" onClick={() => { setActiveTags([]); setPage(0); }}>Clear</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-80 animate-pulse">
              <div className="h-full bg-muted rounded-lg" />
            </Card>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-heading font-semibold mb-2">No Doctrines Found</h2>
          <p className="text-muted-foreground mb-6">
            {search ? 'Try adjusting your search or filters.' : 'No published doctrines available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((p) => (
            <PackageCard
              key={p.id}
              pkg={p}
              onInstall={() => installMutation.mutate(p.id)}
              onView={() => navigate(`/gm/homebrew/marketplace/${p.id}`)}
              installing={installMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} · {totalElements} sealed
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>›</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  onInstall,
  onView,
  installing,
}: {
  pkg: HomebrewPackageResponse;
  onInstall: () => void;
  onView: () => void;
  installing: boolean;
}) {
  const s = pkg.contentSummary;

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
        <span className="text-xs font-mono text-muted-foreground">{pkg.id.substring(0, 8)}</span>
        <div className="flex-1" />
        {pkg.downloadCount > 100 && <Badge variant="destructive" className="text-[10px]">popular</Badge>}
        <StatusBadge status="PUBLISHED" />
      </div>

      <div className="p-4 flex gap-3">
        <VersionSeal version={pkg.version} size={52} />
        <div className="flex-1 min-w-0">
          {pkg.tags[0] && (
            <p className="text-[10px] uppercase tracking-wider text-gold">{pkg.tags[0]} · doctrine</p>
          )}
          <h3 className="font-heading font-semibold text-lg leading-tight mt-0.5">{pkg.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            by <span className="text-foreground">{pkg.authorUsername}</span>
            {pkg.publishedAt && <> · sealed {formatDate(pkg.publishedAt)}</>}
          </p>
        </div>
      </div>

      {pkg.description && (
        <div className="px-4">
          <p className="text-sm italic text-muted-foreground line-clamp-3 mb-3">"{pkg.description}"</p>
        </div>
      )}

      <div className="px-4 pb-3">
        <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} />
      </div>

      {pkg.tags.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {pkg.tags.map((t) => <HBTag key={t}>{t}</HBTag>)}
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50">
        <Downloads value={pkg.downloadCount} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView}>
            <BookOpen className="h-3 w-3 mr-1" /> View
          </Button>
          <Button variant="gold" size="sm" onClick={onInstall} disabled={installing}>
            <Diamond className="h-3 w-3 mr-1" /> Instate
          </Button>
        </div>
      </div>
    </Card>
  );
}
