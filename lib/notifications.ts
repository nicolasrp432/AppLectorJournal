import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// expo-notifications scheduled triggers are not supported on web
const SUPPORTED = Platform.OS !== 'web';

if (SUPPORTED) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!SUPPORTED) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a daily reminder at the user's preferred time.
 * Cancels any previously scheduled "daily-reminder" notification first.
 * @param time  "HH:MM" string, e.g. "20:00"
 */
export async function scheduleDailyReminder(time: string): Promise<void> {
  if (!SUPPORTED) return;
  await cancelDailyReminder();

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const [hourStr, minStr] = time.split(':');
  const hour   = parseInt(hourStr, 10);
  const minute = parseInt(minStr, 10);

  if (isNaN(hour) || isNaN(minute)) return;

  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-reminder',
    content: {
      title: '¡Tu sesión de hoy te espera! 🧠',
      body: 'Entrena 10 minutos y mantén tu racha.',
      data: { type: 'daily-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (!SUPPORTED) return;
  await Notifications.cancelScheduledNotificationAsync('daily-reminder').catch(() => {});
}

export async function scheduleStreakWarning(): Promise<void> {
  if (!SUPPORTED) return;
  await Notifications.cancelScheduledNotificationAsync('streak-warning').catch(() => {});
  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    identifier: 'streak-warning',
    content: {
      title: '⚡ Tu racha corre peligro',
      body: 'Solo faltan unos minutos para mantenerla. ¡Vamos!',
      data: { type: 'streak-warning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 30,
    },
  });
}
