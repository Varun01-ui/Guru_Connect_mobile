import type { MastersResponse } from '../platform/api';
import type { Child } from './api';

export interface ChildDraft {
  key: string;
  id?: string;
  name: string;
  classId: string;
  boardId: string;
  subjectIds: string[];
  categoryIds: string[];
  modeId: string;
  updatedAt?: string;
}

export const MAX_SUBJECTS = 6;
export const MAX_CATEGORIES = 4;

export function emptyChild(): ChildDraft {
  return { key: Math.random().toString(36).slice(2), name: '', classId: '', boardId: '', subjectIds: [], categoryIds: [], modeId: '' };
}

// BR-7.3: a subject is offered for a class when the class's level sits inside the
// subject's [min, max] range (null = open on that side). If the masters payload
// carries no level information we can't filter, so everything is offered and the
// server re-validates on save.
export function subjectsForClass(masters: Pick<MastersResponse, 'classes' | 'subjects'> | undefined, classId: string) {
  const subjects = masters?.subjects ?? [];
  const cls = masters?.classes.find((c) => c.id === classId);
  if (!cls) return [];
  const level = cls.levelOrder;
  if (level == null) return subjects;
  return subjects.filter((s) => (s.minClassOrder == null || s.minClassOrder <= level) && (s.maxClassOrder == null || s.maxClassOrder >= level));
}

// Subjects that would stop being offered if the class changed to `classId`.
export function keepOfferedSubjects(masters: Pick<MastersResponse, 'classes' | 'subjects'> | undefined, classId: string, subjectIds: string[]) {
  const offered = new Set(subjectsForClass(masters, classId).map((s) => s.id));
  return subjectIds.filter((id) => offered.has(id));
}

export type ChildErrors = Partial<Record<'name' | 'classId' | 'subjectIds' | 'categoryIds', string>>;

export function validateChild(draft: ChildDraft): ChildErrors {
  const errors: ChildErrors = {};
  const name = draft.name.trim();
  if (name.length < 1 || name.length > 40 || !/^[\p{L}\p{M}\s]+$/u.test(name)) errors.name = "Enter your child's first name.";
  if (!draft.classId) errors.classId = 'Choose a class.';
  if (draft.subjectIds.length > MAX_SUBJECTS) errors.subjectIds = `Choose up to ${MAX_SUBJECTS} subjects.`;
  if (draft.categoryIds.length > MAX_CATEGORIES) errors.categoryIds = `Choose up to ${MAX_CATEGORIES} teacher types.`;
  return errors;
}

export function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}


export function draftFromChild(c: Child): ChildDraft {
  return {
    key: c.id,
    id: c.id,
    name: c.childName,
    classId: c.classId ?? c.class?.id ?? '',
    boardId: c.boardId ?? c.board?.id ?? '',
    subjectIds: c.subjectIds ?? [],
    categoryIds: c.categoryIds ?? [],
    modeId: c.preferredModeId ?? '',
    updatedAt: c.updatedAt,
  };
}
