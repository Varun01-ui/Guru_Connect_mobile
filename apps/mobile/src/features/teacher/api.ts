import { api } from '../../lib/api';

export type Gender = 'female' | 'male' | 'other' | 'undisclosed';
export type QualificationLevel = 'secondary' | 'senior_secondary' | 'diploma' | 'graduate' | 'postgraduate' | 'doctorate' | 'professional' | 'certification';
export type DocType = 'aadhaar' | 'pan' | 'education_certificate' | 'professional_certificate' | 'experience_letter' | 'photo';
export type VerificationStatus = 'draft' | 'pending' | 'under_review' | 'reupload_requested' | 'approved' | 'rejected';
export type DisplayStatus = 'pending' | 'reupload_required' | 'approved' | 'rejected';
export type FeeUnit = 'per_hour' | 'per_month' | 'per_course';

export interface SessionResult {
  teacherId: string;
  accessToken: string;
  refreshToken: string;
  role: 'teacher';
  nextStep: string;
}

export function registerTeacher(
  registrationToken: string,
  body: { fullName: string; gender: Gender; dateOfBirth: string; categoryId: string; referralCode?: string },
  idempotencyKey: string,
) {
  return api.post<SessionResult>('registration/teacher', body, { token: registrationToken, idempotencyKey });
}

export interface Qualification {
  id: string;
  level: QualificationLevel;
  degree: string;
  institution: string;
  yearCompleted: number | null;
  grade: string | null;
  isHighest: boolean;
  sortOrder: number;
}

