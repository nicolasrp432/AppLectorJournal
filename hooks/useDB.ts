import { useProfileStore } from '../store/useProfileStore';
import { useProgressStore } from '../store/useProgressStore';
import { useSessionStore } from '../store/useSessionStore';
import { usePrefsStore } from '../store/usePrefsStore';
import { useLibraryStore } from '../store/useLibraryStore';

/**
 * Unified data hook — mirrors the prototype's `useDB()` API shape.
 * Lets screen components migrate with minimal changes.
 */
export function useDB() {
  const profileStore  = useProfileStore();
  const progressStore = useProgressStore();
  const sessionStore  = useSessionStore();
  const prefsStore    = usePrefsStore();
  const libraryStore  = useLibraryStore();

  return {
    profile: {
      get:    () => profileStore.profile,
      update: profileStore.updateProfile,
      addXP:  profileStore.addXP,
    },
    progress: {
      all:    () => progressStore.all,
      get:    progressStore.get,
      update: progressStore.update,
    },
    sessions: {
      list:   sessionStore.list,
      insert: sessionStore.insert,
    },
    prefs: {
      get:    () => prefsStore.prefs,
      update: prefsStore.update,
    },
    library: {
      list:   libraryStore.list,
      get:    libraryStore.get,
      insert: libraryStore.insert,
      update: libraryStore.update,
      remove: libraryStore.remove,
    },
  };
}
