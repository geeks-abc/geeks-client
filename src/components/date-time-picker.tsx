import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SLOT_MINUTES, nextSlotAfter } from '@/components/time-picker';
import { C } from '@/lib/theme';

// 픽업 일시 선택기 — 날짜(오늘부터 최대 7일) + 5분 단위 시간
export const MAX_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d: Date) => {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  return day;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const dayLabel = (d: Date) => {
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(d).getTime() - today.getTime()) / DAY_MS);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  return `${d.getMonth() + 1}/${d.getDate()} (${WEEKDAYS[d.getDay()]})`;
};

const hhmm = (d: Date) =>
  d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

// 표시 라벨: "오늘 19:30", "내일 09:00", "8/9 (토) 10:00"
export const dateTimeLabel = (d: Date) => `${dayLabel(d)} ${hhmm(d)}`;

export function DateTimePickerModal({
  visible,
  title,
  selected,
  minDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  selected: Date | null;
  minDate?: Date; // 이 시각 이후만 선택 가능 (기본: 현재)
  onSelect: (value: Date) => void;
  onClose: () => void;
}) {
  const lowerBound = useMemo(
    () => (minDate && minDate.getTime() > Date.now() ? minDate : new Date()),
    // 모달 열릴 때마다 재계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minDate, visible],
  );

  // 날짜 후보: 오늘부터 7일, 하한 이전 날짜는 제외
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    const minDay = startOfDay(lowerBound).getTime();
    return Array.from({ length: MAX_DAYS }, (_, i) => new Date(today.getTime() + i * DAY_MS))
      .filter((d) => d.getTime() >= minDay);
  }, [lowerBound]);

  const [day, setDay] = useState<Date>(days[0]);

  useEffect(() => {
    if (!visible) return;
    const base = selected ?? lowerBound;
    const match = days.find((d) => d.getTime() === startOfDay(base).getTime());
    setDay(match ?? days[0]);
  }, [visible, selected, days, lowerBound]);

  // 선택한 날짜의 5분 슬롯 (하한이 걸리는 날은 하한 다음 슬롯부터)
  const slots = useMemo(() => {
    const isBoundDay = startOfDay(day).getTime() === startOfDay(lowerBound).getTime();
    const first = isBoundDay ? nextSlotAfter(lowerBound) : startOfDay(day);
    const end = startOfDay(day).getTime() + DAY_MS;
    const list: Date[] = [];
    for (let t = first.getTime(); t < end; t += SLOT_MINUTES * 60000) {
      list.push(new Date(t));
    }
    return list;
  }, [day, lowerBound]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handle} />
          <Text style={s.title}>{title}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.dayRow}
          >
            {days.map((d) => {
              const active = d.getTime() === startOfDay(day).getTime();
              return (
                <Pressable
                  key={d.getTime()}
                  onPress={() => setDay(d)}
                  style={[s.dayChip, active && s.dayChipActive]}
                >
                  <Text style={[s.dayChipText, active && s.dayChipTextActive]}>
                    {dayLabel(d)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={s.grid}>
            {slots.map((slot) => {
              const active = selected?.getTime() === slot.getTime();
              return (
                <Pressable
                  key={slot.getTime()}
                  onPress={() => {
                    onSelect(slot);
                    onClose();
                  }}
                  style={[s.chip, active && s.chipActive]}
                >
                  <Text style={[s.chipText, active && s.chipTextActive]}>{hhmm(slot)}</Text>
                </Pressable>
              );
            })}
            {slots.length === 0 ? (
              <Text style={s.emptyText}>선택 가능한 시간이 없어요. 다른 날짜를 선택해주세요.</Text>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
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
  title: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  dayRow: { gap: 8, paddingBottom: 4 },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
  },
  dayChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  dayChipText: { fontSize: 13.5, fontFamily: 'Pretendard-Bold', color: C.text },
  dayChipTextActive: { color: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  chip: {
    width: '22.7%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: C.brand, borderColor: C.brand },
  chipText: { fontSize: 13.5, fontFamily: 'Pretendard-Bold', color: C.text },
  chipTextActive: { color: '#FFFFFF' },
  emptyText: { fontSize: 13, fontFamily: 'Pretendard-Regular', color: C.sub, padding: 8 },
});
