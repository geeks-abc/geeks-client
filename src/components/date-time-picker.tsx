import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BottomSheet } from '@/components/bottom-sheet';
import { SLOT_MINUTES, nextSlotAfter } from '@/components/time-picker';
import { C, R } from '@/lib/theme';

// 픽업 일시 선택기 — 날짜/시/분 휠(위아래 스크롤) 방식, 오늘부터 최대 7일
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

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_PAD = (ITEM_HEIGHT * (VISIBLE_ROWS - 1)) / 2;

interface WheelOption<T> {
  value: T;
  label: string;
}

// 단일 휠 컬럼 — 스냅 스크롤로 가운데 항목 선택 (탭 선택도 지원)
function Wheel<T extends string | number>({
  options,
  value,
  onChange,
  flex = 1,
}: {
  options: WheelOption<T>[];
  value: T;
  onChange: (next: T) => void;
  flex?: number;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const optionsKey = options.map((option) => String(option.value)).join(',');

  // 옵션 목록이 바뀌거나(날짜 변경 등) 외부 값이 바뀌면 위치 동기화
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey, value]);

  const settle = (offsetY: number) => {
    const index = Math.min(options.length - 1, Math.max(0, Math.round(offsetY / ITEM_HEIGHT)));
    const option = options[index];
    // 웹은 CSS 스냅을 안 쓰므로 여기서 직접 스냅 (네이티브도 오차 보정)
    if (Math.abs(offsetY - index * ITEM_HEIGHT) > 1) {
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    if (option && option.value !== value) onChange(option.value);
  };

  // 웹은 momentum 이벤트가 안 와서 onScroll 디바운스로 스크롤 종료를 감지
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => settle(y), 140);
  };

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settle(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={[s.wheel, { flex }]}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        // 웹의 CSS scroll-snap은 패딩을 무시하고 첫 항목을 상단에 붙여버려서 네이티브에서만 사용
        snapToInterval={Platform.OS === 'web' ? undefined : ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: WHEEL_PAD }}
        nestedScrollEnabled
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={s.wheelItem}
            >
              <Text style={[s.wheelText, active && s.wheelTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

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
  // 첫 선택 가능 슬롯 (하한 직후 5분 단위)
  const firstSlot = useMemo(() => nextSlotAfter(lowerBound), [lowerBound]);

  const [day, setDay] = useState<number>(startOfDay(firstSlot).getTime());
  const [hour, setHour] = useState<number>(firstSlot.getHours());
  const [minute, setMinute] = useState<number>(firstSlot.getMinutes());

  // 열릴 때 기존 선택값(또는 첫 슬롯)으로 초기화
  useEffect(() => {
    if (!visible) return;
    const base = selected && selected.getTime() >= firstSlot.getTime() ? selected : firstSlot;
    setDay(startOfDay(base).getTime());
    setHour(base.getHours());
    setMinute(Math.floor(base.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES);
  }, [visible, selected, firstSlot]);

  const dayOptions = useMemo(() => {
    const today = startOfDay(new Date());
    const minDay = startOfDay(firstSlot).getTime();
    return Array.from({ length: MAX_DAYS }, (_, i) => new Date(today.getTime() + i * DAY_MS))
      .filter((d) => d.getTime() >= minDay)
      .map((d) => ({ value: d.getTime(), label: dayLabel(d) }));
  }, [firstSlot]);

  const isBoundDay = day === startOfDay(firstSlot).getTime();

  const hourOptions = useMemo(() => {
    const from = isBoundDay ? firstSlot.getHours() : 0;
    return Array.from({ length: 24 - from }, (_, i) => {
      const h = from + i;
      return { value: h, label: `${h}시` };
    });
  }, [isBoundDay, firstSlot]);

  const minuteOptions = useMemo(() => {
    const from = isBoundDay && hour === firstSlot.getHours() ? firstSlot.getMinutes() : 0;
    const list: WheelOption<number>[] = [];
    for (let m = from; m < 60; m += SLOT_MINUTES) {
      list.push({ value: m, label: `${String(m).padStart(2, '0')}분` });
    }
    return list;
  }, [isBoundDay, hour, firstSlot]);

  // 날짜/시가 바뀌어 현재 선택이 범위 밖이면 첫 옵션으로 보정
  useEffect(() => {
    if (!hourOptions.some((option) => option.value === hour)) setHour(hourOptions[0].value);
  }, [hourOptions, hour]);
  useEffect(() => {
    if (!minuteOptions.some((option) => option.value === minute)) {
      setMinute(minuteOptions[0]?.value ?? 0);
    }
  }, [minuteOptions, minute]);

  const confirm = () => {
    const result = new Date(day);
    result.setHours(hour, minute, 0, 0);
    onSelect(result);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={s.sheet}>
      <Text style={s.title}>{title}</Text>

      <View style={s.wheelRow}>
        {/* 가운데 선택 밴드 */}
        <View pointerEvents="none" style={s.selectionBand} />
        <Wheel flex={1.4} options={dayOptions} value={day} onChange={setDay} />
        <Wheel options={hourOptions} value={hour} onChange={setHour} />
        <Wheel options={minuteOptions} value={minute} onChange={setMinute} />
      </View>

      <Pressable
        onPress={confirm}
        style={({ pressed }) => [s.confirm, pressed && { opacity: 0.8 }]}
      >
        <Text style={s.confirmText}>선택 완료</Text>
      </Pressable>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: { backgroundColor: '#FFFFFF', gap: 14 },
  title: { fontSize: 18, fontFamily: 'Pretendard-ExtraBold', color: C.text },
  wheelRow: {
    flexDirection: 'row',
    height: ITEM_HEIGHT * VISIBLE_ROWS,
  },
  selectionBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_PAD,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: C.brandSoft,
  },
  wheel: { height: ITEM_HEIGHT * VISIBLE_ROWS },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: { fontSize: 16, fontFamily: 'Pretendard-Regular', color: C.gray },
  wheelTextActive: { fontSize: 17, fontFamily: 'Pretendard-Bold', color: C.brandDeep },
  confirm: {
    height: 54,
    borderRadius: R.button,
    backgroundColor: C.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  confirmText: { color: '#FFFFFF', fontSize: 15.5, fontFamily: 'Pretendard-Bold' },
});
