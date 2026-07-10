import { beforeAll, describe, expect, it } from 'vitest';
import {
  formatNotificationBody,
  getNotificationTitle,
  shouldStoreNotification,
  type Translate,
} from './notificationText';
import { loadTranslations, type Dict, type Lang } from '@/i18n/translations';
import type { WsEvent } from '@/types';

let translations: Record<Lang, Dict>;

beforeAll(async () => {
  translations = await loadTranslations();
});

function t(lang: Lang): Translate {
  return (key, vars) => {
    let value = translations[lang][key] ?? key;
    for (const [name, replacement] of Object.entries(vars ?? {})) {
      value = value.replace(new RegExp(`\\{${name}\\}`, 'g'), String(replacement));
    }
    return value;
  };
}

function event(overrides: Partial<WsEvent> = {}): WsEvent {
  return {
    type: 'XP_GRANTED',
    campaignId: 'campaign-id',
    data: { amount: 125 },
    timestamp: '2026-07-03T00:00:00Z',
    triggeredBy: 'a90516a6-0dc8-4505-830b-131dd791960c',
    triggeredByName: 'Merlin',
    ...overrides,
  };
}

describe('notificationText', () => {
  it('formats XP notifications with localized actor name and amount', () => {
    const xpEvent = event();

    expect(getNotificationTitle(xpEvent, t('ru'))).toBe('Опыт дарован');
    expect(formatNotificationBody(xpEvent, t('ru'))).toBe(
      'Мастер игры Merlin начислил вам 125 XP',
    );
  });

  it('does not expose actor UUID when backend actor name is absent', () => {
    const xpEvent = event({ triggeredByName: undefined });

    expect(formatNotificationBody(xpEvent, t('ru'))).toBe(
      'Мастер игры начислил вам 125 XP',
    );
  });

  it('uses the selected localization for non-XP notifications too', () => {
    const locationEvent = event({
      type: 'LOCATION_REVEALED',
      data: { locationName: 'Old Keep' },
    });

    expect(getNotificationTitle(locationEvent, t('en'))).toBe('Location Revealed');
    expect(formatNotificationBody(locationEvent, t('en'))).toBe(
      'Game Master Merlin revealed a location: Old Keep',
    );
  });

  it('filters XP notifications to affected character owners when ownerIds are present', () => {
    const xpEvent = event({ data: { amount: 125, ownerIds: ['player-1'] } });

    expect(shouldStoreNotification(xpEvent, 'player-1')).toBe(true);
    expect(shouldStoreNotification(xpEvent, 'player-2')).toBe(false);
  });
});
