import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Diamond, ScrollText, Sword, Shield, Eye, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { VersionSeal, StatusBadge, HBTag, ContentPills, Downloads } from '@/components/homebrew';
import { useMarketplacePackage, useInstallPackage } from '@/hooks/useHomebrew';
import { formatDate } from '@/lib/utils';
import type { ContentType } from '@/types';

const CONTENT_TABS: { id: ContentType; label: string; icon: React.ElementType }[] = [
  { id: 'ITEM_TYPE', label: 'Items', icon: Sword },
  { id: 'CHARACTER_CLASS', label: 'Classes', icon: Shield },
  { id: 'SKILL', label: 'Skills', icon: Eye },
  { id: 'FEAT', label: 'Feats', icon: Star },
];

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: pkg, isLoading } = useMarketplacePackage(id);
  const installMutation = useInstallPackage();
  const [tab, setTab] = useState<ContentType>('ITEM_TYPE');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading || !pkg) {
    return (
      <Card className="h-96 animate-pulse">
        <div className="h-full bg-muted rounded-lg" />
      </Card>
    );
  }

  const s = pkg.contentSummary;
  const contentByType = pkg.contentByType || {};
  const currentContent = contentByType[tab] || [];

  const handleInstall = () => {
    installMutation.mutate(pkg.id, {
      onSuccess: () => setShowConfirm(false),
    });
  };

  return (
    <div className="space-y-4">
      {/* Top actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/gm/homebrew/marketplace')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Catalogue
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ScrollText className="h-4 w-4 mr-1" /> Report
          </Button>
          <Button variant="gold" size="sm" onClick={() => setShowConfirm(true)}>
            <Diamond className="h-4 w-4 mr-1" /> Instate Doctrine
          </Button>
        </div>
      </div>

      {/* Hero header */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] border-b">
          {/* Left: identity */}
          <div className="p-6 lg:border-r">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-mono text-muted-foreground">{pkg.id.substring(0, 8)}</span>
              <StatusBadge status="PUBLISHED" />
            </div>

            <h1 className="text-3xl font-heading font-bold leading-tight">{pkg.title}</h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="w-8 h-8 border rounded flex items-center justify-center bg-muted">
                <Star className="h-4 w-4 text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium">{pkg.authorUsername}</p>
                <p className="text-xs text-muted-foreground">Game-Master</p>
              </div>
              {pkg.createdAt && (
                <>
                  <Separator orientation="vertical" className="h-8 mx-2" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">First Sealed</p>
                    <p className="text-xs">{formatDate(pkg.createdAt)}</p>
                  </div>
                </>
              )}
              {pkg.publishedAt && (
                <>
                  <Separator orientation="vertical" className="h-8 mx-2" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Last Re-Sealed</p>
                    <p className="text-xs">{formatDate(pkg.publishedAt)}</p>
                  </div>
                </>
              )}
            </div>

            <Separator className="my-4" />

            {pkg.description && (
              <p className="text-sm leading-relaxed">{pkg.description}</p>
            )}

            {pkg.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {pkg.tags.map((t) => <HBTag key={t}>{t}</HBTag>)}
              </div>
            )}
          </div>

          {/* Right: side meta */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <VersionSeal version={pkg.version} size={64} />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Edition</p>
                <p className="font-heading font-semibold">Version {pkg.version}</p>
                {pkg.publishedAt && <p className="text-xs text-muted-foreground">re-sealed {formatDate(pkg.publishedAt)}</p>}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Instated</p>
                <p className="text-2xl font-heading text-foreground mt-1">{pkg.downloadCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">times installed</p>
              </div>
              <div className="p-3 bg-muted rounded-md border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Version</p>
                <p className="text-2xl font-heading text-gold mt-1">v{pkg.version}</p>
                <p className="text-xs text-muted-foreground">current edition</p>
              </div>
            </div>

            <ContentPills items={s.itemTypeCount} classes={s.classCount} skills={s.skillCount} feats={s.featCount} />

            <Button variant="gold" size="lg" className="w-full" onClick={() => setShowConfirm(true)}>
              <Diamond className="h-4 w-4 mr-2" /> Authorize Instatement
            </Button>
            <p className="text-xs text-center text-muted-foreground">installation grants reference, not ownership</p>
          </div>
        </div>

        {/* Content tabs */}
        <div className="flex border-b">
          {CONTENT_TABS.map((t) => {
            const count = (contentByType[t.id] || []).length;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label} · {count}
              </button>
            );
          })}
        </div>

        <CardContent className="p-5">
          {currentContent.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground italic">
              No {CONTENT_TABS.find((t) => t.id === tab)?.label.toLowerCase()} in this doctrine.
            </div>
          ) : tab === 'FEAT' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Feat</th>
                  <th className="text-left py-2 font-medium">Description</th>
                  <th className="text-left py-2 font-medium">Prerequisites</th>
                </tr>
              </thead>
              <tbody>
                {currentContent.map((f) => (
                  <tr key={f.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{f.name}</td>
                    <td className="py-2 text-muted-foreground italic">{f.description || '—'}</td>
                    <td className="py-2 text-xs text-muted-foreground">{f.prerequisites || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={`grid gap-3 ${tab === 'SKILL' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {currentContent.map((item) => {
                const Icon = CONTENT_TABS.find((t) => t.id === tab)?.icon || Diamond;
                return (
                  <div key={item.id} className="flex gap-3 p-3 bg-muted rounded-md border">
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-card rounded border border-gold/20">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-heading font-medium">{item.name}</span>
                        {item.slot && <span className="text-xs text-muted-foreground">{item.slot}</span>}
                        {item.skillType && <span className="text-xs text-muted-foreground">{item.skillType}</span>}
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground italic mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install confirmation dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authorize Instatement?</AlertDialogTitle>
            <AlertDialogDescription>
              By instatement, you may reference the contents of "{pkg.title}". The doctrine is not copied — should the author redact it, your reference shall be marked but not erased.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Withhold</AlertDialogCancel>
            <AlertDialogAction onClick={handleInstall}>Seal Instatement</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
