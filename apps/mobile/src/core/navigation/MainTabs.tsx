import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../theme/tokens';
import { comingSoonScreen } from '../../features/home/screens/ComingSoon';
import { ParentHome } from '../../features/home/screens/ParentHome';
import { Account } from '../../features/profile/screens/Account';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const Search = comingSoonScreen('Search', 'search-outline', 'Find teachers by subject, class or area. Coming soon.');
const Saved = comingSoonScreen('Saved teachers', 'heart-outline', 'Teachers you save will show up here. Coming soon.');
const Requests = comingSoonScreen('My requests', 'chatbubbles-outline', 'Your enquiries and demo requests will show up here. Coming soon.');

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof MainTabParamList, [IconName, IconName]> = {
  HomeTab: ['home', 'home-outline'],
  SearchTab: ['search', 'search-outline'],
  SavedTab: ['heart', 'heart-outline'],
  RequestsTab: ['chatbubbles', 'chatbubbles-outline'],
  AccountTab: ['person', 'person-outline'],
};

// The bottom tab bar from the prototype. Only Home and Account are built so far.
export function MainTabs() {
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
      <Tab.Screen name="HomeTab" component={ParentHome} options={{ title: 'Home' }} />
      <Tab.Screen name="SearchTab" component={Search} options={{ title: 'Search' }} />
      <Tab.Screen name="SavedTab" component={Saved} options={{ title: 'Saved' }} />
      <Tab.Screen name="RequestsTab" component={Requests} options={{ title: 'Requests' }} />
      <Tab.Screen name="AccountTab" component={Account} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}
