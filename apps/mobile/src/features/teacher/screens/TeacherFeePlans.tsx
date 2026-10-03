import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { TopBar, Button, EmptyState } from '../../../components/ui';
import { FeePlanCard } from '../components/FeePlanCard';
import { FeePlanFormSheet } from '../components/FeePlanFormSheet';
import { tokens } from '../../../theme/tokens';
import { useTeacherProfileQuery, useFeePlanMutations } from '../hooks';
import type { FeePlan, FeePlanInput } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherFeePlans'>;

export function TeacherFeePlans({ navigation }: Props) {
  const profile = useTeacherProfileQuery();
  const mutations = useFeePlanMutations();
  const [editing, setEditing] = useState<FeePlan | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const plans = profile.data?.feePlans ?? [];

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(p: FeePlan) {
    setEditing(p);
    setSheetOpen(true);
  }
  function onSave(body: FeePlanInput) {
    const mutation = editing ? mutations.edit : mutations.add;
    const payload = editing ? { id: editing.id, body } : body;
    (mutation.mutate as any)(payload, { onSuccess: () => setSheetOpen(false) });
  }

  return (
    <View style={styles.container}>
      <TopBar title="Fee plans" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {plans.length === 0 ? (
          <EmptyState title="Add your pricing" body="So parents know what to expect before they reach out." />
        ) : (
          plans.map((p) => <FeePlanCard key={p.id} plan={p} onEdit={() => openEdit(p)} onDelete={() => mutations.remove.mutate(p.id)} />)
        )}
        <Button title="+ Add fee plan" variant="outline" onPress={openAdd} disabled={plans.length >= 12} />
      </ScrollView>
      <FeePlanFormSheet
        visible={sheetOpen}
        initial={editing}
        subjects={profile.data?.subjects ?? []}
        classes={profile.data?.classes ?? []}
        modes={[]}
        onCancel={() => setSheetOpen(false)}
        onSave={onSave}
        saving={mutations.add.isPending || mutations.edit.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4, flexGrow: 1 },
});
