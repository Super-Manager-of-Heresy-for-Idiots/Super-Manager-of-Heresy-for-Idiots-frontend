import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { charactersFullApi } from '@/api/characters-full.api';
import { referenceApi } from '@/api/reference.api';
import type { ApiError, CharacterResponse, CreateFullCharacterRequest } from '@/types';

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
  return useMutation({
    mutationFn: (data: CreateFullCharacterRequest) => charactersFullApi.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myKey });
      toast.success('Шаблон создан!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Не удалось создать шаблон');
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => charactersFullApi.deleteTemplate(templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myKey });
      toast.success('Шаблон удалён');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Не удалось удалить шаблон');
    },
  });
}

export function useCloneTemplateToCampaign() {
  const qc = useQueryClient();
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
      const action = vars.mode === 'move' ? 'Персонаж перенесён в кампанию' : 'Копия добавлена в кампанию';
      toast.success(action);
      return data;
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Не удалось загрузить персонажа в кампанию');
    },
  });
}

// ── Global vanilla reference content for template wizard ──────────

export function useGlobalReferenceContent() {
  return useQuery({
    queryKey: ['reference', 'global'],
    queryFn: async () => {
      const [classes, races, backgrounds, skills, statTypes, availableClasses, availableRaces] = await Promise.all([
        referenceApi.getClasses(),
        referenceApi.getRaces(),
        referenceApi.getBackgrounds(),
        referenceApi.getProficiencySkills(),
        referenceApi.getStatTypes(),
        referenceApi.getAvailableClasses(),
        referenceApi.getAvailableRaces(),
      ]);
      return {
        classes: classes.data ?? [],
        races: races.data ?? [],
        backgrounds: backgrounds.data ?? [],
        skills: skills.data ?? [],
        statTypes: statTypes.data ?? [],
        availableClasses: availableClasses.data ?? [],
        availableRaces: availableRaces.data ?? [],
      };
    },
  });
}

export type TemplateCharacter = CharacterResponse;
