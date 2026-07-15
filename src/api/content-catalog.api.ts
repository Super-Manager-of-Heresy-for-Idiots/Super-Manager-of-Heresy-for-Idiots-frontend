import api from './axios';
import type {
  ApiResponse,
  BackgroundDetail,
  EquipmentItemDetail,
  FeatDetail,
  ItemDefinition,
  MagicItemDetail,
  SpellDetail,
} from '@/types';

/**
 * Read-only Content Catalog client (PHB 2024 normalized model):
 * feats / spells / backgrounds / equipment / magic items.
 *
 * Paths use the `/content/` alias so the new *Detail shapes are served
 * unambiguously — the bare `/reference/{res}` paths are also mapped by the
 * legacy VanillaReferenceController (lighter shapes). `lang` is attached
 * automatically by the axios interceptor for any `/reference/` URL, so it is
 * never passed here.
 *
 * Each resource exposes the vanilla (core) and campaign-aware variants:
 *   - list / get                 → core content only (homebrew_id IS NULL)
 *   - campaignList / campaignGet → core + active homebrew packages of a campaign
 */
function catalogResource<T>(resource: string) {
  return {
    list: async (): Promise<ApiResponse<T[]>> => {
      const res = await api.get<ApiResponse<T[]>>(`/reference/content/${resource}`);
      return res.data;
    },
    get: async (id: string): Promise<ApiResponse<T>> => {
      const res = await api.get<ApiResponse<T>>(`/reference/content/${resource}/${id}`);
      return res.data;
    },
    campaignList: async (campaignId: string): Promise<ApiResponse<T[]>> => {
      const res = await api.get<ApiResponse<T[]>>(
        `/campaigns/${campaignId}/reference/content/${resource}`,
      );
      return res.data;
    },
    campaignGet: async (campaignId: string, id: string): Promise<ApiResponse<T>> => {
      const res = await api.get<ApiResponse<T>>(
        `/campaigns/${campaignId}/reference/content/${resource}/${id}`,
      );
      return res.data;
    },
  };
}

export const contentCatalogApi = {
  feats: catalogResource<FeatDetail>('feats'),
  spells: catalogResource<SpellDetail>('spells'),
  backgrounds: catalogResource<BackgroundDetail>('backgrounds'),
  equipment: catalogResource<EquipmentItemDetail>('equipment'),
  magicItems: catalogResource<MagicItemDetail>('magic-items'),
  // Единый каталог «Предметов» (IT-1): equipment + magic + legacy template в одной выдаче.
  items: catalogResource<ItemDefinition>('items'),
};
