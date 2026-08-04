import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

// 로딩 중 빈 화면 대신 보여주는 펄스 스켈레톤 (의존성 없이 reanimated로 구현)
export function Skeleton({
  width,
  height,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 700 }), -1, true);
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width ?? '100%', height, borderRadius: radius, backgroundColor: '#E4E7E4' },
        animated,
        style,
      ]}
    />
  );
}

// 리스트 행 스켈레톤 (썸네일 + 텍스트 2줄)
export function ListRowSkeleton() {
  return (
    <View style={s.row}>
      <Skeleton width={52} height={52} radius={14} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={11} />
      </View>
    </View>
  );
}

// 피드 카드 스켈레톤
export function FeedCardSkeleton() {
  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Skeleton width={56} height={56} radius={14} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="40%" height={11} />
          <Skeleton width="65%" height={15} />
          <Skeleton width="50%" height={11} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
  },
});
