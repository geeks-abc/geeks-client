import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { C, R, STATUS_META } from '@/lib/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary' ? C.yellow : variant === 'dark' ? C.navy : variant === 'danger' ? C.redSoft : C.graySoft;
  const fg = variant === 'dark' ? '#FFF' : variant === 'danger' ? C.red : C.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.button,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[s.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Badge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, fg: C.sub, bg: C.graySoft };
  return (
    <View style={[s.badge, { backgroundColor: meta.bg }]}>
      <Text style={[s.badgeText, { color: meta.fg }]}>{meta.label}</Text>
    </View>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.fieldLabel}>{props.label}</Text>
      <TextInput
        placeholderTextColor={C.gray}
        {...props}
        style={[s.input, props.style]}
      />
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export function EmptyState({ title, sub }: { title: string; sub?: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 48, gap: 12 }}>
      <View style={s.emptyDotOuter}>
        <View style={s.emptyDotInner} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      {sub ? <Text style={s.emptySub}>{sub}</Text> : null}
    </Card>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

export function Headline({ children }: { children: string }) {
  return <Text style={s.headline}>{children}</Text>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: R.card,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  button: {
    borderRadius: R.button,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontFamily: 'Pretendard-Bold' },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontFamily: 'Pretendard-ExtraBold', letterSpacing: 0.3 },
  fieldLabel: { fontSize: 13, color: C.sub, fontFamily: 'Pretendard-SemiBold' },
  input: {
    backgroundColor: C.card,
    borderRadius: R.chip,
    borderWidth: 1,
    borderColor: C.line,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16, fontFamily: 'Pretendard-Regular',
    color: C.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLabel: { color: C.sub, fontSize: 14, fontFamily: 'Pretendard-Regular' },
  rowValue: { color: C.text, fontSize: 14, fontFamily: 'Pretendard-SemiBold', flexShrink: 1, textAlign: 'right' },
  emptyDotOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDotInner: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy },
  emptyTitle: { fontSize: 17, fontFamily: 'Pretendard-Bold', color: C.text, textAlign: 'center' },
  emptySub: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  headline: { fontSize: 26, fontFamily: 'Pretendard-ExtraBold', color: C.text, lineHeight: 36 },
});
