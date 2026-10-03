import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { TeacherDashboard } from '../../features/teacher/screens/TeacherDashboard';
import { TeacherProfile } from '../../features/teacher/screens/TeacherProfile';
import { TeacherAccount } from '../../features/teacher/screens/TeacherAccount';
import type { TeacherTabParamList } from './types';

const Tab = createBottomTabNavigator<TeacherTabParamList>();

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const ICONS: Record<keyof TeacherTabParamList, [IconName, IconName]> = {
  TeacherDashboardTab: ['grid', 'grid-outline'],
  TeacherProfileTab: ['person', 'person-outline'],
  TeacherAccountTab: ['settings', 'settings-outline'],
};

export function TeacherTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: tokens.light.pri,
        tabBarInactiveTintColor: tokens.light.ink3,
        tabBarLabelStyle: { fontFamily: tokens.font.bodySemi, fontSize: 11 },
        tabBarStyle: { backgroundColor: tokens.light.surface, borderTopColor: tokens.light.line, height: 56 + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 6 },
        tabBarIcon: ({ focused, color, size }) => <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="TeacherDashboardTab" component={TeacherDashboard} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="TeacherProfileTab" component={TeacherProfile} options={{ title: 'Profile' }} />
      <Tab.Screen name="TeacherAccountTab" component={TeacherAccount} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}
