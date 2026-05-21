import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { useNotificationStore, NotificationItem } from '../../store/useNotificationStore';
import { useDailyMissionStore } from '../../store/useDailyMissionStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationCenter({ visible, onClose }: Props) {
  const { notifications, fetchNotifications, markAsRead, claimReward, isLoading } = useNotificationStore();
  const dailyMission = useDailyMissionStore(s => s.mission);

  // Animation values
  const backdropOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
      sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 250 });
      sheetTranslateY.value = withTiming(600, { duration: 250 });
    }
  }, [visible]);

  const handleClose = () => {
    backdropOpacity.value = withTiming(0, { duration: 250 });
    sheetTranslateY.value = withTiming(600, { duration: 250 }, () => {
      runOnJS(onClose)();
    });
  };

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'mission':
        return { bg: '#FEF3C7', border: '#F59E0B', text: '#D97706', icon: 'flash' };
      case 'achievement':
        return { bg: '#D1FAE5', border: '#10B981', text: '#059669', icon: 'trophy' };
      case 'streak':
        return { bg: '#FFE4E6', border: '#F43F5E', text: '#E11D48', icon: 'flame' };
      case 'tip':
        return { bg: '#EDE9FE', border: '#8B5CF6', text: '#7C3AED', icon: 'bulb' };
      default:
        return { bg: '#E0F2FE', border: '#0EA5E9', text: '#0284C7', icon: 'notifications' };
    }
  };

  const isRewardClaimable = (item: NotificationItem) => {
    if (item.claimed || item.xp_reward <= 0) return false;
    if (item.category === 'mission') {
      // For daily missions, the mission must be completed to claim
      return dailyMission?.completed === true;
    }
    return true; // Other notification rewards are claimable immediately
  };

  const renderNotificationCard = (item: NotificationItem) => {
    const isUnread = !item.read;
    const cat = getCategoryStyles(item.category);
    const claimable = isRewardClaimable(item);

    return (
      <Pressable
        key={item.id}
        onPress={() => {
          if (isUnread) markAsRead(item.id);
        }}
        style={[
          styles.card,
          isUnread && styles.unreadCard,
          { borderLeftColor: cat.border }
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon as any} size={18} color={cat.text} />
          </View>
          <View style={styles.contentCol}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, isUnread && styles.boldText]}>{item.title}</Text>
              {isUnread && <View style={[styles.unreadDot, { backgroundColor: cat.border }]} />}
            </View>
            <Text style={styles.cardMessage}>{item.message}</Text>
          </View>
        </View>

        {item.xp_reward > 0 && (
          <View style={styles.rewardRow}>
            <View style={styles.xpRewardBadge}>
              <Ionicons name="flash" size={12} color="#D97706" style={{ marginRight: 2 }} />
              <Text style={styles.xpRewardText}>+{item.xp_reward} XP</Text>
            </View>

            {item.claimed ? (
              <View style={styles.claimedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.claimedText}>Reclamado</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => claimReward(item.id)}
                disabled={!claimable}
                style={[
                  styles.claimButton,
                  { backgroundColor: cat.border },
                  !claimable && styles.disabledButton
                ]}
                hitSlop={8}
              >
                <Text style={styles.claimButtonText}>
                  {item.category === 'mission' && !claimable ? 'En progreso' : 'Reclamar'}
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Semi-transparent Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </Animated.View>

        {/* Sliding Bottom Sheet */}
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.sheetHeader}>
            <View style={styles.notch} />
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Centro de Notificaciones</Text>
              <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
                <Ionicons name="close" size={24} color={COLORS.ink} />
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.focus} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={COLORS.muted} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Bandeja de entrada limpia</Text>
              <Text style={styles.emptyDesc}>No tienes notificaciones pendientes en este momento.</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.listContent}>
              {notifications.map(renderNotificationCard)}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '75%',
    maxHeight: 650,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  notch: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.ink,
  },
  closeBtn: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: 4,
  },
  emptyDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.015,
    shadowRadius: 6,
    elevation: 1,
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  cardTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
  },
  boldText: {
    fontFamily: FONTS.headingBold,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardMessage: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkLight,
    lineHeight: 16,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpRewardText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#D97706',
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  claimedText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: '#10B981',
  },
  claimButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimButtonText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#FFF',
  },
  disabledButton: {
    backgroundColor: '#CBD5E1',
    opacity: 0.65,
  },
});
