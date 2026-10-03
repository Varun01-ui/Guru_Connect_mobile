import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { useSession } from '../../lib/session.store';
import { kv } from '../../lib/storage';
import { platformKeys } from '../platform/hooks';
import * as api from './api';
import type { Child, RecommendationPreviewItem } from './api';
import type { ChildDraft } from './rules';

export const childKeys = { all: ['children'] as const };

export function useChildrenQuery(enabled = true) {
  return useQuery({ queryKey: childKeys.all, queryFn: api.fetchChildren, enabled });
}

export interface SaveChildrenResult {
  children: Child[];
  previews: { childName: string; items: RecommendationPreviewItem[] }[];
  dropped: { childName: string; subjects: string[] }[];
}

function toInput(d: ChildDraft): api.ChildInput {
  return {
    childName: d.name.trim(),
    classId: d.classId,
    boardId: d.boardId || null,
    subjectIds: d.subjectIds,
    categoryIds: d.categoryIds,
    preferredModeId: d.modeId || null,
  };
}

// Saves the whole "children" form in order: remove deleted ones, edit existing,
// add new, then persist the switcher order. Sequential on purpose so sort order
// and the server's child limit stay predictable.
export function useSaveChildrenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ drafts, existing }: { drafts: ChildDraft[]; existing: Child[] }): Promise<SaveChildrenResult> => {
      const keepIds = new Set(drafts.filter((d) => d.id).map((d) => d.id));
      for (const c of existing) if (!keepIds.has(c.id)) await api.deleteChild(c.id);

      const saved: Child[] = [];
      const previews: SaveChildrenResult['previews'] = [];
      const dropped: SaveChildrenResult['dropped'] = [];
      for (const d of drafts) {
        const res = d.id
          ? await api.editChild(d.id, toInput(d), d.updatedAt ?? existing.find((c) => c.id === d.id)?.updatedAt ?? '')
          : await api.addChild(toInput(d), `child-${d.key}`);
        saved.push(res.data);
        if (res.meta.recommendationsPreview) previews.push({ childName: res.data.childName, items: res.meta.recommendationsPreview });
        if (res.meta.droppedSubjects?.length) dropped.push({ childName: res.data.childName, subjects: res.meta.droppedSubjects });
      }
      if (saved.length > 1) await api.reorderChildren(saved.map((c) => c.id));
      return { children: saved, previews, dropped };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: childKeys.all });
      queryClient.invalidateQueries({ queryKey: platformKeys.me });
      queryClient.invalidateQueries({ queryKey: ['home'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

// Which child the Home screen is showing recommendations for. Remembered between launches.
const SELECTED_KEY = 'gc_selected_child';

interface ChildSwitcher {
  selectedChildId: string | null;
  select: (id: string | null) => void;
  reloadFromStorage: () => void;
}

export const useChildSwitcher = create<ChildSwitcher>((set) => ({
  selectedChildId: null,
  select: (id) => {
    set({ selectedChildId: id });
    if (id) kv.set(SELECTED_KEY, id);
    else kv.remove(SELECTED_KEY);
  },
  reloadFromStorage: () => set({ selectedChildId: kv.getString(SELECTED_KEY) ?? null }),
}));

// The remembered child belongs to one account. Forget it when that account signs out
// or a different one signs in, so it can never leak into the next session.
useSession.subscribe((state, previous) => {
  if (previous.userId && state.userId !== previous.userId) useChildSwitcher.getState().select(null);
});
