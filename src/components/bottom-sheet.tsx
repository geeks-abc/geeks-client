import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { C } from '@/lib/theme';

const EXIT_DURATION = 240;

// 공용 바텀시트 — 배경은 불투명도 페이드, 시트만 아래에서 슬라이드
// (배경이 시트와 같이 밀려 올라오는 문제 방지용 표준 패턴)
export function BottomSheet({
  visible,
  onClose,
  children,
  sheetStyle,
  showHandle = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetStyle?: ViewStyle;
  showHandle?: boolean;
}) {
  const [mounted, setMounted] = useState(visible);
  const [contentVisible, setContentVisible] = useState(visible);

  useEffect(() => {
    let closeTimer: ReturnType<typeof setTimeout> | undefined;

    if (visible) {
      setMounted(true);
      setContentVisible(true);
    } else if (mounted) {
      setContentVisible(false);
      closeTimer = setTimeout(() => setMounted(false), EXIT_DURATION);
    }

    return () => {
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [mounted, visible]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.container}>
        {contentVisible ? (
          <>
            <Animated.View
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(200)}
              style={s.backdrop}
            />
            <Pressable style={s.dismissArea} onPress={onClose} />
            <Animated.View
              entering={SlideInDown.duration(280)}
              exiting={SlideOutDown.duration(EXIT_DURATION)}
            >
              <Pressable style={[s.sheet, sheetStyle]} onPress={(event) => event.stopPropagation()}>
                {showHandle ? <View style={s.handle} /> : null}
                {children}
              </Pressable>
            </Animated.View>
          </>
        ) : null}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  dismissArea: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#F9F9F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.gray,
  },
});
