import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { TextField, Select, Button, StickyActionBar, Card } from '../../../components/ui';
import { RegistrationProgressHeader } from '../components/RegistrationProgressHeader';
import { tokens } from '../../../theme/tokens';
import { useMastersQuery, useAreasQuery } from '../../platform/hooks';
import { useTeacherRegistrationQuery, useReplaceLocationsMutation } from '../hooks';
import { ApiError } from '../../../lib/api';

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherRegLocations'>;

interface LocationDraft {
  key: string;
  cityId?: string;
  areaId?: string;
  isPrimary: boolean;
  travelRadiusKm: number;
  addressLine: string;
}

function emptyLocation(isPrimary: boolean): LocationDraft {
  return { key: `${Date.now()}-${Math.random()}`, isPrimary, travelRadiusKm: 10, addressLine: '' };
}

export function TeacherRegLocations({ navigation }: Props) {
  const masters = useMastersQuery();
  const reg = useTeacherRegistrationQuery();
  const save = useReplaceLocationsMutation();
  const [locations, setLocations] = useState<LocationDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!reg.data || hydrated) return;
    setLocations(
      reg.data.locations.map((l) => ({ key: l.id, cityId: l.cityId, areaId: l.areaId ?? undefined, isPrimary: l.isPrimary, travelRadiusKm: l.travelRadiusKm ?? 10, addressLine: l.addressLine ?? '' })),
    );
    setHydrated(true);
  }, [reg.data, hydrated]);

  const modeNames = (reg.data?.teachingModes ?? []).map((m) => m.name.toLowerCase());
  const onlineOnly = modeNames.length > 0 && modeNames.every((n) => n.includes('online'));

  function update(key: string, patch: Partial<LocationDraft>) {
    setLocations((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function remove(key: string) {
    setLocations((prev) => prev.filter((l) => l.key !== key));
  }
  function setPrimary(key: string) {
    setLocations((prev) => prev.map((l) => ({ ...l, isPrimary: l.key === key })));
  }
  function addLocation() {
    setLocations((prev) => [...prev, emptyLocation(prev.length === 0)]);
  }

  const canSave = onlineOnly || (locations.length > 0 && locations.every((l) => l.cityId) && locations.some((l) => l.isPrimary));

  async function onFinish() {
    setError(undefined);
    try {
      const items = onlineOnly
        ? []
        : locations.map((l) => ({ cityId: l.cityId!, areaId: l.areaId || undefined, isPrimary: l.isPrimary, travelRadiusKm: l.travelRadiusKm, addressLine: l.addressLine || undefined }));
      await save.mutateAsync(items);
      navigation.navigate('TeacherDocuments');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  if (onlineOnly) {
    return (
      <View style={styles.container}>
        <RegistrationProgressHeader step={7} title="Locations" onBack={() => navigation.goBack()} />
        <View style={styles.scroll}>
          <Card>
            <Text style={styles.skipText}>You teach only online — no location needed. Continue.</Text>
          </Card>
        </View>
        <StickyActionBar>
          <Button title="Finish profile — continue to documents" onPress={onFinish} loading={save.isPending} />
        </StickyActionBar>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <RegistrationProgressHeader step={7} title="Locations" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {locations.map((loc) => (
          <LocationEditor
            key={loc.key}
            loc={loc}
            cities={masters.data?.cities ?? []}
            onChange={(patch) => update(loc.key, patch)}
            onRemove={() => remove(loc.key)}
            onSetPrimary={() => setPrimary(loc.key)}
          />
        ))}
        {locations.length < 5 ? <Button title="+ Add another area" variant="outline" onPress={addLocation} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title="Finish profile — continue to documents" onPress={onFinish} loading={save.isPending} disabled={!canSave} />
      </StickyActionBar>
    </View>
  );
}

function LocationEditor({
  loc,
  cities,
  onChange,
  onRemove,
  onSetPrimary,
}: {
  loc: LocationDraft;
  cities: { id: string; stateId: string; name: string }[];
  onChange: (patch: Partial<LocationDraft>) => void;
  onRemove: () => void;
  onSetPrimary: () => void;
}) {
  const areas = useAreasQuery(loc.cityId);
  const cityOptions = cities.map((c) => ({ label: c.name, value: c.id }));
  const areaOptions = (areas.data?.areas ?? []).map((a) => ({ label: a.name, value: a.id }));

  return (
    <Card style={styles.locationCard}>
      <View style={styles.locationHeader}>
        <Pressable style={styles.primaryToggle} onPress={onSetPrimary}>
          <Ionicons name={loc.isPrimary ? 'radio-button-on' : 'radio-button-off'} size={18} color={tokens.light.pri} />
          <Text style={styles.primaryLabel}>Primary</Text>
        </Pressable>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={tokens.light.bad} />
        </Pressable>
      </View>
      <Select label="City" placeholder="Bengaluru" options={cityOptions} value={loc.cityId} onChange={(v) => onChange({ cityId: v, areaId: undefined })} />
      {areaOptions.length > 0 ? <Select label="Area (optional)" placeholder="Koramangala" options={areaOptions} value={loc.areaId} onChange={(v) => onChange({ areaId: v })} /> : null}
      <Text style={styles.radiusLabel}>Travel radius: {loc.travelRadiusKm} km</Text>
      <View style={styles.radiusRow}>
        <Pressable style={styles.radiusBtn} onPress={() => onChange({ travelRadiusKm: Math.max(2, loc.travelRadiusKm - 1) })}>
          <Ionicons name="remove" size={16} color={tokens.light.ink} />
        </Pressable>
        <Pressable style={styles.radiusBtn} onPress={() => onChange({ travelRadiusKm: Math.min(25, loc.travelRadiusKm + 1) })}>
          <Ionicons name="add" size={16} color={tokens.light.ink} />
        </Pressable>
      </View>
      <TextField label="Address line (optional)" placeholder="Koramangala 5th Block" value={loc.addressLine} onChangeText={(v) => onChange({ addressLine: v })} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.surface },
  scroll: { padding: 20, paddingTop: 4 },
  skipText: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2 },
  locationCard: { marginBottom: 14 },
  locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  primaryToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryLabel: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2 },
  radiusLabel: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2, marginBottom: 6 },
  radiusRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  radiusBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: tokens.light.line, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 8 },
});
