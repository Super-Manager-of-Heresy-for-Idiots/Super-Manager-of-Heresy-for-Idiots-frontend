import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Rune, OrdoDivider } from '@/components/ordo';
import { VersionSeal, HBTag } from '@/components/homebrew';
import { useMarketplacePackage } from '@/hooks/useHomebrew';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ContentType } from '@/types';
import s from './MarketplacePreviewModal.module.css';

/**
 * Красивое окно предпросмотра пакета с витрины: показывает ПОЛНЫЙ состав пакета по всем типам
 * контента (заклинания, виды, предметы, классы, предыстории, ресурсы, …) до установки —
 * чтобы пользователь понимал, что именно он добавляет. Кнопка «Установить» — прямо в окне.
 */

interface Props {
  packageId: string | null;
  installed: boolean;
  installPending: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (packageId: string) => void;
}

// Иконка + i18n-ключ подписи для каждого типа контента (порядок вывода — как в этом массиве).
const TYPE_META: { type: ContentType; glyph: string; labelKey: string }[] = [
  { type: 'CHARACTER_CLASS', glyph: 'helm', labelKey: 'hb.market.ptype.CHARACTER_CLASS' },
  { type: 'SUBCLASS', glyph: 'helm', labelKey: 'hb.market.ptype.SUBCLASS' },
  { type: 'SPECIES', glyph: 'hex', labelKey: 'hb.market.ptype.SPECIES' },
  { type: 'RACE', glyph: 'hex', labelKey: 'hb.market.ptype.SPECIES' },
  { type: 'SPELL', glyph: 'sigil-1', labelKey: 'hb.market.ptype.SPELL' },
  { type: 'ITEM', glyph: 'diamond', labelKey: 'hb.market.ptype.ITEM' },
  { type: 'ITEM_TYPE', glyph: 'sword', labelKey: 'hb.market.ptype.ITEM_TYPE' },
  { type: 'ITEM_TEMPLATE', glyph: 'sword', labelKey: 'hb.market.ptype.ITEM_TEMPLATE' },
  { type: 'FEAT', glyph: 'sigil-3', labelKey: 'hb.market.ptype.FEAT' },
  { type: 'SKILL', glyph: 'eye', labelKey: 'hb.market.ptype.SKILL' },
  { type: 'BUFF_DEBUFF', glyph: 'sigil-2', labelKey: 'hb.market.ptype.BUFF_DEBUFF' },
  { type: 'BACKGROUND', glyph: 'scroll', labelKey: 'hb.market.ptype.BACKGROUND' },
  { type: 'CUSTOM_RESOURCE', glyph: 'diamond', labelKey: 'hb.market.ptype.CUSTOM_RESOURCE' },
  { type: 'CURRENCY', glyph: 'diamond', labelKey: 'hb.market.ptype.CURRENCY' },
  { type: 'STAT_TYPE', glyph: 'sigil-1', labelKey: 'hb.market.ptype.STAT_TYPE' },
  { type: 'ENCHANTMENT_TYPE', glyph: 'sigil-2', labelKey: 'hb.market.ptype.ENCHANTMENT_TYPE' },
];

const MAX_ENTRIES_PER_TYPE = 6;

export function MarketplacePreviewModal({
  packageId, installed, installPending, onOpenChange, onInstall,
}: Props) {
  const t = useT();
  const navigate = useNavigate();
  const { data: pkg, isLoading } = useMarketplacePackage(packageId ?? undefined);

  const open = packageId !== null;
  const contentByType = pkg?.contentByType ?? {};
  // Секции в фиксированном порядке TYPE_META, только непустые.
  const sections = TYPE_META
    .map((m) => ({ ...m, entries: contentByType[m.type] ?? [] }))
    .filter((sec) => sec.entries.length > 0);
  const isEmpty = !isLoading && pkg && sections.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={s.modal}>
        {isLoading || !pkg ? (
          <div className={s.loading}>
            <Loader2 className="h-5 w-5 animate-spin" /> {t('hb.market.preview.loading')}
          </div>
        ) : (
          <>
            {/* Шапка пакета */}
            <DialogHeader className={s.headerReset}>
              <div className={s.hero}>
                <VersionSeal version={pkg.version} size={52} />
                <div className={s.heroMain}>
                  <DialogTitle className={cn('ao-h4', s.title)}>{pkg.title}</DialogTitle>
                  <div className={cn('ao-codex', s.meta)}>
                    {t('hb.market.preview.by', { author: pkg.authorUsername })}
                    <span className={s.metaSep}>·</span>
                    {t('hb.detail.version', { version: pkg.version })}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {pkg.description && (
              <p className={cn('ao-italic', s.desc)}>“{pkg.description}”</p>
            )}

            {pkg.tags.length > 0 && (
              <div className={s.tags}>
                {pkg.tags.map((tag) => <HBTag key={tag}>{tag}</HBTag>)}
              </div>
            )}

            <OrdoDivider glyph="diamond" />
            <div className={cn('ao-overline', s.sectionOverline)}>{t('hb.market.preview.whatInside')}</div>

            {/* Полный состав пакета */}
            <div className={s.scroll}>
              {isEmpty ? (
                <div className={cn('ao-italic', s.empty)}>{t('hb.market.preview.empty')}</div>
              ) : (
                sections.map((sec) => {
                  const shown = sec.entries.slice(0, MAX_ENTRIES_PER_TYPE);
                  const rest = sec.entries.length - shown.length;
                  return (
                    <div key={sec.type} className={s.group}>
                      <div className={s.groupHead}>
                        <Rune kind={sec.glyph} size={13} color="var(--gold-pale)" />
                        <span className={cn('ao-h6', s.groupTitle)}>{t(sec.labelKey)}</span>
                        <span className={cn('ao-codex', s.groupCount)}>{sec.entries.length}</span>
                      </div>
                      <div className={s.entries}>
                        {shown.map((e) => (
                          <div key={e.id} className={s.entry}>
                            <span className={s.entryName}>{e.name}</span>
                            {e.description && (
                              <span className={cn('ao-italic', s.entryDesc)}>{e.description}</span>
                            )}
                          </div>
                        ))}
                        {rest > 0 && (
                          <div className={cn('ao-codex', s.moreRow)}>
                            {t('hb.market.preview.more', { count: rest })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Действия */}
            <OrdoDivider />
            <div className={s.footer}>
              <button
                className="ao-btn ao-btn--ghost ao-btn--sm"
                onClick={() => navigate(`/gm/homebrew/marketplace/${pkg.id}`)}
              >
                <Rune kind="book" size={10} /> {t('hb.market.preview.details')}
              </button>
              {installed ? (
                <span className={cn('ao-codex', s.installedTag)}>
                  <Rune kind="check" size={10} color="var(--arcane)" /> {t('hb.market.installed')}
                </span>
              ) : (
                <button
                  className="ao-btn ao-btn--primary ao-btn--sm"
                  disabled={installPending}
                  onClick={() => onInstall(pkg.id)}
                >
                  <Rune kind="plus" size={10} /> {t('hb.market.install')}
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
