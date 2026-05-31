import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  BackHandler,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { EXERCISES } from '../../constants/exercises';
import { selectWarmupExercises } from '../../lib/dailyWarmup';
import { MascotChar } from './MascotChar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WarmupModalProps {
  visible: boolean;
  onClose: () => void;
  allProgress: Record<string, any>;
}

export function WarmupModal({
  visible,
  onClose,
  allProgress,
}: WarmupModalProps) {
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      sheetTranslateY.value = withSpring(0, { damping: 16, stiffness: 100 });
      
      const backAction = () => {
        onClose();
        return true;
      };
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    } else {
      sheetTranslateY.value = SCREEN_HEIGHT;
    }
  }, [visible]);

  if (!visible) return null;

  const suggested = selectWarmupExercises(allProgress);
  const firstExId = suggested[0] ?? 'schulte';
  const exMeta = EXERCISES[firstExId];
  const otherSuggs = suggested.slice(1);

  const progress = allProgress[firstExId] || { mastery: 0, total_sessions: 0, best_score: 0, current_level: 1 };
  const masteryPercent = Math.round((progress.mastery ?? 0) * 100);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const handleStart = () => {
    onClose();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    router.push({ pathname: `/exercise/${firstExId}` as any, params: { mode: 'free' } });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.warmupBottomSheet, sheetAnimatedStyle]}>
          <View style={[styles.bottomSheetHandle, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]} />
          
          <View style={styles.warmupHeaderRow}>
            <Ionicons name="flash" size={20} color="#F97316" />
            <Text style={styles.warmupHeaderTitle}>CALENTAMIENTO PERSONALIZADO</Text>
          </View>
          
          <Text style={styles.warmupIntroText}>
            Mente IA analizó tu progreso cerebral en tiempo real. Hoy te sugerimos fortalecer la destreza de:
          </Text>

          {/* Exercise card */}
          <View style={[styles.warmupExCard, { borderColor: `${exMeta?.color || '#3B82F6'}40` }]}>
            <View style={styles.warmupExHeader}>
              <View style={[styles.warmupExBadge, { backgroundColor: `${exMeta?.color || '#3B82F6'}15` }]}>
                <Text style={[styles.warmupExBadgeText, { color: exMeta?.color || '#3B82F6' }]}>{exMeta?.category}</Text>
              </View>
              <View style={styles.warmupMetaRow}>
                <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.5)" />
                <Text style={styles.warmupMetaText}>{exMeta?.duration}</Text>
                <Ionicons name="star-outline" size={13} color="rgba(255,255,255,0.5)" style={{ marginLeft: 6 }} />
                <Text style={styles.warmupMetaText}>{exMeta?.difficulty}</Text>
              </View>
            </View>

            <View style={styles.warmupExBody}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.warmupExTitle}>{exMeta?.title}</Text>
                <Text style={styles.warmupExDesc}>{exMeta?.description}</Text>
              </View>
              <MascotChar which={exMeta?.mascot} size={56} breathing blinking />
            </View>

            {/* Stats section */}
            <View style={styles.warmupStatsBox}>
              <Text style={styles.warmupStatsTitle}>TUS ESTADÍSTICAS EN TIEMPO REAL</Text>
              
              <View style={styles.warmupStatRow}>
                <Text style={styles.warmupStatLabel}>Maestría:</Text>
                <View style={styles.warmupProgressBg}>
                  <View style={[styles.warmupProgressFill, { width: `${masteryPercent}%`, backgroundColor: exMeta?.color || '#3B82F6' }]} />
                </View>
                <Text style={styles.warmupStatValue}>{masteryPercent}%</Text>
              </View>

              <View style={styles.warmupStatsGrid}>
                <View style={styles.warmupGridCol}>
                  <Text style={styles.warmupGridLabel}>Sesiones</Text>
                  <Text style={styles.warmupGridValue}>{progress.total_sessions ?? 0}</Text>
                </View>
                <View style={styles.warmupGridCol}>
                  <Text style={styles.warmupGridLabel}>Máx. Puntaje</Text>
                  <Text style={styles.warmupGridValue}>{progress.best_score ?? 0}</Text>
                </View>
                <View style={styles.warmupGridCol}>
                  <Text style={styles.warmupGridLabel}>Nivel</Text>
                  <Text style={styles.warmupGridValue}>{progress.current_level ?? 1}</Text>
                </View>
              </View>
            </View>
          </View>

          {otherSuggs.length > 0 && (
            <Text style={styles.warmupOthersText}>
              Otras sugerencias: {otherSuggs.map(id => EXERCISES[id]?.title).join(', ')}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.warmupActionsRow}>
            <Pressable style={styles.warmupCancelBtn} onPress={onClose}>
              <Text style={styles.warmupCancelText}>Quizás luego</Text>
            </Pressable>
            <Pressable style={[styles.warmupStartBtn, { backgroundColor: exMeta?.color || '#F97316' }]} onPress={handleStart}>
              <Text style={styles.warmupStartText}>¡Vamos! ⚡</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 20,
  },
  warmupBottomSheet: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(249, 115, 22, 0.25)',
    backgroundColor: '#0F172A',
  },
  warmupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  warmupHeaderTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 12.5,
    color: '#F97316',
    letterSpacing: 0.8,
  },
  warmupIntroText: {
    fontFamily: FONTS.body,
    fontSize: 12.5,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16,
  },
  warmupExCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  warmupExHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  warmupExBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  warmupExBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
  },
  warmupMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warmupMetaText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  warmupExBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  warmupExTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: '#FFF',
    marginBottom: 4,
  },
  warmupExDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16.5,
  },
  warmupStatsBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  warmupStatsTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  warmupStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warmupStatLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#94A3B8',
    width: 70,
  },
  warmupProgressBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  warmupProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  warmupStatValue: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11.5,
    color: '#FFF',
    minWidth: 26,
    textAlign: 'right',
  },
  warmupStatsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  warmupGridCol: {
    alignItems: 'center',
    flex: 1,
  },
  warmupGridLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: '#64748B',
    marginBottom: 2,
  },
  warmupGridValue: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: '#F8FAFC',
  },
  warmupOthersText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
  },
  warmupActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  warmupCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  warmupCancelText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: '#94A3B8',
  },
  warmupStartBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmupStartText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: '#FFF',
  },
});
