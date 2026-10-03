import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Button, SectionHeader, Skeleton } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';

interface Props<T> {
  title: string;
  subtitle?: string;
  items: T[] | undefined;
  loading?: boolean;
  keyOf: (item: T) => string;
  renderItem: (item: T) => React.ReactElement;
  onSeeAll?: () => void;
  empty: { message: string; actionLabel?: string; onAction?: () => void };
}

// One horizontal rail: header with "See all", cards, a skeleton while loading,
// and an empty state that stays visible (rails are never silently hidden).
export function RailSection<T>({ title, subtitle, items, loading, keyOf, renderItem, onSeeAll, empty }: Props<T>) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} actionLabel={items && items.length > 0 ? 'See all' : undefined} onAction={onSeeAll} />
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {loading && !items ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width={176} height={190} />
          ))}
        </View>
      ) : items && items.length > 0 ? (
        <FlatList
          horizontal
          data={items}
          keyExtractor={keyOf}
          renderItem={({ item }) => renderItem(item)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          style={styles.flat}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{empty.message}</Text>
          {empty.actionLabel && empty.onAction ? <Button title={empty.actionLabel} variant="soft" onPress={empty.onAction} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  subtitle: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginTop: -4 },
  skeletons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  flat: { marginHorizontal: -20 },
  list: { paddingHorizontal: 20, gap: 12, paddingTop: 4 },
  empty: {
    gap: 12,
    padding: 16,
    borderRadius: tokens.radii.lg,
    borderWidth: 1,
    borderColor: tokens.light.line,
    backgroundColor: tokens.light.surface,
  },
  emptyText: { fontSize: 13, fontFamily: tokens.font.body, color: tokens.light.ink2 },
});
