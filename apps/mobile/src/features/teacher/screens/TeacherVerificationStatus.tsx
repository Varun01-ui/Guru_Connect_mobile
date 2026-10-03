import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, Button, StickyActionBar, Card } from '../../../components/ui';
import { StatusBanner } from '../components/StatusBanner';
import { tokens } from '../../../theme/tokens';
import { useTeacherVerificationQuery, useResubmitMutation } from '../hooks';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherVerificationStatus'>;

const REASON_COPY: Record<string, string> = {
  NAME_MISMATCH: 'The name on your documents did not match.',
  FORGED_DOCUMENT: "This account can't be used to register again.",
};

function relativeDays(iso?: string): string {
  if (!iso) return '';
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000)));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function TeacherVerificationStatus({ navigation }: Props) {
  const verification = useTeacherVerificationQuery();
  const resubmit = useResubmitMutation();

  if (!verification.data) {
    return (
      <View style={styles.container}>
        <TopBar title="Verification status" />
      </View>
    );
  }

  const v = verification.data;
  const flagged = v.documents.filter((d) => d.status === 'reupload_requested' || d.status === 'rejected');
  const allReplaced = flagged.every((d) => d.replaced !== false);

  async function onResubmit() {
    try {
      await resubmit.mutateAsync();
    } catch {
      // surfaced via the refetched status below
    }
  }

  const reapplyBlocked = v.reapplyBlocked ?? false;
  const canReapplyNow = v.canReapplyAt ? new Date(v.canReapplyAt).getTime() <= Date.now() : false;

  return (
    <View style={styles.container}>
      <TopBar title="Verification status" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <StatusBanner
          displayStatus={v.displayStatus}
          subtitle={
            v.displayStatus === 'pending'
              ? `Submitted ${relativeDays(v.submittedAt)} · Most applications are decided within 24 hours`
              : v.displayStatus === 'approved' && v.isVerifiedBadge
                ? 'Verified badge granted'
                : undefined
          }
        />

        {v.displayStatus === 'reupload_required'
          ? flagged.map((d) => (
              <Card key={d.docType} style={styles.flagCard}>
                <Text style={styles.flagTitle}>{d.docType.replace(/_/g, ' ')}</Text>
                <Text style={styles.flagNote}>{d.reviewNote}</Text>
                <Button title="Re-upload" variant="outline" onPress={() => navigation.navigate('TeacherDocuments')} />
              </Card>
            ))
          : null}

        {v.displayStatus === 'approved' ? (
          <Card style={styles.completeCard}>
            <Text style={styles.completeTitle}>Your profile is {v.profileCompleteness ?? 0}% complete</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${v.profileCompleteness ?? 0}%` }]} />
            </View>
            <Button title="Complete your profile" onPress={() => navigation.replace('TeacherMain')} />
          </Card>
        ) : null}

        {v.displayStatus === 'rejected' ? (
          <Card style={styles.flagCard}>
            <Text style={styles.flagNote}>{v.rejectionNote ?? REASON_COPY[v.rejectionReasonCode ?? ''] ?? 'Your application was not approved.'}</Text>
            {v.rejectionReasonCode === 'FORGED_DOCUMENT' ? (
              <Text style={styles.flagNote}>This account can't be used to register — contact support.</Text>
            ) : reapplyBlocked ? null : canReapplyNow ? (
              <Button title="Apply again" />
            ) : (
              <Text style={styles.flagNote}>You can apply again once the review window has passed.</Text>
            )}
          </Card>
        ) : null}

        <Text style={styles.timelineTitle}>Timeline</Text>
        {v.timeline.map((e, i) => (
          <View key={`${e.event}-${i}`} style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.timelineLabel}>{e.label}</Text>
              <Text style={styles.timelineAt}>{new Date(e.at).toLocaleString()}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      {v.displayStatus === 'reupload_required' && flagged.length > 0 && allReplaced ? (
        <StickyActionBar>
          <Button title="Send back for review" onPress={onResubmit} loading={resubmit.isPending} />
        </StickyActionBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  flagCard: { marginBottom: 12, gap: 8 },
  flagTitle: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, textTransform: 'capitalize' },
  flagNote: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  completeCard: { marginBottom: 16, gap: 10 },
  completeTitle: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  progressTrack: { height: 8, borderRadius: tokens.radii.pill, backgroundColor: tokens.light.surface3, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: tokens.light.good, borderRadius: tokens.radii.pill },
  timelineTitle: { fontSize: 14, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, marginBottom: 10, marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.light.pri, marginTop: 6 },
  timelineLabel: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink },
  timelineAt: { fontSize: 11, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 1 },
});
