import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface State {
  hasError: boolean;
  errorId: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, errorId: '' };

  static getDerivedStateFromError() {
    return { hasError: true, errorId: Math.random().toString(36).slice(2, 10) };
  }

  componentDidCatch(error: unknown) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>Restart the app to continue. If this keeps happening, contact support.</Text>
        <Text style={styles.errorId}>Error ID {this.state.errorId}</Text>
        <Pressable style={styles.button} onPress={() => this.setState({ hasError: false })}>
          <Text style={styles.buttonText}>Restart</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: tokens.light.bg },
  title: { fontSize: 20, fontFamily: tokens.font.displaySemi, color: tokens.light.ink, marginBottom: 8 },
  body: { fontSize: 14, fontFamily: tokens.font.body, color: tokens.light.ink2, textAlign: 'center', marginBottom: 16 },
  errorId: { fontSize: 12, fontFamily: tokens.font.body, color: tokens.light.ink3, marginBottom: 24 },
  button: { backgroundColor: tokens.light.pri, paddingHorizontal: 24, paddingVertical: 12, borderRadius: tokens.radii.md },
  buttonText: { color: tokens.light.onPrimary, fontFamily: tokens.font.bodyBold },
});
