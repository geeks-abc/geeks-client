import React, { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { createNearbyMapHtml, serializeMapItems } from '@/components/nearby-map-html';
import { NearbyMapProps } from '@/components/nearby-map.types';
import { C } from '@/lib/theme';

export function NearbyMap({ facility, items, onSelect }: NearbyMapProps) {
  const webViewRef = useRef<WebView>(null);
  const { lat, lng, name } = facility;
  const html = useMemo(
    () => createNearbyMapHtml({ lat, lng, name }),
    [lat, lng, name],
  );
  const serializedItems = useMemo(() => serializeMapItems(items), [items]);

  const updateItems = () => {
    webViewRef.current?.injectJavaScript(
      `window.updateNearbyItems && window.updateNearbyItems(${serializedItems}); true;`,
    );
  };

  useEffect(updateItems, [serializedItems]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        source?: string;
        type?: string;
        id?: number;
      };
      if (message.source === 'ieum-nearby-map' && message.type === 'select' && message.id) {
        onSelect(message.id);
      }
    } catch {
      // 지도 외부 메시지는 무시합니다.
    }
  };

  return (
    <View style={s.container}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: 'https://leafletjs.com' }}
        originWhitelist={['*']}
        applicationNameForUserAgent="Ieum/1.0"
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onLoadEnd={updateItems}
        onMessage={onMessage}
        startInLoadingState
        renderLoading={() => (
          <View style={s.loading}>
            <ActivityIndicator color={C.brand} />
          </View>
        )}
        style={s.webView}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF1EF' },
  webView: { flex: 1, backgroundColor: '#EEF1EF' },
  loading: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF1EF' },
});
