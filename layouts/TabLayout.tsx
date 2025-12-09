// src/layouts/TabLayout.tsx
import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';

import TvTabsLayout from './TvTabsLayout';

export default function TabLayout() {
  // На ТВ – свой layout с управлением стрелками
  return <TvTabsLayout />;
}
