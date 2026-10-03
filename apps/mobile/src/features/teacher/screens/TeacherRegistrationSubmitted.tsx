import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Button, StickyActionBar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegistrationSubmitted'>;

export function TeacherRegistrationSubmitted({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <View style={styles.icon}>
          <Ionicons name="checkmark-circle" size={56} color={tokens.light.good} />
        </View>
        <Text style={styles.heading}>Application submitted</Text>
        <Text style={styles.subtext}>We're reviewing your documents. Most applications are decided within 24 hours.</Text>
        <Text style={styles.hint}>You'll get a notification the moment there's an update.</Text>
      </View>
      <StickyActionBar>
        <Button title="See verification status" onPress={() => navigation.replace('TeacherVerificationStatus')} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { marginBottom: 20 },
  heading: { fontSize: 22, fontFamily: tokens.font.display, color: tokens.light.ink, textAlign: 'center' },
  subtext: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center', marginTop: 10 },
  hint: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, textAlign: 'center', marginTop: 16 },
});
