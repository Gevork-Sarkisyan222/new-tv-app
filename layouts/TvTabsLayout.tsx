// src/layouts/TvTabsLayout.tsx
import React, { useCallback, useRef, useEffect } from 'react';
import { View, Platform, useTVEventHandler } from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';

const ROUTES = [
  '/(tabs)', // Home
  '/(tabs)/mqtt', // MQTT
  '/(tabs)/files', // Files
];

const TvTabsLayout: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();

  const indexRef = useRef(0);
  const isSwitchingRef = useRef(false);
  const lastSwitchTimeRef = useRef(0);

  // когда роут меняется (даже не через стрелки) — обновляем индекс
  useEffect(() => {
    const idx = ROUTES.indexOf(pathname as string);
    if (idx !== -1) {
      indexRef.current = idx;
    }
  }, [pathname]);

  const tvHandler = useCallback(
    (evt: { eventType: string }) => {
      if (!Platform.isTV) return;

      let delta = 0;
      if (evt.eventType === 'right') delta = 1;
      else if (evt.eventType === 'left') delta = -1;
      else return;

      const now = Date.now();

      // защита от “удержания” стрелки и спама событиями
      if (isSwitchingRef.current && now - lastSwitchTimeRef.current < 200) {
        return;
      }

      const nextIndex = (indexRef.current + delta + ROUTES.length) % ROUTES.length;

      if (nextIndex === indexRef.current) return;

      indexRef.current = nextIndex;
      isSwitchingRef.current = true;
      lastSwitchTimeRef.current = now;

      router.replace(ROUTES[nextIndex]);

      // через небольшую паузу снова разрешаем переключение
      setTimeout(() => {
        isSwitchingRef.current = false;
      }, 200);
    },
    [router],
  );

  useTVEventHandler(tvHandler);

  return (
    <View style={{ flex: 1 }}>
      {/* невидимый, но фокусируемый элемент, чтобы стрелки приходили в JS */}
      {/* @ts-ignore: эти пропсы есть только на TV */}
      <View style={{ width: 1, height: 1, opacity: 0 }} focusable hasTVPreferredFocus />
      <Slot />
    </View>
  );
};

export default TvTabsLayout;
