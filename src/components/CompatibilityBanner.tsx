import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import {
  characterMigrationState,
  migrationMessage,
  type CharacterMigrationState,
} from '@/lib/characterMigration';
import type { CharacterResponse } from '@/types';
import s from './CompatibilityBanner.module.css';

const KEY: Record<Exclude<CharacterMigrationState, 'ok'>, string> = {
  legacy: 'camp2.migration.legacy',
  upgrading: 'camp2.migration.upgrading',
  blocked: 'camp2.migration.blocked',
};

/**
 * Migration-window notice for legacy / transitional / blocked characters.
 * Renders nothing for fully-migrated characters (no false positives).
 */
export function CompatibilityBanner({ character }: { character?: CharacterResponse }) {
  const t = useT();
  const state = characterMigrationState(character);
  if (state === 'ok') return null;

  const custom = migrationMessage(character);
  const blocked = state === 'blocked';
  return (
    <div className={cn(s.banner, blocked ? s.blocked : s.notice)} role="status">
      <Rune kind={blocked ? 'lock' : 'diamond'} size={16} color={blocked ? 'var(--ember)' : 'var(--gold)'} />
      <span className="ao-codex">{custom || t(KEY[state])}</span>
      {blocked && <span className={cn('ao-overline', s.tag)}>{t('camp2.migration.readonly')}</span>}
    </div>
  );
}
