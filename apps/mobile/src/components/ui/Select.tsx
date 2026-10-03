import React, { useState } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface Option {
  label: string;
  value: string;
}
interface SelectProps {
  label: string;
  options: Option[];
  value: string | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Select({ label, options, value, onChange, disabled, placeholder = 'Select' }: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.field, disabled && styles.disabled]} onPress={() => !disabled && setOpen(true)}>
        <Text style={selected ? styles.value : styles.placeholder}>{selected?.label ?? placeholder}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16, flex: 1 },
  label: { fontSize: 13, color: tokens.light.ink2, marginBottom: 6, fontFamily: tokens.font.bodySemi },
  field: {
    height: 48,
    borderRadius: tokens.radii.sm,
    borderWidth: 1,
    borderColor: tokens.light.line,
    justifyContent: 'center',
    paddingHorizontal: 14,
    backgroundColor: tokens.light.surface,
  },
  disabled: { opacity: 0.5 },
  value: { fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink },
  placeholder: { fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '60%',
    backgroundColor: tokens.light.surface,
    borderTopLeftRadius: tokens.radii.lg,
    borderTopRightRadius: tokens.radii.lg,
    paddingVertical: 8,
  },
  sheetTitle: { fontSize: 15, fontFamily: tokens.font.bodyBold, color: tokens.light.ink, paddingHorizontal: 20, paddingVertical: 10 },
  option: { paddingHorizontal: 20, paddingVertical: 14 },
  optionText: { fontSize: 15, fontFamily: tokens.font.body, color: tokens.light.ink },
});
