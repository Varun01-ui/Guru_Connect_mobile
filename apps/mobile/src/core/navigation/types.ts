import type { RailCode } from '../../features/home/api';

export type RootStackParamList = {
  Splash: undefined;
  Maintenance: undefined;
  ForceUpdate: undefined;
  NoConnection: undefined;
  Onboarding: undefined;
  Login: { tab?: 'otp' | 'email' } | undefined;
  OtpVerify: { challengeId: string; destination: string };
  ForgotPassword: undefined;
  ResetPassword: { challengeId: string; email: string };
  ActiveSessions: undefined;
  RegistrationRouter: { registrationToken: string; contactType: 'phone' | 'email' | 'google' };
  ParentRegistration: { registrationToken: string };
  // Where every sign-in lands: decides between child setup and the main app.
  Home: undefined;
  ChildrenSetup: { mode?: 'setup' | 'manage' } | undefined;
  Main: undefined;
  RailList: { rail: RailCode; title: string; childId?: string };
  EditProfile: undefined;
  // Teacher onboarding (M14-M16)
  TeacherRegIntro: { registrationToken: string };
  TeacherRegBasics: undefined;
  TeacherRegQualifications: undefined;
  TeacherRegExperience: undefined;
  TeacherRegSubjects: undefined;
  TeacherRegClasses: undefined;
  TeacherRegModes: undefined;
  TeacherRegLocations: undefined;
  TeacherDocuments: { scopedTypes?: string[] } | undefined;
  TeacherDocumentCapture: { docType: 'aadhaar' | 'pan' | 'education_certificate' | 'professional_certificate' | 'experience_letter' | 'photo' };
  TeacherRegistrationSubmitted: undefined;
  TeacherVerificationStatus: undefined;
  // Teacher main app (M17-M19)
  TeacherMain: undefined;
  TeacherProfileAbout: undefined;
  TeacherProfileExperience: undefined;
  TeacherFeePlans: undefined;
  TeacherProfilePreview: undefined;
  TeacherAvailability: undefined;
};

export type TeacherTabParamList = {
  TeacherDashboardTab: undefined;
  TeacherProfileTab: undefined;
  TeacherAccountTab: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  SavedTab: undefined;
  RequestsTab: undefined;
  AccountTab: undefined;
};
