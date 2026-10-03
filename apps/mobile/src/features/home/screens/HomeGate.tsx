import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { ErrorState } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import { useMeQuery } from '../../platform/hooks';
import { useSession } from '../../../lib/session.store';
import { useTeacherRegistrationQuery } from '../../teacher/hooks';
import { TEACHER_STEP_ROUTE } from '../../teacher/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// Where every successful sign-in lands. A parent with no children yet must finish
// child setup first (BR-7.8); a teacher resumes wherever their registration/
// verification left off; everyone else goes straight to the app.
export function HomeGate({ navigation }: Props) {
  const role = useSession((s) => s.role);
  const isTeacher = role === 'teacher';
  const me = useMeQuery(!isTeacher);
  const teacherReg = useTeacherRegistrationQuery();

  useEffect(() => {
    if (isTeacher) return;
    if (!me.data) return;
    if (me.data.registration.nextStep === 'child_setup') navigation.replace('ChildrenSetup', { mode: 'setup' });
    else navigation.replace('Main');
  }, [isTeacher, me.data, navigation]);

  useEffect(() => {
    if (!isTeacher) return;
    if (!teacherReg.data) return;
    const { teacher, nextStep } = teacherReg.data;
    if (teacher.verificationStatus !== 'draft') {
      navigation.replace(teacher.verificationStatus === 'approved' ? 'TeacherMain' : 'TeacherVerificationStatus');
      return;
    }
    if (nextStep === 'documents') navigation.replace('TeacherDocuments');
    else navigation.replace((TEACHER_STEP_ROUTE[nextStep] ?? 'TeacherRegBasics') as any);
  }, [isTeacher, teacherReg.data, navigation]);

  const isError = isTeacher ? teacherReg.isError : me.isError;
  const onRetry = isTeacher ? () => teacherReg.refetch() : () => me.refetch();

  if (isError) {
    return (
      <View style={styles.container}>
        <ErrorState title="Couldn't load your account" body="Check your connection and try again." onRetry={onRetry} />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator color={tokens.light.pri} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
});
