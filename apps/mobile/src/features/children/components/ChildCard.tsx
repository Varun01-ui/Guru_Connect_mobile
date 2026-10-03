import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Chip, OptionCard, Select, TextField } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { MastersResponse } from '../../platform/api';
import { keepOfferedSubjects, subjectsForClass, toggleId, type ChildDraft, type ChildErrors } from '../rules';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// The masters carry no icon, so pick one from the category name.
export function categoryIcon(name: string): IconName {
  const n = name.toLowerCase();
  if (n.includes('home')) return 'home-outline';
  if (n.includes('online')) return 'videocam-outline';
  if (n.includes('coaching') || n.includes('institute')) return 'business-outline';
  if (n.includes('exam') || n.includes('competitive')) return 'ribbon-outline';
  if (n.includes('school')) return 'school-outline';
  if (n.includes('music') || n.includes('art')) return 'musical-notes-outline';
  if (n.includes('language')) return 'language-outline';
  return 'person-outline';
}

interface Props {
  index: number;
  draft: ChildDraft;
  masters: MastersResponse | undefined;
  errors?: ChildErrors;
  canRemove: boolean;
  // Changes are merged into the latest draft, so a fast second edit never overwrites the first.
  onChange: (patch: Partial<ChildDraft> | ((current: ChildDraft) => Partial<ChildDraft>)) => void;
  onRemove: () => void;
}

export function ChildCard({ index, draft, masters, errors, canRemove, onChange, onRemove }: Props) {
  const subjects = subjectsForClass(masters, draft.classId);
  const classOptions = (masters?.classes ?? []).map((c) => ({ label: c.name, value: c.id }));

  function changeClass(classId: string) {
    // Changing class silently drops subjects that class doesn't offer (BR-7.3).
    onChange((d) => ({ classId, subjectIds: keepOfferedSubjects(masters, classId, d.subjectIds) }));
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Avatar name={draft.name || `Child ${index + 1}`} size={36} />
        <Text style={styles.headerTitle}>
          Child {index + 1}
          {draft.name ? ` · ${draft.name}` : ''}
        </Text>
        {canRemove ? (
          <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove child ${index + 1}`} hitSlop={8}>
            <Ionicons name="trash-outline" size={19} color={tokens.light.ink3} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.row2}>
        <View style={{ flex: 1 }}>
          <TextField label="Name" placeholder="First name" value={draft.name} maxLength={40} onChangeText={(name) => onChange({ name })} error={errors?.name} />
        </View>
        <View style={{ width: 12 }} />
        <Select label="Class" placeholder="Choose" options={classOptions} value={draft.classId || undefined} onChange={changeClass} />
      </View>
      {errors?.classId ? <Text style={styles.error}>{errors.classId}</Text> : null}

      {masters?.boards?.length ? (
        <View style={styles.field}>
          <Text style={styles.label}>Board</Text>
          <View style={styles.wrap}>
            {masters.boards.map((b) => (
              <Chip
                key={b.id}
                label={b.shortName ?? b.name}
                selected={draft.boardId === b.id}
                onPress={() => onChange((d) => ({ boardId: d.boardId === b.id ? '' : b.id }))}
              />
            ))}
          </View>
        </View>
      ) : null}

      {masters?.teacherCategories?.length ? (
        <View style={styles.field}>
          <Text style={styles.label}>
            Type of teacher needed <Text style={styles.muted}>· pick any</Text>
          </Text>
          <View style={styles.wrap}>
            {masters.teacherCategories.map((c) => (
              <OptionCard
                key={c.id}
                label={c.name}
                icon={categoryIcon(c.name)}
                selected={draft.categoryIds.includes(c.id)}
                onPress={() => onChange((d) => ({ categoryIds: toggleId(d.categoryIds, c.id) }))}
              />
            ))}
          </View>
          {errors?.categoryIds ? <Text style={styles.error}>{errors.categoryIds}</Text> : null}
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>
          Subjects <Text style={styles.muted}>· optional</Text>
        </Text>
        {!draft.classId ? (
          <Text style={styles.helper}>Choose a class first</Text>
        ) : subjects.length === 0 ? (
          <Text style={styles.helper}>No subjects listed for this class yet</Text>
        ) : (
          <View style={styles.wrap}>
            {subjects.map((s) => (
              <Chip key={s.id} label={s.name} selected={draft.subjectIds.includes(s.id)} onPress={() => onChange((d) => ({ subjectIds: toggleId(d.subjectIds, s.id) }))} />
            ))}
          </View>
        )}
        {errors?.subjectIds ? <Text style={styles.error}>{errors.subjectIds}</Text> : null}
      </View>

      {masters?.teachingModes?.length ? (
        <View style={styles.field}>
          <Text style={styles.label}>Preferred mode</Text>
          <View style={styles.wrap}>
            {masters.teachingModes.map((m) => (
              <Chip key={m.id} label={m.name} selected={draft.modeId === m.id} onPress={() => onChange({ modeId: m.id })} />
            ))}
            <Chip label="Any" selected={!draft.modeId} onPress={() => onChange({ modeId: '' })} />
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  headerTitle: { flex: 1, fontSize: 15, fontFamily: tokens.font.bodyBold, color: tokens.light.ink },
  row2: { flexDirection: 'row' },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontFamily: tokens.font.bodySemi, color: tokens.light.ink2, marginBottom: 8 },
  muted: { color: tokens.light.ink3, fontFamily: tokens.font.bodySemi },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  helper: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  error: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.bad, marginTop: 4 },
});
