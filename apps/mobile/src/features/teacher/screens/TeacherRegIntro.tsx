import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, Button, StickyActionBar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegIntro'>;

const BULLETS = ['Takes about 10 minutes', 'Documents reviewed within 24 hours'];

export function TeacherRegIntro({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <TopBar onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <View style={styles.illustration}>
          <Ionicons name="school-outline" size={48} color={tokens.light.pri} />
        </View>
        <Text style={styles.heading}>Let's get you verified</Text>
        <Text style={styles.subtext}>A few quick steps so parents can find and trust you.</Text>
        {BULLETS.map((b) => (
          <View key={b} style={styles.bulletRow}>
            <Ionicons name="checkmark-circle" size={18} color={tokens.light.good} />
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
      </View>
      <StickyActionBar>
        <Button title="Start" onPress={() => navigation.navigate('TeacherRegBasics')} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  body: { flex: 1, padding: 24, alignItems: 'center' },
  illustration: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: tokens.light.priSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  heading: { fontSize: 22, fontFamily: tokens.font.display, color: tokens.light.ink, textAlign: 'center' },
  subtext: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingVertical: 8 },
  bulletText: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
});
