import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Button, StickyActionBar, Select } from '../../../components/ui';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { tokens } from '../../../theme/tokens';
import { useMastersQuery } from '../../platform/hooks';
import { useTeacherRegistrationQuery, useReplaceClassesMutation } from '../hooks';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegClasses'>;

const MAX_CLASSES = 20;

export function TeacherRegClasses({ navigation }: Props) {
  const masters = useMastersQuery();
  const reg = useTeacherRegistrationQuery();
  const save = useReplaceClassesMutation();
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!reg.data || hydrated) return;
    const next: Record<string, string | null> = {};
    for (const c of reg.data.classes) next[c.classId] = c.boardId;
    setSelected(next);
    setHydrated(true);
  }, [reg.data, hydrated]);

  const classes = masters.data?.classes ?? [];
  const boardOptions = (masters.data?.boards ?? []).map((b) => ({ label: b.shortName ?? b.name, value: b.id }));
  const selectedIds = Object.keys(selected);
  const canSave = selectedIds.length > 0 && !save.isPending;

  function toggle(id: string) {
    setSelected((prev) => {
      if (id in prev) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      if (Object.keys(prev).length >= MAX_CLASSES) return prev;
      return { ...prev, [id]: null };
    });
  }

  async function onNext() {
    setError(undefined);
    try {
      const items = Object.entries(selected).map(([classId, boardId]) => ({ classId, boardId }));
      await save.mutateAsync(items);
      navigation.navigate('TeacherRegModes');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <View style={styles.container}>
      <RegistrationProgressHeader step={5} title="Classes" onBack={() => navigation.goBack()} />
      <FlatList
        data={classes}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const checked = item.id in selected;
          return (
            <View style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => toggle(item.id)}>
                <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? tokens.light.pri : tokens.light.ink3} />
                <Text style={styles.rowLabel}>{item.name}</Text>
              </Pressable>
              {checked ? (
                <View style={styles.boardSelect}>
                  <Select
                    label=""
                    placeholder="Board (optional)"
                    options={boardOptions}
                    value={selected[item.id] ?? undefined}
                    onChange={(v) => setSelected((prev) => ({ ...prev, [item.id]: v }))}
                  />
                </View>
              ) : null}
            </View>
          );
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <StickyActionBar>
        <Button title="Next" onPress={onNext} loading={save.isPending} disabled={!canSave} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  list: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: tokens.light.line },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  rowLabel: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink },
  boardSelect: { marginTop: 4, marginLeft: 30, marginBottom: -8 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginHorizontal: 20 },
});
