import { useProfileStore } from '../store/useProfileStore';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function useStreak() {
  const { profile, updateProfile } = useProfileStore();

  const checkAndUpdateStreak = async () => {
    if (!profile) return;
    const today     = todayISO();
    const yesterday = yesterdayISO();
    const lastActive = profile.last_active;

    if (lastActive === today) return;

    const newStreak = lastActive === yesterday ? (profile.streak ?? 0) + 1 : 1;
    await updateProfile({ streak: newStreak, last_active: today });
  };

  return { checkAndUpdateStreak, streak: profile?.streak ?? 0 };
}
