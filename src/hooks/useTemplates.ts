import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { charactersFullApi, type CreateFullCharacterRequest } from '@/api/characters-full.api';
import { referenceApi } from '@/api/reference.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError, AvailableContentEntry, CharacterResponse } from '@/types';

const myKey = ['characters', 'my'];
const detailKey = (id: string) => ['characters', 'template', id];

export function useMyTemplates() {
  return useQuery({
    queryKey: myKey,
    queryFn: async () => {
      const response = await charactersFullApi.listMyTemplates();
      return response.data ?? [];
    },
  });
}

export function useTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: templateId ? detailKey(templateId) : ['characters', 'template', 'none'],
    queryFn: async () => {
      const response = await charactersFullApi.getTemplate(templateId!);
      return response.data;
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateFullCharacterRequest) => charactersFullApi.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myKey });
      toast.success(t('hk.template.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.template.createFailed'));
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (templateId: string) => charactersFullApi.deleteTemplate(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myKey });
      toast.success(t('hk.template.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.template.deleteFailed'));
    },
  });
}

export function useCloneTemplateToCampaign() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({
      campaignId,
      templateId,
      mode,
    }: {
      campaignId: string;
      templateId: string;
      mode: 'clone' | 'move';
    }) => charactersFullApi.fromTemplate(campaignId, templateId, mode),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ['campaigns', vars.campaignId, 'characters'] });
      qc.invalidateQueries({ queryKey: myKey });
      const action = vars.mode === 'move' ? t('hk.template.moved') : t('hk.template.cloned');
      toast.success(action);
      return data;
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.template.loadFailed'));
    },
  });
}

// ── Global vanilla reference content for template wizard ──────────

const VANILLA_SOURCE = 'PHB';

function detailToEntry(item: { id: string; name: string }): AvailableContentEntry {
  return { id: item.id, name: item.name, source: VANILLA_SOURCE };
}

// Currency reference (gold/silver/…), used to resolve wizard coin pools to ids.
export function useReferenceCurrencies() {
  return useQuery({
    queryKey: ['reference', 'currencies'],
    queryFn: async () => {
      const response = await referenceApi.getCurrencies();
      return response.data ?? [];
    },
  });
}

export function useGlobalReferenceContent() {
  return useQuery({
    queryKey: ['reference', 'global'],
    queryFn: async () => {
      const [classes, races, backgrounds, skills, statTypes, currencies] = await Promise.all([
        referenceApi.getClasses(),
        referenceApi.getRaces(),
        referenceApi.getBackgrounds(),
        referenceApi.getSkills(),
        referenceApi.getStatTypes(),
        referenceApi.getCurrencies(),
      ]);
      const classList = classes.data ?? [];
      const raceList = races.data ?? [];
      return {
        classes: classList,
        races: raceList,
        backgrounds: backgrounds.data ?? [],
        skills: skills.data ?? [],
        statTypes: statTypes.data ?? [],
        currencies: currencies.data ?? [],
        // Wizard picker entries are derived from the detail lists — no extra
        // round-trip to a (non-existent) `/reference/available/*` endpoint.
        availableClasses: classList.map(detailToEntry),
        availableRaces: raceList.map(detailToEntry),
      };
    },
  });
}

export type TemplateCharacter = CharacterResponse;
