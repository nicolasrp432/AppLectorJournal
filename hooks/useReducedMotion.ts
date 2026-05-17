import { usePrefsStore } from '../store/usePrefsStore';

export function useReducedMotion(): boolean {
  return usePrefsStore(s => s.prefs.reduce_motion);
}
