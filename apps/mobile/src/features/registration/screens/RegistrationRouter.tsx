import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, Card } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import * as api from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistrationRouter'>;

export function RegistrationRouter({ route, navigation }: Props) {
  const { registrationToken } = route.params;
  const context = useQuery({
    queryKey: ['registration', 'context', registrationToken],
    queryFn: () => api.fetchRegistrationContext(registrationToken),
  });

  function onSelectRole(code: string) {
    if (code === 'parent') {
      navigation.replace('ParentRegistration', { registrationToken });
      return;
    }
    if (code === 'teacher') {
      navigation.replace('TeacherRegIntro', { registrationToken });
      return;
    }
    Alert.alert('Coming soon', "This role's registration isn't built yet.");
  }

  return (
    <View style={styles.container}>
      <TopBar />
      <View style={styles.body}>
        <Text style={styles.heading}>Welcome! Who's signing up?</Text>
        {context.data ? <Text style={styles.subtext}>You verified {context.data.verifiedValue}.</Text> : null}
        <View style={styles.tiles}>
          {(context.data?.roles ?? []).map((role) => (
            <Pressable key={role.code} onPress={() => onSelectRole(role.code)}>
              <Card style={styles.tile}>
                <View style={styles.tileIcon} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tileTitle}>{role.title}</Text>
                  <Text style={styles.tileSubtitle}>{role.subtitle}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  body: { padding: 24 },
  heading: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 6 },
  subtext: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, marginBottom: 20 },
  tiles: { gap: 10 },
  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  tileIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: tokens.light.surface3 },
  tileTitle: { fontSize: 15, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  tileSubtitle: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink2, marginTop: 2 },
});
