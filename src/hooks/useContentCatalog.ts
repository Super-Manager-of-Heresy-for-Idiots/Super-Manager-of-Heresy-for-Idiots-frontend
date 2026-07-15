import { useQuery } from '@tanstack/react-query';
import { contentCatalogApi } from '@/api/content-catalog.api';
import { referenceApi } from '@/api/reference.api';

/**
 * React Query hooks for the read-only Content Catalog (PHB 2024 model):
 * feats / spells / backgrounds / equipment / magic items.
 *
 * Each resource exposes a list hook and a detail hook. Both take an optional
 * `campaignId`:
 *   - omitted  → vanilla (core) endpoint, core content only;
 *   - provided → campaign-aware endpoint, core + active homebrew of that campaign.
 *
 * Localization (`lang`) is handled by the axios interceptor, so it is not part
 * of the query keys. Content changes only on import, so reads are cached for a
 * while; invalidate the `['content', <resource>]` key prefix when a campaign's
 * active homebrew set changes.
 */

const STALE = 10 * 60 * 1000;

const listKey = (resource: string, campaignId?: string) =>
  campaignId ? ['content', resource, 'campaign', campaignId] : ['content', resource];

const detailKey = (resource: string, id: string | undefined, campaignId?: string) =>
  campaignId
    ? ['content', resource, 'campaign', campaignId, 'id', id]
    : ['content', resource, 'id', id];

// ---------- Feats ----------
export function useFeats(campaignId?: string) {
  return useQuery({
    queryKey: listKey('feats', campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.feats.campaignList(campaignId)
        : await contentCatalogApi.feats.list();
      return res.data ?? [];
    },
    staleTime: STALE,
  });
}

export function useFeat(featId: string | undefined, campaignId?: string) {
  return useQuery({
    queryKey: detailKey('feats', featId, campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.feats.campaignGet(campaignId, featId!)
        : await contentCatalogApi.feats.get(featId!);
      return res.data;
    },
    enabled: !!featId,
    staleTime: STALE,
  });
}

// ---------- Spells ----------
export function useSpells(campaignId?: string) {
  return useQuery({
    queryKey: listKey('spells', campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.spells.campaignList(campaignId)
        : await contentCatalogApi.spells.list();
      return res.data ?? [];
    },
    staleTime: STALE,
  });
}

export function useSpell(spellId: string | undefined, campaignId?: string) {
  return useQuery({
    queryKey: detailKey('spells', spellId, campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.spells.campaignGet(campaignId, spellId!)
        : await contentCatalogApi.spells.get(spellId!);
      return res.data;
    },
    enabled: !!spellId,
    staleTime: STALE,
  });
}

// ---------- Backgrounds ----------
export function useBackgrounds(campaignId?: string) {
  return useQuery({
    queryKey: listKey('backgrounds', campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.backgrounds.campaignList(campaignId)
        : await contentCatalogApi.backgrounds.list();
      return res.data ?? [];
    },
    staleTime: STALE,
  });
}

export function useBackground(backgroundId: string | undefined, campaignId?: string) {
  return useQuery({
    queryKey: detailKey('backgrounds', backgroundId, campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.backgrounds.campaignGet(campaignId, backgroundId!)
        : await contentCatalogApi.backgrounds.get(backgroundId!);
      return res.data;
    },
    enabled: !!backgroundId,
    staleTime: STALE,
  });
}

// ---------- Equipment ----------
export function useEquipmentItems(campaignId?: string) {
  return useQuery({
    queryKey: listKey('equipment', campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.equipment.campaignList(campaignId)
        : await contentCatalogApi.equipment.list();
      return res.data ?? [];
    },
    staleTime: STALE,
  });
}

export function useEquipmentItem(equipmentItemId: string | undefined, campaignId?: string) {
  return useQuery({
    queryKey: detailKey('equipment', equipmentItemId, campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.equipment.campaignGet(campaignId, equipmentItemId!)
        : await contentCatalogApi.equipment.get(equipmentItemId!);
      return res.data;
    },
    enabled: !!equipmentItemId,
    staleTime: STALE,
  });
}

// ---------- Magic Items ----------
export function useMagicItems(campaignId?: string) {
  return useQuery({
    queryKey: listKey('magic-items', campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.magicItems.campaignList(campaignId)
        : await contentCatalogApi.magicItems.list();
      return res.data ?? [];
    },
    staleTime: STALE,
  });
}

export function useMagicItem(magicItemId: string | undefined, campaignId?: string) {
  return useQuery({
    queryKey: detailKey('magic-items', magicItemId, campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.magicItems.campaignGet(campaignId, magicItemId!)
        : await contentCatalogApi.magicItems.get(magicItemId!);
      return res.data;
    },
    enabled: !!magicItemId,
    staleTime: STALE,
  });
}

// ---------- Unified items (IT-1): equipment + magic + legacy template ----------
export function useItems(campaignId?: string) {
  return useQuery({
    queryKey: listKey('items', campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.items.campaignList(campaignId)
        : await contentCatalogApi.items.list();
      return res.data ?? [];
    },
    staleTime: STALE,
  });
}

export function useItem(itemId: string | undefined, campaignId?: string) {
  return useQuery({
    queryKey: detailKey('items', itemId, campaignId),
    queryFn: async () => {
      const res = campaignId
        ? await contentCatalogApi.items.campaignGet(campaignId, itemId!)
        : await contentCatalogApi.items.get(itemId!);
      return res.data;
    },
    enabled: !!itemId,
    staleTime: STALE,
  });
}

// ---------- Damage types (authoring dropdowns) ----------
export function useDamageTypes() {
  return useQuery({
    queryKey: ['content', 'damage-types'],
    queryFn: async () => (await referenceApi.getDamageTypes()).data ?? [],
    staleTime: STALE,
  });
}
