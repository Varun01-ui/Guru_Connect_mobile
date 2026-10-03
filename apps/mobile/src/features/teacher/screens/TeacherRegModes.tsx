import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Button, StickyActionBar, OptionCard } from '../../../components/ui';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { tokens } from '../../../theme/tokens';
import { useMastersQuery } from '../../platform/hooks';
import { useTeacherRegistrationQuery, useReplaceModesMutation } from '../hooks';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegModes'>;

function iconForMode(name: string): React.ComponentProps<typeof OptionCard>['icon'] {
  const n = name.toLowerCase();
  if (n.includes('online')) return 'videocam-outline';
  if (n.includes('home')) return 'home-outline';
  if (n.includes('hybrid')) return 'swap-horizontal-outline';
  return 'business-outline';
}

export function TeacherRegModes({ navigation }: Props) {
  const masters = useMastersQuery();
  const reg = useTeacherRegistrationQuery();
  const save = useReplaceModesMutation();
  const [selected, setSelected] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!reg.data || hydrated) return;
    setSelected(reg.data.teachingModes.map((m) => m.teachingModeId));
    setHydrated(true);
  }, [reg.data, hydrated]);

  const modes = masters.data?.teachingModes ?? [];
  const canSave = selected.length > 0 && !save.isPending;

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : prev.length >= 4 ? prev : [...prev, id]));
  }

  async function onNext() {
    setError(undefined);
    try {
      await save.mutateAsync(selected);
      navigation.navigate('TeacherRegLocations');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <View style={styles.container}>
      <RegistrationProgressHeader step={6} title="Teaching modes" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {modes.map((m) => (
            <OptionCard key={m.id} label={m.name} icon={iconForMode(m.name)} selected={selected.includes(m.id)} onPress={() => toggle(m.id)} />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Next" onPress={onNext} loading={save.isPending} disabled={!canSave} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 12 },
});
