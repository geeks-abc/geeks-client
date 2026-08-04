import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { BottomSheet } from '@/components/bottom-sheet';
import { C, R } from '@/lib/theme';

// ── 5분 단위 슬롯 알고리즘 ──────────────────────────────
// 화면 진입 시점 기준, 현재 시각 "다음" 5분 경계부터 시작.
// 예) 14:12 → 14:15, 14:15 정각 → 14:20 (항상 다음 타임)
export const SLOT_MINUTES = 5;

export function nextSlotAfter(from: Date): Date {
  const d = new Date(from);
  d.setSeconds(0, 0);
  d.setMinutes(Math.floor(d.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES + SLOT_MINUTES);
  return d;
}

export function buildSlots(start: Date, count: number): Date[] {
  return Array.from(
    { length: count },
    (_, i) => new Date(start.getTime() + i * SLOT_MINUTES * 60000),
  );
}

export const slotLabel = (d: Date) => {
  const hhmm = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const today = new Date();
  const isTomorrow =
    d.getDate() !== today.getDate() || d.getMonth() !== today.getMonth();
  return isTomorrow ? `내일 ${hhmm}` : hhmm;
};

// ── 슬롯 선택 모달 (바텀시트 스타일) ─────────────────────
export function TimeSlotModal({
  visible,
  title,
  slots,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  slots: Date[];
  selected: Date | null;
  onSelect: (slot: Date) => void;
  onClose: () => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={s.sheet}>
      <Text style={s.title}>{title}</Text>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={s.grid}>
        {slots.map((slot) => {
          const isSelected = selected?.getTime() === slot.getTime();
          return (
            <Pressable
              key={slot.getTime()}
              onPress={() => {
                onSelect(slot);
                onClose();
              }}
              style={[s.chip, isSelected && s.chipSelected]}
            >
              <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                {slotLabel(slot)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  chip: {
    width: '30.5%',
    paddingVertical: 13,
    borderRadius: R.chip,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontSize: 14, fontFamily: 'Pretendard-Bold', color: C.text },
  chipTextSelected: { color: C.brand },
});
