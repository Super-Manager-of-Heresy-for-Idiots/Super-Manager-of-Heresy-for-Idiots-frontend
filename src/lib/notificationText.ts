import type { WsEvent, WsEventType } from '@/types';

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

const EVENT_LABEL_KEY: Partial<Record<WsEventType | string, string>> = {
  ITEM_GRANTED: 'cmp2.event.ITEM_GRANTED',
  ITEM_REMOVED: 'cmp2.event.ITEM_REMOVED',
  BUFF_APPLIED: 'cmp2.event.BUFF_APPLIED',
  BUFF_REMOVED: 'cmp2.event.BUFF_REMOVED',
  XP_GRANTED: 'cmp2.event.XP_GRANTED',
  HP_CHANGED: 'cmp2.event.HP_CHANGED',
  CHARACTER_UPDATED: 'cmp2.event.CHARACTER_UPDATED',
  NPC_REVEALED: 'cmp2.event.NPC_REVEALED',
  NPC_HIDDEN: 'cmp2.event.NPC_HIDDEN',
  LOCATION_REVEALED: 'cmp2.event.LOCATION_REVEALED',
  LOCATION_HIDDEN: 'cmp2.event.LOCATION_HIDDEN',
  MONSTER_REVEALED: 'cmp2.event.MONSTER_REVEALED',
  MONSTER_HIDDEN: 'cmp2.event.MONSTER_HIDDEN',
  QUEST_UPDATED: 'cmp2.event.QUEST_UPDATED',
  CAMPAIGN_STATUS_CHANGED: 'cmp2.event.CAMPAIGN_STATUS_CHANGED',
  MEMBER_KICKED: 'cmp2.event.MEMBER_KICKED',
  WALLET_CHANGED: 'cmp2.event.WALLET_CHANGED',
  BATTLE_STARTED: 'cmp2.event.BATTLE_STARTED',
  BATTLE_UPDATED: 'cmp2.event.BATTLE_UPDATED',
  COMBATANT_JOINED: 'cmp2.event.COMBATANT_JOINED',
  BATTLE_TURN_CHANGED: 'cmp2.event.BATTLE_TURN_CHANGED',
  BATTLE_ACTION: 'cmp2.event.BATTLE_ACTION',
  BATTLE_ENDED: 'cmp2.event.BATTLE_ENDED',
};

const BODY_KEY: Partial<Record<WsEventType | string, string>> = {
  ITEM_GRANTED: 'cmp2.notif.ITEM_GRANTED',
  ITEM_REMOVED: 'cmp2.notif.ITEM_REMOVED',
  BUFF_APPLIED: 'cmp2.notif.BUFF_APPLIED',
  BUFF_REMOVED: 'cmp2.notif.BUFF_REMOVED',
  XP_GRANTED: 'cmp2.notif.XP_GRANTED',
  HP_CHANGED: 'cmp2.notif.HP_CHANGED',
  CHARACTER_UPDATED: 'cmp2.notif.CHARACTER_UPDATED',
  NPC_REVEALED: 'cmp2.notif.NPC_REVEALED',
  NPC_HIDDEN: 'cmp2.notif.NPC_HIDDEN',
  LOCATION_REVEALED: 'cmp2.notif.LOCATION_REVEALED',
  LOCATION_HIDDEN: 'cmp2.notif.LOCATION_HIDDEN',
  MONSTER_REVEALED: 'cmp2.notif.MONSTER_REVEALED',
  MONSTER_HIDDEN: 'cmp2.notif.MONSTER_HIDDEN',
  QUEST_UPDATED: 'cmp2.notif.QUEST_UPDATED',
  CAMPAIGN_STATUS_CHANGED: 'cmp2.notif.CAMPAIGN_STATUS_CHANGED',
  MEMBER_KICKED: 'cmp2.notif.MEMBER_KICKED',
  WALLET_CHANGED: 'cmp2.notif.WALLET_CHANGED',
  BATTLE_STARTED: 'cmp2.notif.BATTLE_STARTED',
  BATTLE_UPDATED: 'cmp2.notif.BATTLE_UPDATED',
  COMBATANT_JOINED: 'cmp2.notif.COMBATANT_JOINED',
  BATTLE_TURN_CHANGED: 'cmp2.notif.BATTLE_TURN_CHANGED',
  BATTLE_ACTION: 'cmp2.notif.BATTLE_ACTION',
  BATTLE_ENDED: 'cmp2.notif.BATTLE_ENDED',
};

function dataRecord(event: WsEvent): Record<string, unknown> {
  return typeof event.data === 'object' && event.data !== null
    ? event.data as Record<string, unknown>
    : {};
}

function stringValue(data: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return fallback;
}

function numberValue(data: Record<string, unknown>, key: string, fallback: number): number {
  const value = data[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function actorLabel(event: WsEvent, t: Translate): string {
  if (event.triggeredByName?.trim()) {
    return t('cmp2.notif.actor.gmNamed', { name: event.triggeredByName });
  }
  return t('cmp2.notif.actor.gm');
}

export function getNotificationTitle(event: WsEvent, t: Translate): string {
  const key = EVENT_LABEL_KEY[event.type];
  return key ? t(key) : t('cmp2.event.UNKNOWN');
}

export function formatNotificationBody(event: WsEvent, t: Translate): string {
  const data = dataRecord(event);
  const actor = actorLabel(event, t);
  const key = BODY_KEY[event.type];

  if (!key) {
    return t('cmp2.notif.generic', { actor, event: event.type });
  }

  return t(key, {
    actor,
    amount: numberValue(data, 'amount', 0),
    currentHp: numberValue(data, 'currentHp', 0),
    maxHp: numberValue(data, 'maxHp', 0),
    item: stringValue(data, ['displayName', 'name', 'templateName'], t('cmp2.notif.item')),
    effect: stringValue(data, ['buffDebuffName', 'effectName'], t('cmp2.notif.effect')),
    npc: stringValue(data, ['npcName', 'name'], t('cmp2.notif.npc')),
    location: stringValue(data, ['locationName', 'name'], t('cmp2.notif.location')),
    monster: stringValue(data, ['monsterName', 'name'], t('cmp2.notif.monster')),
    quest: stringValue(data, ['questName', 'name'], t('cmp2.notif.quest')),
    status: stringValue(data, ['status'], t('cmp2.notif.status')),
    currency: stringValue(data, ['currencyName', 'name'], t('cmp2.notif.currency')),
    combatant: stringValue(data, ['combatantName', 'targetName', 'attackerName'], t('cmp2.notif.combatant')),
  });
}

export function shouldStoreNotification(event: WsEvent, currentUserId?: string): boolean {
  if (event.type !== 'XP_GRANTED' || !currentUserId) {
    return true;
  }

  const ownerIds = dataRecord(event).ownerIds;
  return Array.isArray(ownerIds)
    ? ownerIds.includes(currentUserId)
    : true;
}
