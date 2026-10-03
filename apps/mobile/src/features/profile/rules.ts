// M09 validation: 2-100 chars, letters, spaces, dots and hyphens.
export function validateFullName(name: string): string | undefined {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100 || !/^[\p{L}\p{M}\s.\-]+$/u.test(trimmed)) return 'Enter your full name.';
  return undefined;
}

export interface ProfileForm {
  fullName: string;
  cityId: string;
  areaId: string;
}

// Only the fields that actually changed go in the PATCH. Changing the city clears
// the area unless a new area was picked for it (BR-9.2).
export function diffProfile(original: ProfileForm, next: ProfileForm) {
  const input: { fullName?: string; cityId?: string; areaId?: string | null } = {};
  if (next.fullName.trim() !== original.fullName.trim()) input.fullName = next.fullName.trim();
  if (next.cityId !== original.cityId) {
    input.cityId = next.cityId;
    input.areaId = next.areaId || null;
  } else if (next.areaId !== original.areaId) {
    input.areaId = next.areaId || null;
  }
  return input;
}
