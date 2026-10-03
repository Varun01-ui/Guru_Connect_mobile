import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Button, Card } from '../../../components/ui';
import { useAppFlags } from '../../../lib/appFlags.store';
import { useBootstrapQuery } from '../../platform/hooks';
import { tokens } from '../../../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// Mirrors the prototype's 'welcome' screen: one hero card with two floating
// verified-teacher previews, the headline, and three trust-signal rows.
const TRUST_SIGNALS: [string, string][] = [
  ['Verified before listed', 'ID and qualification checked by our team'],
  ['Trust Score out of 100', 'Built from verification, reviews and track record'],
  ['Reviews from real families', 'Only registered parents and students can review'],
];

export function Onboarding({ navigation }: Props) {
  const bootstrap = useBootstrapQuery();
  const setOnboardingSeen = useAppFlags((s) => s.setOnboardingSeen);

  function continueToLogin() {
    setOnboardingSeen(bootstrap.data?.onboardingVersion ?? 1);
    navigation.replace('Login');
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Card style={[styles.floatCard, styles.floatCardTop]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>PN</Text>
            </View>
            <View>
              <Text style={styles.floatName}>Priya Nair</Text>
              <Text style={styles.floatSub}>Biology · NEET</Text>
            </View>
          </Card>
          <Card style={[styles.floatCard, styles.floatCardBottom]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
            <View>
              <Text style={styles.floatName}>Dr. Ananya Iyer</Text>
              <Text style={styles.floatSub}>Physics · JEE</Text>
            </View>
          </Card>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Aadhaar verified</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PAN verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.headlineBlock}>
          <Text style={styles.headline}>Find a teacher you can trust.</Text>
          <Text style={styles.subcopy}>
            Every GuruConnect teacher is checked with Aadhaar, PAN and education certificates before they appear in search.
          </Text>
        </View>

        <View style={styles.signals}>
          {TRUST_SIGNALS.map(([title, body]) => (
            <View key={title} style={styles.signalRow}>
              <View style={styles.signalIcon} />
              <View style={styles.signalText}>
                <Text style={styles.signalTitle}>{title}</Text>
                <Text style={styles.signalBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Get started" onPress={continueToLogin} />
        <View style={{ height: 8 }} />
        <Button title="I already have an account" variant="outline" onPress={continueToLogin} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 24, gap: 22 },
  hero: { height: 260, borderRadius: tokens.radii.xl, backgroundColor: tokens.light.hero, overflow: 'hidden', justifyContent: 'center' },
  floatCard: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 10, width: 190, padding: 12 },
  floatCardTop: { left: 18, top: 28, transform: [{ rotate: '-4deg' }] },
  floatCardBottom: { right: 14, top: 100, transform: [{ rotate: '3deg' }] },
  avatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: tokens.light.priSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontFamily: tokens.font.bodyBold, color: tokens.light.priInk },
  floatName: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  floatSub: { fontSize: 11, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  badgeRow: { position: 'absolute', left: 24, bottom: 22, flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: tokens.radii.pill },
  badgeText: { fontSize: 11, fontFamily: tokens.font.bodySemi, color: tokens.light.heroInk },
  headlineBlock: { gap: 8 },
  headline: { fontSize: 26, lineHeight: 32, fontFamily: tokens.font.display, color: tokens.light.ink },
  subcopy: { fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  signals: { gap: 14 },
  signalRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  signalIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: tokens.light.priSoft },
  signalText: { flex: 1 },
  signalTitle: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  signalBody: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  footer: { padding: 16 },
});
