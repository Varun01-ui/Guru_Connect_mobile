import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Stand-in for tabs whose modules aren't built yet (Search, Saved, Requests).
export function comingSoonScreen(title: string, icon: IconName, note: string) {
  return function ComingSoon() {
    return (
      <View style={styles.container}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={30} color={tokens.light.pri} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{note}</Text>
      </View>
    );
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: tokens.light.bg },
  icon: { width: 64, height: 64, borderRadius: 20, backgroundColor: tokens.light.priSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 19, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 6 },
  body: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center' },
});
