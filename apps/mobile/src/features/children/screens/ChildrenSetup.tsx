import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { Button, ErrorState, StickyActionBar, TopBar } from '../../../components/ui';
import { ApiError } from '../../../lib/api';
import { tokens } from '../../../theme/tokens';
import { useBootstrapQuery, useMastersQuery } from '../../platform/hooks';
import type { Child } from '../api';
import { ChildCard } from '../components/ChildCard';
import { PreviewSheet } from '../components/PreviewSheet';
import { useChildSwitcher, useChildrenQuery, useSaveChildrenMutation, type SaveChildrenResult } from '../hooks';
import { draftFromChild, emptyChild, validateChild, type ChildDraft, type ChildErrors } from '../rules';

type Props = NativeStackScreenProps<RootStackParamList, 'ChildrenSetup'>;

// Mirrors the prototype's 'kids' screen. `setup` is the mandatory first run after
// registration (no way to skip until one child exists); `manage` is the same form
// reached later from Account and Home.
export function ChildrenSetup({ navigation, route }: Props) {
  const mode = route.params?.mode ?? 'setup';
  const children = useChildrenQuery();
  const masters = useMastersQuery();
  const bootstrap = useBootstrapQuery();
  const save = useSaveChildrenMutation();
  const select = useChildSwitcher((s) => s.select);

  const [drafts, setDrafts] = useState<ChildDraft[] | null>(null);
  const [errors, setErrors] = useState<Record<string, ChildErrors>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [result, setResult] = useState<SaveChildrenResult | null>(null);

  const max = bootstrap.data?.limits.parentMaxChildren ?? 3;

  // What the server holds right now. Never trust cached data here: a stale (or empty)
  // cache would show a blank form and then delete children that already exist on save.
  const [existing, setExisting] = useState<Child[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const refetchChildren = children.refetch;

  const load = useCallback(async () => {
    setLoadFailed(false);
    setDrafts(null);
    const res = await refetchChildren();
    if (res.data) {
      setExisting(res.data);
      setDrafts(res.data.length > 0 ? res.data.map(draftFromChild) : [emptyChild()]);
    } else {
      setLoadFailed(true);
    }
  }, [refetchChildren]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loadFailed && drafts === null) {
    return (
      <View style={styles.container}>
        <TopBar title={mode === 'manage' ? 'My children' : 'Your children'} onBack={mode === 'manage' ? () => navigation.goBack() : undefined} />
        <ErrorState title="Couldn't load your children" body="Check your connection and try again." onRetry={() => void load()} />
      </View>
    );
  }

  if (drafts === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={tokens.light.pri} />
      </View>
    );
  }

  function update(key: string, patch: Partial<ChildDraft> | ((current: ChildDraft) => Partial<ChildDraft>)) {
    setDrafts((prev) => (prev ?? []).map((d) => (d.key === key ? { ...d, ...(typeof patch === 'function' ? patch(d) : patch) } : d)));
  }

  async function onSave() {
    setFormError(undefined);
    const nextErrors: Record<string, ChildErrors> = {};
    for (const d of drafts!) {
      const e = validateChild(d);
      if (Object.keys(e).length > 0) nextErrors[d.key] = e;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Check the highlighted fields.');
      return;
    }
    try {
      const saved = await save.mutateAsync({ drafts: drafts!, existing });
      const current = useChildSwitcher.getState().selectedChildId;
      if (!current || !saved.children.some((c) => c.id === current)) select(saved.children[0]?.id ?? null);
      if (mode === 'setup' || saved.dropped.length > 0) setResult(saved);
      else navigation.goBack();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'LIMIT_REACHED') setFormError(`You can add up to ${max} children.`);
      else if (err instanceof ApiError && err.code === 'VERSION_CONFLICT') {
        setFormError('Updated on another device. Review and save again.');
        void load();
      } else setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    }
  }

  function onDone() {
    setResult(null);
    if (mode === 'setup') navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    else navigation.goBack();
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TopBar title={mode === 'manage' ? 'My children' : 'Your children'} onBack={mode === 'manage' ? () => navigation.goBack() : undefined} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {mode === 'setup' ? <Text style={styles.eyebrow}>Personalise</Text> : null}
        <Text style={styles.heading}>Tell us about your children</Text>
        <Text style={styles.sub}>We'll recommend the right teachers for each child separately.</Text>

        <View style={styles.cards}>
          {drafts.map((d, i) => (
            <ChildCard
              key={d.key}
              index={i}
              draft={d}
              masters={masters.data}
              errors={errors[d.key]}
              canRemove={drafts.length > 1}
              onChange={(patch) => update(d.key, patch)}
              onRemove={() => setDrafts((prev) => (prev ?? []).filter((x) => x.key !== d.key))}
            />
          ))}
        </View>

        {drafts.length < max ? (
          <View style={styles.addRow}>
            <Button title="+ Add another child" variant="soft" onPress={() => setDrafts((prev) => [...(prev ?? []), emptyChild()])} />
          </View>
        ) : (
          <Text style={styles.limit}>You've reached the maximum of {max} children.</Text>
        )}
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      </ScrollView>
      <StickyActionBar>
        <Button title={mode === 'manage' ? 'Save' : 'See recommendations'} onPress={onSave} loading={save.isPending} />
      </StickyActionBar>
      <PreviewSheet visible={result !== null} result={result} onDone={onDone} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingTop: 8, gap: 4 },
  eyebrow: { fontSize: 12, fontFamily: tokens.font.bodyBold, color: tokens.light.priInk, textTransform: 'uppercase', letterSpacing: 0.6 },
  heading: { fontSize: 22, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginTop: 4 },
  sub: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, marginTop: 6, marginBottom: 18 },
  label: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2, marginBottom: 8 },
  cards: { gap: 14 },
  addRow: { marginTop: 14 },
  formError: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 10 },
  limit: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: 10, textAlign: 'center' },
});