export interface SubjectRow {
  subjectId: string;
  name: string;
  isPrimary: boolean;
  experienceYears: number | null;
}
export interface ClassRow {
  classId: string;
  boardId: string | null;
  name: string;
}
export interface ModeRow {
  teachingModeId: string;
  name: string;
  code: string;
}
export interface LocationRow {
  id: string;
  cityId: string;
  cityName: string;
  areaId: string | null;
  areaName: string | null;
  isPrimary: boolean;
  travelRadiusKm: number | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TeacherDraft {
  id: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  email: string | null;
  categoryId: string;
  languages: string[];
  verificationStatus: VerificationStatus;
  experienceYears: number | null;
  highestQualification: string | null;
  bio: string | null;
  feePerHourPaise: number | null;
  demoAvailable: boolean;
  profileCompleteness: number;
  updatedAt: string;
}

export interface RegistrationContext {
  teacher: TeacherDraft;
  qualifications: Qualification[];
  subjects: SubjectRow[];
  classes: ClassRow[];
  teachingModes: ModeRow[];
  locations: LocationRow[];
  completedSteps: string[];
  nextStep: string;
}

export function fetchTeacherRegistration() {
  return api.get<RegistrationContext>('teacher/registration');
}

export interface BasicsPatch {
  fullName?: string;
  gender?: Gender;
  dateOfBirth?: string;
  email?: string | null;
  categoryId?: string;
  languages?: string[];
  experienceYears?: number;
  highestQualification?: string;
  bio?: string;
  feePerHourPaise?: number | null;
  demoAvailable?: boolean;
}

export function patchTeacherBasics(body: BasicsPatch, ifMatch: string) {
  return api.patch<TeacherDraft>('teacher/registration/basics', body, { ifMatch });
}

export interface QualificationInput {
  level: QualificationLevel;
  degree: string;
  institution: string;
  yearCompleted?: number | null;
  grade?: string | null;
  isHighest?: boolean;
}

export function addQualification(body: QualificationInput) {
  return api.post<Qualification>('teacher/qualifications', body);
}
export function editQualification(id: string, body: Partial<QualificationInput>) {
  return api.patch<Qualification>(`teacher/qualifications/${id}`, body);
}
export function deleteQualification(id: string) {
  return api.delete<{ ok: boolean }>(`teacher/qualifications/${id}`);
}

export function setSubjects(items: { subjectId: string; isPrimary: boolean; experienceYears?: number | null }[]) {
  return api.put<{ items: SubjectRow[] }>('teacher/subjects', { items });
}
export function setClasses(items: { classId: string; boardId?: string | null }[]) {
  return api.put<{ items: ClassRow[] }>('teacher/classes', { items });
}
export function setTeachingModes(items: string[]) {
  return api.put<{ items: ModeRow[] }>('teacher/teaching-modes', { items });
}
export function setLocations(
  items: { cityId: string; areaId?: string | null; isPrimary: boolean; travelRadiusKm?: number | null; addressLine?: string | null }[],
) {
  return api.put<{ items: LocationRow[] }>('teacher/locations', { items });
}

// ---- M15 Documents ----

export interface DocumentRow {
  id: string;
  docType: DocType;
  status: string;
  version: number;
  fileId: string;
  title?: string;
  numberMasked?: string;
  reviewNote?: string;
  thumbnailUrl?: string;
}

export interface DocumentsResponse {
  documents: {
    aadhaar: DocumentRow | null;
    pan: DocumentRow | null;
    education_certificate: DocumentRow[];
    professional_certificate: DocumentRow[];
    experience_letter: DocumentRow[];
    photo: DocumentRow | null;
  };
  readyToSubmit: boolean;
  missing: DocType[];
}

export function fetchTeacherDocuments() {
  return api.get<DocumentsResponse>('teacher/documents');
}

export interface CreateDocumentInput {
  docType: DocType;
  fileId: string;
  title?: string;
  docNumber?: string;
  qualificationId?: string;
}

export function createDocument(body: CreateDocumentInput) {
  return api.post<{ id: string; docType: DocType; status: string; numberMasked?: string; version: number }>('teacher/documents', body);
}
export function deleteDocument(id: string) {
  return api.delete<{ ok: boolean }>(`teacher/documents/${id}`);
}
export function submitRegistration(transactionId?: string) {
  return api.post<{ verificationStatus: VerificationStatus; submittedAt: string }>('teacher/registration/submit', transactionId ? { transactionId } : {});
}

// ---- M16 Verification ----

export interface VerificationTimelineEvent {
  at: string;
  event: string;
  label: string;
  docType?: DocType;
}
export interface VerificationResponse {
  verificationStatus: VerificationStatus;
  displayStatus: DisplayStatus;
  submittedAt?: string;
  isVerifiedBadge: boolean;
  documents: { docType: DocType; status: string; reviewNote?: string; replaced?: boolean }[];
  canResubmit: boolean;
  timeline: VerificationTimelineEvent[];
  profileCompleteness?: number;
  rejectionReasonCode?: string;
  rejectionNote?: string;
  rejectedAt?: string;
  canReapplyAt?: string;
  reapplyBlocked?: boolean;
}

export function fetchVerification() {
  return api.get<VerificationResponse>('teacher/verification');
}
export function resubmitVerification() {
  return api.post<{ verificationStatus: VerificationStatus }>('teacher/verification/resubmit');
}

// ---- M17 Profile ----

export interface CompletenessItem {
  key: string;
  label: string;
  earned: number;
  of: number;
}
export interface TeacherProfile {
  teacher: TeacherDraft & { photoUrl: string | null; isVerifiedBadge: boolean };
  completeness: { percent: number; items: CompletenessItem[] };
  subjects: SubjectRow[];
  classes: ClassRow[];
  feePlans: FeePlan[];
}

export function fetchTeacherProfile() {
  return api.get<TeacherProfile>('teacher/profile');
}

export interface ProfilePatch extends BasicsPatch {
  profilePhotoFileId?: string;
  reason?: string;
}
export function patchTeacherProfile(body: ProfilePatch, ifMatch: string) {
  return api.patch<TeacherDraft>('teacher/profile', body, { ifMatch });
}

export interface ProfilePreview {
  visibleToParents: boolean;
  teacher: {
    id: string;
    publicCode: string;
    fullName: string;
    categoryName: string;
    photoUrl: string | null;
    bio: string | null;
    languages: string[];
    experienceYears: number | null;
    highestQualification: string | null;
    feePerHourPaise: number | null;
    demoAvailable: boolean;
    isVerifiedBadge: boolean;
  };
  trustScore: number | null;
  rating: { avg: number | null; count: number };
  subjects: { subjectId: string; name: string; isPrimary: boolean }[];
  classes: { classId: string; name: string }[];
  teachingModes: { id: string; name: string }[];
  locations: { cityName: string; areaName: string | null; isPrimary: boolean }[];
  feePlans: FeePlan[];
  availability: { weeklySlots: number; demoDays: number[] };
}
export function fetchProfilePreview() {
  return api.get<ProfilePreview>('teacher/profile/preview');
}

export interface FeePlan {
  id: string;
  label: string;
  subjectId: string | null;
  classFromId: string | null;
  classToId: string | null;
  teachingModeId: string | null;
  feeUnit: FeeUnit;
  amountPaise: number;
  sessionsPerWeek: number | null;
  sessionMinutes: number | null;
  notes: string | null;
  sortOrder: number;
}
export interface FeePlanInput {
  label: string;
  subjectId?: string | null;
  classFromId?: string | null;
  classToId?: string | null;
  teachingModeId?: string | null;
  feeUnit: FeeUnit;
  amountPaise: number;
  sessionsPerWeek?: number | null;
  sessionMinutes?: number | null;
  notes?: string | null;
}
export function fetchFeePlans() {
  return api.get<FeePlan[]>('teacher/fee-plans');
}
export function createFeePlan(body: FeePlanInput) {
  return api.post<FeePlan>('teacher/fee-plans', body);
}
export function updateFeePlan(id: string, body: Partial<FeePlanInput>) {
  return api.patch<FeePlan>(`teacher/fee-plans/${id}`, body);
}
export function deleteFeePlan(id: string) {
  return api.delete<{ ok: boolean }>(`teacher/fee-plans/${id}`);
}

// ---- M18 Dashboard ----

export interface KpiValue {
  value: number | null;
  previous?: number;
  deltaPct?: number | null;
}
export interface DashboardResponse {
  verificationStatus: VerificationStatus;
  range: 7 | 30;
  period?: { from: string; to: string };
  kpis: {
    profileViews: KpiValue;
    uniqueViewers: KpiValue;
    leadRequests: KpiValue;
    demoRequests: KpiValue;
    demosCompleted: KpiValue;
    reviewsPublished: KpiValue;
    avgRating: KpiValue;
  } | null;
  responseRatePct: number | null;
  medianFirstResponseMinutes: number | null;
  trustScore: { score: number; band: 'excellent' | 'good' | 'fair' | 'poor'; suggestion: string } | null;
  profileCompleteness: { percent: number; nextItem: { key: string; label: string; points: number } | null } | null;
  unansweredLeads: number;
  openLeads?: number;
  upcomingDemos?: number;
  recentActivity: { type: string; at: string; label: string; deepLink?: string }[];
}
export function fetchDashboard(range: 7 | 30) {
  return api.get<DashboardResponse>('teacher/dashboard', { searchParams: { range: String(range) } });
}

// ---- M19 Availability ----

export interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teachingModeId: string | null;
  teachingMode: string | null;
  acceptsDemos: boolean;
}
export interface TimeOffRow {
  id: string;
  startsOn: string;
  endsOn: string;
  reason: string | null;
  pauseLeads: boolean;
}
export interface AvailabilityResponse {
  windows: AvailabilityWindow[];
  timeOff: TimeOffRow[];
}
export function fetchAvailability() {
  return api.get<AvailabilityResponse>('teacher/availability');
}
export function setAvailability(
  items: { dayOfWeek: number; startTime: string; endTime: string; teachingModeId?: string | null; acceptsDemos: boolean }[],
) {
  return api.put<AvailabilityResponse>('teacher/availability', { items });
}
export function fetchTimeOff() {
  return api.get<TimeOffRow[]>('teacher/time-off');
}
export interface TimeOffInput {
  startsOn: string;
  endsOn: string;
  reason?: string;
  pauseLeads: boolean;
  confirmForce?: boolean;
}
export function addTimeOff(body: TimeOffInput, idempotencyKey: string) {
  return api.post<{ id: string; startsOn: string; endsOn: string; pauseLeads: boolean; cancelledDemoCount: number }>('teacher/time-off', body, { idempotencyKey });
}
export function deleteTimeOff(id: string) {
  return api.delete<{ ok: boolean }>(`teacher/time-off/${id}`);
}
