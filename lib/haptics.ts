import { Platform } from 'react-native';

const noop = () => Promise.resolve();

let _haptics: typeof import('expo-haptics') | null = null;
if (Platform.OS !== 'web') {
  _haptics = require('expo-haptics');
}

const H = _haptics;

export const tap     = H ? () => H.impactAsync(H.ImpactFeedbackStyle.Light)   : noop;
export const medium  = H ? () => H.impactAsync(H.ImpactFeedbackStyle.Medium)  : noop;
export const heavy   = H ? () => H.impactAsync(H.ImpactFeedbackStyle.Heavy)   : noop;
export const error   = H ? () => H.notificationAsync(H.NotificationFeedbackType.Error)   : noop;
export const success = H ? () => H.notificationAsync(H.NotificationFeedbackType.Success) : noop;
export const warning = H ? () => H.notificationAsync(H.NotificationFeedbackType.Warning) : noop;
