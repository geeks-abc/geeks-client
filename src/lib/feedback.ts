import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';

// 토스트 + 햅틱 통합 피드백 (햅틱은 네이티브에서만)
const haptic = (kind: 'success' | 'error' | 'tap') => {
  if (Platform.OS === 'web') return;
  if (kind === 'success') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else if (kind === 'error') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const notify = {
  success(message: string, description?: string) {
    haptic('success');
    toast.success(message, description ? { description } : undefined);
  },
  error(message: string, description?: string) {
    haptic('error');
    toast.error(message, description ? { description } : undefined);
  },
  tap() {
    haptic('tap');
  },
};
