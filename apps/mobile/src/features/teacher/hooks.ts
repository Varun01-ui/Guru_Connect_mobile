import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

export const teacherKeys = {
  registration: ['teacher', 'registration'] as const,
  documents: ['teacher', 'documents'] as const,
  verification: ['teacher', 'verification'] as const,
  profile: ['teacher', 'profile'] as const,
  preview: ['teacher', 'profile', 'preview'] as const,
  feePlans: ['teacher', 'feePlans'] as const,
  dashboard: (range: 7 | 30) => ['teacher', 'dashboard', range] as const,
  availability: ['teacher', 'availability'] as const,
};

// ---- M14 Registration ----

export function useTeacherRegistrationQuery() {
  return useQuery({ queryKey: teacherKeys.registration, queryFn: api.fetchTeacherRegistration });
}

export function useSaveBasicsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, ifMatch }: { body: api.BasicsPatch; ifMatch: string }) => api.patchTeacherBasics(body, ifMatch),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.registration }),
  });
}

export function useQualificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: teacherKeys.registration });
  return {
    add: useMutation({ mutationFn: (body: api.QualificationInput) => api.addQualification(body), onSuccess: invalidate }),
    edit: useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<api.QualificationInput> }) => api.editQualification(id, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteQualification(id), onSuccess: invalidate }),
  };
}

export function useReplaceSubjectsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Parameters<typeof api.setSubjects>[0]) => api.setSubjects(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.registration }),
  });
}
export function useReplaceClassesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Parameters<typeof api.setClasses>[0]) => api.setClasses(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.registration }),
  });
}
export function useReplaceModesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: string[]) => api.setTeachingModes(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.registration }),
  });
}
export function useReplaceLocationsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Parameters<typeof api.setLocations>[0]) => api.setLocations(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.registration }),
  });
}

// ---- M15 Documents ----

export function useTeacherDocumentsQuery() {
  return useQuery({ queryKey: teacherKeys.documents, queryFn: api.fetchTeacherDocuments });
}

export function useCreateDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: api.CreateDocumentInput) => api.createDocument(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.documents }),
  });
}
export function useDeleteDocumentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.documents }),
  });
}
export function useSubmitRegistrationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transactionId?: string) => api.submitRegistration(transactionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherKeys.documents });
      qc.invalidateQueries({ queryKey: teacherKeys.registration });
      qc.invalidateQueries({ queryKey: teacherKeys.verification });
    },
  });
}

// ---- M16 Verification ----

export function useTeacherVerificationQuery() {
  return useQuery({ queryKey: teacherKeys.verification, queryFn: api.fetchVerification, staleTime: 30_000 });
}
export function useResubmitMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resubmitVerification(),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.verification }),
  });
}

// ---- M17 Profile ----

export function useTeacherProfileQuery() {
  return useQuery({ queryKey: teacherKeys.profile, queryFn: api.fetchTeacherProfile });
}
export function useTeacherProfilePreviewQuery() {
  return useQuery({ queryKey: teacherKeys.preview, queryFn: api.fetchProfilePreview, staleTime: 0 });
}
export function useSaveProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, ifMatch }: { body: api.ProfilePatch; ifMatch: string }) => api.patchTeacherProfile(body, ifMatch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teacherKeys.profile });
      qc.invalidateQueries({ queryKey: teacherKeys.registration });
    },
  });
}
export function useFeePlanMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: teacherKeys.profile });
  return {
    add: useMutation({ mutationFn: (body: api.FeePlanInput) => api.createFeePlan(body), onSuccess: invalidate }),
    edit: useMutation({ mutationFn: ({ id, body }: { id: string; body: Partial<api.FeePlanInput> }) => api.updateFeePlan(id, body), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id: string) => api.deleteFeePlan(id), onSuccess: invalidate }),
  };
}

// ---- M18 Dashboard ----

export function useTeacherDashboardQuery(range: 7 | 30) {
  return useQuery({ queryKey: teacherKeys.dashboard(range), queryFn: () => api.fetchDashboard(range), staleTime: 60_000 });
}

// ---- M19 Availability ----

export function useTeacherAvailabilityQuery() {
  return useQuery({ queryKey: teacherKeys.availability, queryFn: api.fetchAvailability });
}
export function useSaveAvailabilityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Parameters<typeof api.setAvailability>[0]) => api.setAvailability(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.availability }),
  });
}
export function useAddTimeOffMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, idempotencyKey }: { body: api.TimeOffInput; idempotencyKey: string }) => api.addTimeOff(body, idempotencyKey),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.availability }),
  });
}
export function useDeleteTimeOffMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTimeOff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: teacherKeys.availability }),
  });
}
