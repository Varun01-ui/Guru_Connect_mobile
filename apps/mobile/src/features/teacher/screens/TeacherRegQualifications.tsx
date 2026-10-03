import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Button, StickyActionBar, EmptyState } from '../../../components/ui';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { QualificationCard } from '../components/QualificationCard';
import { QualificationFormSheet } from '../components/QualificationFormSheet';
import { tokens } from '../../../theme/tokens';
import { useTeacherRegistrationQuery, useQualificationMutations } from '../hooks';
import type { Qualification, QualificationInput } from '../api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegQualifications'>;

export function TeacherRegQualifications({ navigation }: Props) {
  const reg = useTeacherRegistrationQuery();
  const mutations = useQualificationMutations();
  const [editing, setEditing] = useState<Qualification | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const qualifications = reg.data?.qualifications ?? [];

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }
  function openEdit(q: Qualification) {
    setEditing(q);
    setSheetOpen(true);
  }

  function onSave(body: QualificationInput) {
    const mutation = editing ? mutations.edit : mutations.add;
    const payload = editing ? { id: editing.id, body } : body;
    (mutation.mutate as any)(payload, { onSuccess: () => setSheetOpen(false) });
  }

  return (
    <View style={styles.container}>
      <RegistrationProgressHeader step={2} title="Qualifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {qualifications.length === 0 ? (
          <EmptyState title="Add your first qualification" body="Your degrees and certifications help parents trust your expertise." />
        ) : (
          qualifications.map((q) => <QualificationCard key={q.id} qualification={q} onEdit={() => openEdit(q)} onDelete={() => mutations.remove.mutate(q.id)} />)
        )}
        <Button title="+ Add qualification" variant="outline" onPress={openAdd} />
      </ScrollView>
      <StickyActionBar>
        <Button title="Next" onPress={() => navigation.navigate('TeacherRegExperience')} disabled={qualifications.length === 0} />
      </StickyActionBar>
      <QualificationFormSheet
        visible={sheetOpen}
        initial={editing}
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
