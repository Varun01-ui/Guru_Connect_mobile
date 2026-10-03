import { api } from '../../lib/api';

export interface Child {
  id: string;
  childName: string;
  classId: string;
  class: { id: string; name: string };
  boardId: string | null;
  board: { id: string; shortName?: string; name?: string } | null;
  subjectIds: string[];
  subjects: string[];
  categoryIds: string[];
  teacherCategories: string[];
  preferredModeId: string | null;
  preferredMode: { id: string; name: string } | null;
  schoolName: string | null;
  sortOrder: number;
  updatedAt: string;
}

export interface RecommendationPreviewItem {
  teacherId: string;
  fullName: string;
  trustScore: number;
  score: number;
  distanceKm: number | null;
  subjectsMatched: string[];
}

export interface ChildMeta {
  recommendationsPreview?: RecommendationPreviewItem[];
  droppedSubjects?: string[];
}

export interface ChildInput {
  childName: string;
  classId: string;
  boardId: string | null;
  subjectIds: string[];
  categoryIds: string[];
  preferredModeId: string | null;
  schoolName?: string | null;
}

export function fetchChildren() {
  return api.get<Child[]>('parent/children');
}

export function addChild(input: ChildInput, idempotencyKey: string) {
  return api.postWithMeta<Child, ChildMeta>('parent/children', input, { idempotencyKey });
}

export function editChild(id: string, input: Partial<ChildInput>, updatedAt: string) {
  return api.patchWithMeta<Child, ChildMeta>(`parent/children/${id}`, input, { ifMatch: updatedAt });
}

export function deleteChild(id: string) {
  return api.delete<{ ok: boolean }>(`parent/children/${id}`);
}

export function reorderChildren(orderedIds: string[]) {
  return api.put<{ ok: boolean }>('parent/children/order', { orderedIds });
}
