// Pure validation/formatting logic for the teacher onboarding journey (M14-M19).
// Mirrors the backend's rules so the UI can reject input before a round trip,
// while the server stays the source of truth.

export function ageOn(dob: string, today: Date = new Date()): number {
  const [y, mo, d] = dob.split('-').map(Number) as [number, number, number];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age -= 1;
  return age;
}

export function isAdultDateOfBirth(dob: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(Date.parse(dob))) return false;
  const age = ageOn(dob);
  return age >= 18 && age <= 90;
}

// Verhoeff checksum, used by Aadhaar numbers (12 digits, the last one is the check digit).
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaar(raw: string): boolean {
  const digits = raw.replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(digits)) return false;
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i++) c = VERHOEFF_D[c]![VERHOEFF_P[i % 8]![Number(reversed[i])]!]!;
  return c === 0;
}

export const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export function isValidPan(raw: string): boolean {
  return PAN_PATTERN.test(raw.trim().toUpperCase());
}

export function maskAadhaar(raw: string): string {
  const digits = raw.replace(/[\s-]/g, '');
  return `XXXX XXXX ${digits.slice(-4)}`;
}
export function maskPan(raw: string): string {
  const v = raw.trim().toUpperCase();
  return `${v[0]}XXXXX${v.slice(-4)}`;
}

export function formatAadhaarInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

const REGISTRATION_STEP_ORDER = ['personal', 'qualification', 'experience', 'subjects', 'classes', 'teachingModes', 'locations', 'documents'] as const;
export type RegistrationStep = (typeof REGISTRATION_STEP_ORDER)[number];

export function stepIndex(step: string): number {
  const i = REGISTRATION_STEP_ORDER.indexOf(step as RegistrationStep);
  return i === -1 ? 0 : i;
}

export function formatFee(paise: number | null | undefined): string {
  if (paise == null) return '';
  return String(Math.round(paise / 100));
}
export function toPaise(rupees: string): number | null {
  const n = Number(rupees.replace(/[^\d.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function containsContactInfo(text: string): boolean {
  const phonePattern = /(\+?\d[\s-]?){9,}/;
  const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  const urlPattern = /(https?:\/\/|www\.)\S+/i;
  return phonePattern.test(text) || emailPattern.test(text) || urlPattern.test(text);
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export function dayLabel(dayOfWeek: number): string {
  return DAY_LABELS[dayOfWeek] ?? '';
}

export function timeRangeMinutes(start: string, end: string): number {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return toMin(end) - toMin(start);
}

export function windowsOverlap(a: { startTime: string; endTime: string }, b: { startTime: string; endTime: string }): boolean {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  return toMin(a.startTime) < toMin(b.endTime) && toMin(b.startTime) < toMin(a.endTime);
}
