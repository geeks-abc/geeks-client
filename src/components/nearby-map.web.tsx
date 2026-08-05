import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { createNearbyMapHtml } from '@/components/nearby-map-html';
import { NearbyMapProps } from '@/components/nearby-map.types';

export function NearbyMap({ facility, items, onSelect }: NearbyMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { lat, lng, name } = facility;
  const html = useMemo(
    () => createNearbyMapHtml({ lat, lng, name }),
    [lat, lng, name],
  );

  const updateItems = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'update-nearby-items', items },
      '*',
    );
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const message = event.data as { source?: string; type?: string; id?: number };
      if (message?.source === 'ieum-nearby-map' && message.type === 'select' && message.id) {
        onSelect(message.id);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onSelect]);

  useEffect(updateItems, [items]);

  return (
    <View style={s.container}>
      {React.createElement('iframe', {
        ref: iframeRef,
        srcDoc: html,
        title: '주변 기부 식품 지도',
        onLoad: updateItems,
        style: { width: '100%', height: '100%', border: 0 },
      })}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF1EF' },
});
