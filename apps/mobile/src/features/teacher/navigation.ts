import type { RootStackParamList } from '../../core/navigation/types';

// Maps a `nextStep` value from GET /teacher/registration to the screen that
// collects it, so Splash/HomeGate and any step's "Next" button can resume
// correctly without re-deriving this switch everywhere.
export const TEACHER_STEP_ROUTE: Record<string, keyof RootStackParamList> = {
  personal: 'TeacherRegBasics',
  qualification: 'TeacherRegQualifications',
  experience: 'TeacherRegExperience',
  subjects: 'TeacherRegSubjects',
  classes: 'TeacherRegClasses',
  teachingModes: 'TeacherRegModes',
  locations: 'TeacherRegLocations',
  documents: 'TeacherDocuments',
};

export const TEACHER_STEP_ORDER: (keyof RootStackParamList)[] = [
  'TeacherRegBasics',
  'TeacherRegQualifications',
  'TeacherRegExperience',
  'TeacherRegSubjects',
  'TeacherRegClasses',
  'TeacherRegModes',
  'TeacherRegLocations',
];

export function stepNumber(route: keyof RootStackParamList): number {
  const i = TEACHER_STEP_ORDER.indexOf(route);
  return i === -1 ? 1 : i + 1;
}
