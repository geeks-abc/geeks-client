import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { BottomSheet } from '@/components/bottom-sheet';
import { C } from '@/lib/theme';

export interface PostcodeResult {
  zonecode: string; // 우편번호
  address: string; // 도로명 주소
}

const DAUM_SCRIPT = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

// 다음 우편번호 검색 — 웹: DOM 임베드 / 네이티브: WebView
export function PostcodeModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (result: PostcodeResult) => void;
  onClose: () => void;
}) {
  // 시트가 애니메이션 래퍼 안에 있어 % 높이가 무시되므로 픽셀 높이로 고정
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * 0.78);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      sheetStyle={{ ...s.sheet, height: sheetHeight }}
      showHandle={false}
    >
      <View style={s.header}>
        <Text style={s.title}>주소 검색</Text>
        <Pressable onPress={onClose} hitSlop={10}>
          <Ionicons name="close" size={22} color={C.text} />
        </Pressable>
      </View>
      {Platform.OS === 'web' ? (
        <WebPostcode onSelect={onSelect} />
      ) : (
        <NativePostcode onSelect={onSelect} />
      )}
    </BottomSheet>
  );
}

// ── 웹: 다음 우편번호 embed를 DOM에 직접 마운트 ──────────
function WebPostcode({ onSelect }: { onSelect: (r: PostcodeResult) => void }) {
  const containerId = useRef(`daum-postcode-${Math.floor(Math.random() * 1e9)}`).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const w = window as any;

    const mount = () => {
      const el = document.getElementById(containerId);
      if (!el || !w.daum?.Postcode) return;
      el.innerHTML = '';
      new w.daum.Postcode({
        oncomplete: (data: any) => {
          onSelect({ zonecode: String(data.zonecode), address: String(data.roadAddress || data.address) });
        },
        width: '100%',
        height: '100%',
      }).embed(el);
    };

    if (w.daum?.Postcode) {
      mount();
      return;
    }
    const script = document.createElement('script');
    script.src = DAUM_SCRIPT;
    script.onload = mount;
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <View nativeID={containerId} style={{ flex: 1 }} />;
}

// ── 네이티브: WebView에 embed HTML 로드 ──────────────────
function NativePostcode({ onSelect }: { onSelect: (r: PostcodeResult) => void }) {
  // require를 조건부로 사용해 웹 번들에서 webview 의존 제거
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { WebView } = require('react-native-webview');
  const html = `<!doctype html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>html,body,#wrap{margin:0;height:100%;}</style>
  </head><body>
    <div id="wrap"></div>
    <script src="${DAUM_SCRIPT}"></script>
    <script>
      new daum.Postcode({
        oncomplete: function(data) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            zonecode: data.zonecode,
            address: data.roadAddress || data.address,
          }));
        },
        width: '100%', height: '100%',
      }).embed(document.getElementById('wrap'));
    </script>
  </body></html>`;

  return (
    <WebView
      // https 오리진을 줘야 iOS WKWebView에서 주소 선택(oncomplete)이 안 죽는 경우가 있음
      source={{ html, baseUrl: 'https://postcode.map.daum.net' }}
      style={{ flex: 1 }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      onMessage={(event: { nativeEvent: { data: string } }) => {
        try {
          onSelect(JSON.parse(event.nativeEvent.data) as PostcodeResult);
        } catch {
          /* ignore */
        }
      }}
    />
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    padding: 0,
    gap: 0,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.line,
  },
  title: { fontSize: 16, fontFamily: 'Pretendard-ExtraBold', color: C.text },
});
