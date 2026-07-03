import type { Lang } from '@/i18n/translations';

export interface LocalizedNameLike {
  name?: string | null;
  nameRusloc?: string | null;
  nameEngloc?: string | null;
  nameRu?: string | null;
  nameEn?: string | null;
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function localizedName(value: LocalizedNameLike | null | undefined, lang: Lang): string {
  if (!value) return '';
  const resolved = clean(value.name);
  if (resolved) return resolved;
  const ru = clean(value.nameRusloc) ?? clean(value.nameRu);
  const en = clean(value.nameEngloc) ?? clean(value.nameEn);
  return (lang === 'en' ? en ?? ru : ru ?? en) ?? '';
}
