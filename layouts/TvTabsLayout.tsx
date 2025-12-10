// src/layouts/TvTabsLayout.tsx
import React, { useCallback, useRef } from 'react';
import { View, Platform, useTVEventHandler } from 'react-native';
import { Slot, useRouter } from 'expo-router';

const ROUTES = [
  '/(tabs)', // Home
  '/(tabs)/mqtt', // MQTT
  '/(tabs)/files', // Files
];

const TvTabsLayout: React.FC = () => {
  const router = useRouter();
  const indexRef = useRef(0);

  const tvHandler = useCallback(
    (evt: { eventType: string }) => {
      if (!Platform.isTV) return;

      // Для дебага можешь включить:
      // console.log('TV EVENT', evt);

      if (evt.eventType === 'right') {
        indexRef.current = (indexRef.current + 1) % ROUTES.length;
        router.replace(ROUTES[indexRef.current]);
      } else if (evt.eventType === 'left') {
        indexRef.current = (indexRef.current - 1 + ROUTES.length) % ROUTES.length;
        router.replace(ROUTES[indexRef.current]);
      }
    },
    [router],
  );

  useTVEventHandler(tvHandler);

  return (
    <View style={{ flex: 1 }}>
      {/* @ts-ignore эти пропсы есть на ТВ, но TS о них не знает */}
      <View style={{ width: 1, height: 1, opacity: 0 }} focusable hasTVPreferredFocus />

      <Slot />
    </View>
  );
};

export default TvTabsLayout;
