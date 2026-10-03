import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, StyleSheet } from 'react-native';
import { Card, SectionHeader } from '../../../components/ui';
import { StatusBanner } from '../components/StatusBanner';
import { KpiTile } from '../components/KpiTile';
import { tokens } from '../../../theme/tokens';
import { useTeacherDashboardQuery } from '../hooks';

const BAND_LABEL: Record<string, string> = { excellent: 'Excellent', good: 'Good', fair: 'Fair', poor: 'Needs work' };

export function TeacherDashboard() {
  const [range, setRange] = useState<7 | 30>(7);
  const dashboard = useTeacherDashboardQuery(range);
  const d = dashboard.data;

  const bannerStatus = d?.verificationStatus === 'reupload_requested' ? 'reupload_required' : d?.verificationStatus === 'approved' ? null : 'pending';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={dashboard.isFetching} onRefresh={() => dashboard.refetch()} />}
    >
      <Text style={styles.greeting}>Your dashboard</Text>

      {bannerStatus ? (
        <StatusBanner displayStatus={bannerStatus as any} subtitle={bannerStatus === 'pending' ? 'Most decisions are made within 24 hours' : undefined} />
      ) : null}

      <View style={styles.rangeToggle}>
        {[7, 30].map((r) => (
          <Pressable key={r} style={[styles.rangeBtn, range === r && styles.rangeBtnOn]} onPress={() => setRange(r as 7 | 30)}>
            <Text style={[styles.rangeText, range === r && styles.rangeTextOn]}>{r} days</Text>
          </Pressable>
        ))}
      </View>

      {d?.kpis ? (
        <View style={styles.grid}>
          <KpiTile label="Profile views" value={String(d.kpis.profileViews.value ?? 0)} delta={d.kpis.profileViews.deltaPct} />
          <KpiTile label="Leads" value={String(d.kpis.leadRequests.value ?? 0)} delta={d.kpis.leadRequests.deltaPct} />
          <KpiTile label="Demos completed" value={String(d.kpis.demosCompleted.value ?? 0)} delta={d.kpis.demosCompleted.deltaPct} />
          <KpiTile label="Reviews" value={String(d.kpis.reviewsPublished.value ?? 0)} delta={d.kpis.reviewsPublished.deltaPct} />
          <KpiTile label="Response rate" value={d.responseRatePct != null ? `${d.responseRatePct.toFixed(0)}%` : '—'} />
          <KpiTile label="Avg rating" value={d.kpis.avgRating.value != null ? `${d.kpis.avgRating.value.toFixed(2)}★` : 'No reviews yet'} />
        </View>
      ) : (
        <Card style={styles.pendingCard}>
          <Text style={styles.pendingText}>Numbers appear once you're approved</Text>
        </Card>
      )}

      {d?.unansweredLeads ? (
        <Card style={styles.warnCard}>
          <Text style={styles.warnText}>
            {d.unansweredLeads} lead{d.unansweredLeads === 1 ? '' : 's'} waiting more than 24 hours — reply now
          </Text>
        </Card>
      ) : null}

      {d?.trustScore ? (
        <Card style={styles.trustCard}>
          <SectionHeader title="Trust score" />
          <View style={styles.trustRow}>
            <Text style={styles.trustScore}>{Math.round(d.trustScore.score)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.trustBand}>{BAND_LABEL[d.trustScore.band] ?? d.trustScore.band}</Text>
              <Text style={styles.trustSuggestion}>{d.trustScore.suggestion}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {d?.profileCompleteness && d.profileCompleteness.percent < 100 ? (
        <Card style={styles.completenessCard}>
          <Text style={styles.completenessTitle}>Profile {d.profileCompleteness.percent}% complete</Text>
          {d.profileCompleteness.nextItem ? <Text style={styles.completenessNext}>+{d.profileCompleteness.nextItem.points}% · {d.profileCompleteness.nextItem.label}</Text> : null}
        </Card>
      ) : null}

      <SectionHeader title="Recent activity" />
      {(d?.recentActivity ?? []).length === 0 ? (
        <Text style={styles.emptyActivity}>Nothing yet — check back after your first views and leads.</Text>
      ) : (
        d!.recentActivity.map((a, i) => (
          <View key={i} style={styles.activityRow}>
            <Text style={styles.activityLabel}>{a.label}</Text>
            <Text style={styles.activityAt}>{new Date(a.at).toLocaleDateString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  greeting: { fontSize: 20, fontFamily: tokens.font.display, color: tokens.light.ink, marginBottom: 14 },
  rangeToggle: { flexDirection: 'row', backgroundColor: tokens.light.surface3, borderRadius: tokens.radii.pill, padding: 3, marginBottom: 16, alignSelf: 'flex-start' },
  rangeBtn: { paddingHorizontal: 16, height: 32, borderRadius: tokens.radii.pill, alignItems: 'center', justifyContent: 'center' },
  rangeBtnOn: { backgroundColor: tokens.light.surface },
  rangeText: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink3 },
  rangeTextOn: { color: tokens.light.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  pendingCard: { marginBottom: 16, alignItems: 'center' },
  pendingText: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  warnCard: { backgroundColor: tokens.light.warnSoft, marginBottom: 16 },
  warnText: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.warn },
  trustCard: { marginBottom: 16, gap: 10 },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  trustScore: { fontSize: 32, fontFamily: tokens.font.display, color: tokens.light.pri },
  trustBand: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  trustSuggestion: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink2, marginTop: 2 },
  completenessCard: { marginBottom: 16, gap: 4 },
  completenessTitle: { fontSize: 13, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  completenessNext: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  emptyActivity: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 8 },
  activityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tokens.light.line },
  activityLabel: { flex: 1, fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink, marginRight: 8 },
  activityAt: { fontSize: 11, fontFamily: tokens.font.body, color: tokens.light.ink3 },
});
