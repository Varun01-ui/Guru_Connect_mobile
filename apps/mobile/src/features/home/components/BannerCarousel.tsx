import React, { useEffect, useRef, useState } from 'react';
import { View, Image, FlatList, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { mediaUrl } from '../../../lib/media';
import { tokens } from '../../../theme/tokens';
import type { Banner } from '../api';

interface Props {
  banners: Banner[];
  onPress: (banner: Banner) => void;
}

// Promo banners at 16:7 that advance every 5 seconds (paused while the user is touching them).
export function BannerCarousel({ banners, onPress }: Props) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 40;
  const [index, setIndex] = useState(0);
  const touching = useRef(false);
  const listRef = useRef<FlatList<Banner>>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      if (touching.current) return;
      setIndex((i) => {
        const next = (i + 1) % banners.length;
        listRef.current?.scrollToOffset({ offset: next * (cardWidth + 12), animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, cardWidth]);

  if (banners.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        horizontal
        data={banners}
        keyExtractor={(b) => b.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
        onScrollBeginDrag={() => (touching.current = true)}
        onScrollEndDrag={() => (touching.current = false)}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)))}
        renderItem={({ item }) => (
          <Pressable onPress={() => onPress(item)} accessibilityRole="button" accessibilityLabel={item.title} style={{ width: cardWidth, height: (cardWidth * 7) / 16 }}>
            <Image source={{ uri: mediaUrl(item.imageUrl) ?? undefined }} style={styles.image} resizeMode="cover" />
            <View style={styles.caption}>
              <Text style={styles.captionText} numberOfLines={1}>
                {item.title}
              </Text>
            </View>
          </Pressable>
        )}
      />
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotOn]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { flex: 1, borderRadius: tokens.radii.lg, backgroundColor: tokens.light.surface3 },
  caption: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(21,19,46,0.55)', borderBottomLeftRadius: tokens.radii.lg, borderBottomRightRadius: tokens.radii.lg },
  captionText: { color: '#fff', fontSize: 13, fontFamily: tokens.font.bodyBold },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.light.line },
  dotOn: { width: 16, backgroundColor: tokens.light.pri },
});
