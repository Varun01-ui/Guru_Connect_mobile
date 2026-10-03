import React, { useEffect, useState } from 'react';
import { Image, View, Text } from 'react-native';
import { mediaUrl } from '../../lib/media';
import { tokens } from '../../theme/tokens';

const PALETTE = ['#6d28d9', '#0e7490', '#b45309', '#be185d', '#15803d', '#1d4ed8'];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function colorFor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
  radius?: number;
  // Photo to show instead of initials. If it fails to load, initials are shown.
  uri?: string | null;
}

export function Avatar({ name, size = 40, color, radius, uri }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const r = radius ?? size / 2;
  const shown = /^(file|content|data):/i.test(uri ?? '') ? uri : mediaUrl(uri);

  if (shown && !failed) {
    return <Image source={{ uri: shown }} onError={() => setFailed(true)} style={{ width: size, height: size, borderRadius: r, backgroundColor: tokens.light.surface3 }} />;
  }

  return (
    <View style={{ width: size, height: size, borderRadius: r, backgroundColor: color ?? colorFor(name), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontFamily: tokens.font.bodyBold, fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}
