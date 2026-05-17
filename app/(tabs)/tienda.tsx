import React, { useState, useRef } from 'react';
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { REWARDS } from '../../constants/rewards';
import { useProfileStore } from '../../store/useProfileStore';
import { useRewardsStore } from '../../store/useRewardsStore';
import { COLORS, darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import type { RewardItem, RewardCategory } from '../../types/rewards';

type Filter = 'all' | RewardCategory;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'Todo'       },
  { id: 'themes',   label: 'Temas'      },
  { id: 'avatars',  label: 'Personajes' },
  { id: 'powerups', label: 'Power-ups'  },
  { id: 'vibes',    label: 'Ambientes'  },
  { id: 'reading',  label: 'Lectura'    },
  { id: 'badges',   label: 'Insignias'  },
];

export default function TiendaScreen() {
  const [filter, setFilter] = useState<Filter>('all');
  const [toast,  setToast]  = useState<{ msg: string; kind: 'ok' | 'err' | 'lock' } | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const profile    = useProfileStore(s => s.profile);
  const { addXP }  = useProfileStore();
  const { owned, equipped, buy, equip, isOwned, isEquipped } = useRewardsStore();

  const xp = profile?.xp ?? 0;

  const showToast = (msg: string, kind: 'ok' | 'err' | 'lock') => {
    setToast({ msg, kind });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const handleAction = async (r: RewardItem) => {
    if (r.locked) { showToast(`Requiere: ${r.requires}`, 'lock'); return; }

    if (isOwned(r.id) && !r.consumable) {
      equip(r.id, r.type, r.value, r.mascot);
      showToast('¡Equipado!', 'ok');
      return;
    }

    if (xp < r.cost) {
      showToast(`Te faltan ${r.cost - xp} XP`, 'err');
      return;
    }

    await addXP(-r.cost);
    buy(r.id, r.cost, r.type, r.value, r.mascot);
    showToast(r.consumable ? `${r.title} listo para usar` : `¡${r.title} desbloqueado!`, 'ok');
  };

  const filtered = filter === 'all' ? REWARDS : REWARDS.filter(r => r.cat === filter);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.eyebrow}>Tienda</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>⚡ {xp} XP</Text>
          </View>
        </View>
        <Text style={styles.title}>Tu colección</Text>

        {/* Filter pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {FILTERS.map(f => (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.pill, filter === f.id && styles.pillActive]}
            >
              <Text style={[styles.pillText, filter === f.id && styles.pillTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
          <View style={{ width: 20 }} />
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={item => item.id}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 110 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <RewardCard
            r={item}
            owned={isOwned(item.id)}
            equipped={isEquipped(item.id)}
            canAfford={xp >= item.cost}
            onAction={() => handleAction(item)}
          />
        )}
      />

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity },
          toast.kind === 'err' ? styles.toastErr : toast.kind === 'lock' ? styles.toastLock : styles.toastOk,
        ]}>
          <Text style={styles.toastText}>{toast.msg}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function RewardCard({
  r, owned, equipped, canAfford, onAction,
}: {
  r: RewardItem; owned: boolean; equipped: boolean; canAfford: boolean; onAction: () => void;
}) {
  const isLocked    = r.locked ?? false;
  const itemColor   = r.value?.startsWith('#') ? r.value : (r.color ?? COLORS.muted);
  const btnColor    = equipped ? COLORS.focus : owned ? COLORS.ink : isLocked ? COLORS.subtle : canAfford ? COLORS.joy : COLORS.border;
  const btnLabel    = equipped ? 'EN USO' : owned ? (r.consumable ? 'USAR' : 'EQUIPAR') : isLocked ? 'BLOQ.' : `${r.cost} XP`;

  return (
    <View style={[styles.card, equipped && { borderColor: COLORS.focus }, { flex: 1 }]}>
      {/* Preview */}
      <View style={[styles.preview, r.type === 'theme' ? { backgroundColor: itemColor } : { backgroundColor: COLORS.surface }]}>
        {r.type === 'theme' && (
          <View style={styles.themePreview}>
            <View style={[styles.themeCircle, { shadowColor: itemColor }]}>
              <Text style={{ fontSize: 18 }}>✨</Text>
            </View>
          </View>
        )}
        {r.type === 'avatar' && <Text style={{ fontSize: 48 }}>😊</Text>}
        {(r.type === 'powerup' || r.type === 'badge' || r.type === 'background' || r.type === 'pack') && (
          <View style={[styles.iconBox, { backgroundColor: itemColor + '18', borderColor: itemColor + '40' }]}>
            <Text style={{ fontSize: 30 }}>⚡</Text>
          </View>
        )}
        {isLocked && (
          <View style={styles.lockOverlay}>
            <Text style={{ fontSize: 22 }}>🔒</Text>
            {r.requires && <Text style={styles.lockLabel}>{r.requires}</Text>}
          </View>
        )}
        {equipped && (
          <View style={styles.equippedBadge}>
            <Text style={{ fontSize: 12 }}>✓</Text>
          </View>
        )}
      </View>

      <Text style={styles.cardTitle} numberOfLines={1}>{r.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{r.desc}</Text>

      <Pressable
        onPress={onAction}
        disabled={isLocked || (!owned && !canAfford)}
        style={[styles.buyBtn, { backgroundColor: btnColor }]}
      >
        <Text style={[styles.buyBtnText, { color: (equipped || owned || canAfford) && !isLocked ? '#fff' : COLORS.muted }]}>
          {btnLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.canvas },
  header:    { backgroundColor: COLORS.white, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.surface },
  titleRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eyebrow:   { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.subtle, textTransform: 'uppercase', letterSpacing: 1.2 },
  xpBadge:   { backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  xpText:    { fontFamily: FONTS.heading, fontSize: 13, color: '#78350F' },
  title:     { fontFamily: FONTS.heading, fontSize: 24, color: COLORS.ink },
  pill:      { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: COLORS.surface, borderRadius: 999, marginRight: 6 },
  pillActive:{ backgroundColor: COLORS.ink },
  pillText:  { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  pillTextActive: { color: '#fff' },
  card:      { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, padding: 12 },
  preview:   { aspectRatio: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10, overflow: 'hidden', position: 'relative' },
  themePreview: { alignItems: 'center' },
  themeCircle:{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  iconBox:   { width: 64, height: 64, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  lockOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17,24,39,0.6)', alignItems: 'center', justifyContent: 'center', gap: 4 } as any,
  lockLabel: { fontFamily: FONTS.headingSemi, fontSize: 9, color: '#fff', textAlign: 'center', paddingHorizontal: 6 },
  equippedBadge: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.focus, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.ink, lineHeight: 18 },
  cardDesc:  { fontFamily: FONTS.bodyLight, fontSize: 10.5, color: COLORS.subtle, marginTop: 3, height: 30 },
  buyBtn:    { marginTop: 8, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  buyBtnText:{ fontFamily: FONTS.heading, fontSize: 11, letterSpacing: 0.5 },
  toast:     { position: 'absolute', left: 20, right: 20, bottom: 96, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center' },
  toastOk:   { backgroundColor: '#DCFCE7', borderWidth: 1.5, borderColor: '#86EFAC' },
  toastErr:  { backgroundColor: '#FEE2E2', borderWidth: 1.5, borderColor: '#FCA5A5' },
  toastLock: { backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: COLORS.border },
  toastText: { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.ink },
});
