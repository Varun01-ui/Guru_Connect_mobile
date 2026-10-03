import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { Button, StickyActionBar } from '../../../components/ui';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { tokens } from '../../../theme/tokens';
import { useMastersQuery } from '../../platform/hooks';
import { useTeacherRegistrationQuery, useReplaceSubjectsMutation } from '../hooks';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegSubjects'>;

interface Selection {
  isPrimary: boolean;
  experienceYears: number;
}

const MAX_SUBJECTS = 10;

export function TeacherRegSubjects({ navigation }: Props) {
  const masters = useMastersQuery();
  const reg = useTeacherRegistrationQuery();
  const save = useReplaceSubjectsMutation();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, Selection>>({});
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!reg.data || hydrated) return;
    const next: Record<string, Selection> = {};
    for (const s of reg.data.subjects) next[s.subjectId] = { isPrimary: s.isPrimary, experienceYears: s.experienceYears ?? 0 };
    setSelected(next);
    setHydrated(true);
  }, [reg.data, hydrated]);

  const subjects = (masters.data?.subjects ?? []).filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const selectedIds = Object.keys(selected);
  const canSave = selectedIds.length > 0 && !save.isPending;

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev[id]) {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      }
      if (Object.keys(prev).length >= MAX_SUBJECTS) return prev;
      const makesFirst = Object.keys(prev).length === 0;
      return { ...prev, [id]: { isPrimary: makesFirst, experienceYears: 0 } };
    });
  }
  function setPrimary(id: string) {
    setSelected((prev) => {
      const next: Record<string, Selection> = {};
      for (const [k, v] of Object.entries(prev)) next[k] = { ...v, isPrimary: k === id };
      return next;
    });
  }
  function bumpExperience(id: string, delta: number) {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id]!, experienceYears: Math.max(0, Math.min(60, prev[id]!.experienceYears + delta)) } }));
  }

  async function onNext() {
    setError(undefined);
    try {
      const items = Object.entries(selected).map(([subjectId, v]) => ({ subjectId, isPrimary: v.isPrimary, experienceYears: v.experienceYears }));
      await save.mutateAsync(items);
      navigation.navigate('TeacherRegClasses');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  return (
    <View style={styles.container}>
      <RegistrationProgressHeader step={4} title="Subjects" onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={tokens.light.ink3} />
        <TextInput style={styles.searchInput} placeholder="Search subjects" value={query} onChangeText={setQuery} />
      </View>
      <FlatList
        data={subjects}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const sel = selected[item.id];
          const checked = !!sel;
          return (
            <View style={styles.row}>
              <Pressable style={styles.rowMain} onPress={() => toggle(item.id)}>
                <Ionicons name={checked ? 'checkbox' : 'square-outline'} size={20} color={checked ? tokens.light.pri : tokens.light.ink3} />
                <Text style={styles.rowLabel}>{item.name}</Text>
              </Pressable>
              {checked ? (
                <>
                  <Pressable onPress={() => setPrimary(item.id)} hitSlop={8}>
                    <Ionicons name={sel!.isPrimary ? 'star' : 'star-outline'} size={18} color={tokens.light.star} />
                  </Pressable>
                  <Pressable onPress={() => bumpExperience(item.id, -1)} hitSlop={8} style={styles.expBtn}>
                    <Ionicons name="remove" size={14} color={tokens.light.ink2} />
                  </Pressable>
                  <Text style={styles.expValue}>{sel!.experienceYears}y</Text>
                  <Pressable onPress={() => bumpExperience(item.id, 1)} hitSlop={8} style={styles.expBtn}>
                    <Ionicons name="add" size={14} color={tokens.light.ink2} />
                  </Pressable>
                </>
              ) : null}
            </View>
          );
        }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          {selectedIds.length} selected · {MAX_SUBJECTS} max
        </Text>
      </View>
      <StickyActionBar>
        <Button title="Next" onPress={onNext} loading={save.isPending} disabled={!canSave} />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.light.line,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink },
  list: { paddingHorizontal: 20, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: tokens.light.line },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink },
  expBtn: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center' },
  expValue: { fontSize: 12, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2, minWidth: 24, textAlign: 'center' },
  footerRow: { paddingHorizontal: 20, paddingTop: 4 },
  footerText: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginHorizontal: 20 },
});
