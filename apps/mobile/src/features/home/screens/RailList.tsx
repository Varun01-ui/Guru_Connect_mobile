import React from 'react';
import { View, FlatList, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import { EmptyState, ErrorState, TopBar } from '../../../components/ui';
import { tokens } from '../../../theme/tokens';
import type { InstituteCardData, TeacherCardData } from '../api';
import { InstituteCard } from '../components/InstituteCard';
import { TeacherCard } from '../components/TeacherCard';
import { useRail } from '../hooks';

type Props = NativeStackScreenProps<RootStackParamList, 'RailList'>;

// "See all" for one rail: the same cards in a two-column grid, loading the next
// page as you scroll.
export function RailList({ route, navigation }: Props) {
  const { rail, title, childId } = route.params;
  const isInstitutes = rail === 'recommended_institutes';
  const query = useRail<TeacherCardData | InstituteCardData>(rail, childId);
  const items = query.data?.pages.flatMap((p) => p.items) ?? [];
  const soon = (what: string) => Alert.alert('Coming soon', `${what} isn't built yet.`);

  return (
    <View style={styles.container}>
      <TopBar title={title} onBack={() => navigation.goBack()} />
      {query.isError && items.length === 0 ? (
        <ErrorState title="Couldn't load this list" body="Check your connection and try again." onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.light.pri} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState title="Nothing here yet" body="Check back soon." />
      ) : (
        <FlatList
          data={items}
          numColumns={2}
          keyExtractor={(item) => ('teacherId' in item ? item.teacherId : item.instituteId)}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator style={{ margin: 16 }} color={tokens.light.pri} /> : null}
          renderItem={({ item }) =>
            isInstitutes ? (
              <InstituteCard institute={item as InstituteCardData} variant="grid" onPress={() => soon('Institute profiles')} />
            ) : (
              <TeacherCard teacher={item as TeacherCardData} variant="grid" onPress={() => soon('Teacher profiles')} />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: tokens.light.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  row: { gap: 12 },
});
