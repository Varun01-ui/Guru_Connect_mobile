import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { Splash } from '../../features/splash/screens/Splash';
import { Maintenance } from '../../features/splash/screens/Maintenance';
import { ForceUpdate } from '../../features/splash/screens/ForceUpdate';
import { NoConnection } from '../../features/splash/screens/NoConnection';
import { Onboarding } from '../../features/onboarding/screens/Onboarding';
import { Login } from '../../features/login/screens/Login';
import { OtpVerify } from '../../features/login/screens/OtpVerify';
import { ForgotPassword } from '../../features/login/screens/ForgotPassword';
import { ResetPassword } from '../../features/login/screens/ResetPassword';
import { ActiveSessions } from '../../features/login/screens/ActiveSessions';
import { RegistrationRouter } from '../../features/registration/screens/RegistrationRouter';
import { ParentRegistration } from '../../features/registration/screens/ParentRegistration';
import { HomeGate } from '../../features/home/screens/HomeGate';
import { RailList } from '../../features/home/screens/RailList';
import { ChildrenSetup } from '../../features/children/screens/ChildrenSetup';
import { EditProfile } from '../../features/profile/screens/EditProfile';
import { MainTabs } from './MainTabs';
import { TeacherTabs } from './TeacherTabs';
import { TeacherRegIntro } from '../../features/teacher/screens/TeacherRegIntro';
import { TeacherRegBasics } from '../../features/teacher/screens/TeacherRegBasics';
import { TeacherRegQualifications } from '../../features/teacher/screens/TeacherRegQualifications';
import { TeacherRegExperience } from '../../features/teacher/screens/TeacherRegExperience';
import { TeacherRegSubjects } from '../../features/teacher/screens/TeacherRegSubjects';
import { TeacherRegClasses } from '../../features/teacher/screens/TeacherRegClasses';
import { TeacherRegModes } from '../../features/teacher/screens/TeacherRegModes';
import { TeacherRegLocations } from '../../features/teacher/screens/TeacherRegLocations';
import { TeacherDocuments } from '../../features/teacher/screens/TeacherDocuments';
import { TeacherDocumentCapture } from '../../features/teacher/screens/TeacherDocumentCapture';
import { TeacherRegistrationSubmitted } from '../../features/teacher/screens/TeacherRegistrationSubmitted';
import { TeacherVerificationStatus } from '../../features/teacher/screens/TeacherVerificationStatus';
import { TeacherProfileAbout } from '../../features/teacher/screens/TeacherProfileAbout';
import { TeacherProfileExperience } from '../../features/teacher/screens/TeacherProfileExperience';
import { TeacherFeePlans } from '../../features/teacher/screens/TeacherFeePlans';
import { TeacherProfilePreview } from '../../features/teacher/screens/TeacherProfilePreview';
import { TeacherAvailability } from '../../features/teacher/screens/TeacherAvailability';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Maintenance" component={Maintenance} />
        <Stack.Screen name="ForceUpdate" component={ForceUpdate} />
        <Stack.Screen name="NoConnection" component={NoConnection} />
        <Stack.Screen name="Onboarding" component={Onboarding} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="OtpVerify" component={OtpVerify} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="ActiveSessions" component={ActiveSessions} />
        <Stack.Screen name="RegistrationRouter" component={RegistrationRouter} />
        <Stack.Screen name="ParentRegistration" component={ParentRegistration} />
        <Stack.Screen name="Home" component={HomeGate} />
        <Stack.Screen
          name="ChildrenSetup"
          component={ChildrenSetup}
          options={({ route }) => ({ gestureEnabled: route.params?.mode === 'manage' })}
        />
        <Stack.Screen name="Main" component={MainTabs} options={{ gestureEnabled: false }} />
        <Stack.Screen name="RailList" component={RailList} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="TeacherRegIntro" component={TeacherRegIntro} />
        <Stack.Screen name="TeacherRegBasics" component={TeacherRegBasics} />
        <Stack.Screen name="TeacherRegQualifications" component={TeacherRegQualifications} />
        <Stack.Screen name="TeacherRegExperience" component={TeacherRegExperience} />
        <Stack.Screen name="TeacherRegSubjects" component={TeacherRegSubjects} />
        <Stack.Screen name="TeacherRegClasses" component={TeacherRegClasses} />
        <Stack.Screen name="TeacherRegModes" component={TeacherRegModes} />
        <Stack.Screen name="TeacherRegLocations" component={TeacherRegLocations} />
        <Stack.Screen name="TeacherDocuments" component={TeacherDocuments} />
        <Stack.Screen name="TeacherDocumentCapture" component={TeacherDocumentCapture} />
        <Stack.Screen name="TeacherRegistrationSubmitted" component={TeacherRegistrationSubmitted} />
        <Stack.Screen name="TeacherVerificationStatus" component={TeacherVerificationStatus} />
        <Stack.Screen name="TeacherMain" component={TeacherTabs} options={{ gestureEnabled: false }} />
        <Stack.Screen name="TeacherProfileAbout" component={TeacherProfileAbout} />
        <Stack.Screen name="TeacherProfileExperience" component={TeacherProfileExperience} />
        <Stack.Screen name="TeacherFeePlans" component={TeacherFeePlans} />
        <Stack.Screen name="TeacherProfilePreview" component={TeacherProfilePreview} />
        <Stack.Screen name="TeacherAvailability" component={TeacherAvailability} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
