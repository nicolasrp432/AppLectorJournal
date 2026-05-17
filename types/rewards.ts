import type { MascotKey } from './db';

export type RewardCategory = 'themes' | 'avatars' | 'powerups' | 'vibes' | 'reading' | 'badges';
export type RewardType = 'theme' | 'avatar' | 'powerup' | 'background' | 'pack' | 'badge';

export interface RewardItem {
  id: string;
  cat: RewardCategory;
  type: RewardType;
  title: string;
  desc: string;
  cost: number;
  value?: string;      // hex color for themes
  mascot?: MascotKey;  // for avatar type
  icon?: string;       // GIcon name
  color?: string;      // accent color
  consumable?: boolean;
  locked?: boolean;
  requires?: string;
  owned?: boolean;     // default ownership (e.g. free items)
  equipped?: boolean;
}
