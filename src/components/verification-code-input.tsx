import React, { useEffect, useRef } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  ViewStyle,
} from 'react-native';
import Animated, {
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { C, R } from '@/lib/theme';

const COMPLETE_DELAY = 300;

export function VerificationCodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error = false,
  autoFocus = false,
  disabled = false,
  accessibilityLabel = '인증번호 입력',
  style,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const inputRef = useRef<TextInput>(null);
  const completedValue = useRef<string | null>(null);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 280);
    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  useEffect(() => {
    if (value.length < length) {
      completedValue.current = null;
      return;
    }
    if (!onComplete || completedValue.current === value) return;

    completedValue.current = value;
    const timer = setTimeout(() => onComplete(value), COMPLETE_DELAY);
    return () => clearTimeout(timer);
  }, [length, onComplete, value]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => inputRef.current?.focus()}
      style={[s.container, style]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        editable={!disabled}
        onChangeText={(nextValue) => onChange(nextValue.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        caretHidden
        style={s.hiddenInput}
      />

      {Array.from({ length }, (_, index) => {
        const digit = value[index];
        return (
          <CodeCell
            key={index}
            index={index}
            digit={digit}
            active={!disabled && index === value.length && value.length < length}
            complete={value.length === length}
            error={error}
          />
        );
      })}
    </Pressable>
  );
}

function CodeCell({
  index,
  digit,
  active,
  complete,
  error,
}: {
  index: number;
  digit?: string;
  active: boolean;
  complete: boolean;
  error: boolean;
}) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (complete) {
      scale.value = withDelay(
        index * 28,
        withSequence(
          withTiming(1.07, { duration: 100 }),
          withTiming(1, { duration: 130 }),
        ),
      );
      return;
    }
    scale.value = withTiming(active ? 1.035 : 1, { duration: 140 });
  }, [active, complete, index, scale]);

  useEffect(() => {
    if (!error) return;
    translateX.value = withDelay(
      index * 12,
      withSequence(
        withTiming(-3, { duration: 45 }),
        withTiming(3, { duration: 70 }),
        withTiming(-2, { duration: 60 }),
        withTiming(0, { duration: 45 }),
      ),
    );
  }, [error, index, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        s.cell,
        digit && s.cellFilled,
        active && s.cellActive,
        complete && !error && s.cellComplete,
        error && s.cellError,
        animatedStyle,
      ]}
    >
      {digit ? (
        <Animated.Text key={digit} entering={ZoomIn.duration(150)} style={s.digit}>
          {digit}
        </Animated.Text>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  cell: {
    flex: 1,
    maxWidth: 62,
    height: 68,
    borderRadius: R.chip,
    borderWidth: 1.5,
    borderColor: C.line,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { borderColor: C.brand, backgroundColor: '#FFFFFF' },
  cellFilled: { borderColor: C.brandSoft, backgroundColor: C.brandSoft },
  cellComplete: { borderColor: C.brand },
  cellError: { borderColor: C.red, backgroundColor: C.redSoft },
  digit: { color: C.text, fontSize: 26, fontFamily: 'Pretendard-ExtraBold' },
});
