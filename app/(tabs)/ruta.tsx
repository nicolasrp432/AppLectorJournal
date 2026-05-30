import React, { useEffect, useRef } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, Modal, BackHandler, Alert, ScrollView, Platform
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, withDelay, useAnimatedRef, useScrollViewOffset, SharedValue, useAnimatedProps,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore } from '../../store/useProfileStore';
import { useNodeStore } from '../../store/useNodeStore';
import { useRewardsStore } from '../../store/useRewardsStore';
import { useDailyMissionStore } from '../../store/useDailyMissionStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { NotificationCenter } from '../../components/ui/NotificationCenter';
import { ConfettiOverlay } from '../../components/ui/ConfettiOverlay';
import { COLORS, darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { MascotChar, MascotKey } from '../../components/ui/MascotChar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExerciseId } from '../../types/db';
import { selectWarmupExercises } from '../../lib/dailyWarmup';
import { EXERCISES } from '../../constants/exercises';
import { AIChatbot } from '../../components/ui/AIChatbot';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const W    = Math.min(SCREEN_WIDTH, 520) - 40;
const ROW  = 120;
const HALF = W / 2;

const SIDE_X = { left: HALF - 80, center: HALF, right: HALF + 80 };
const START_Y = 70;

type NodeSide = 'left' | 'center' | 'right';
type NodeKind = 'lesson' | 'exercise' | 'chest' | 'boss';

interface ZoneNode {
  id:      string;
  kind:    NodeKind;
  side:    NodeSide;
  label:   string;
  exId?:   ExerciseId;
  color:   string;
  locked?: boolean;
}

const ZONES: { title: string; subtitle: string; color: string; mascot: MascotKey; nodes: ZoneNode[] }[] = [
  {
    title: 'Zona 1', subtitle: 'Diagnóstico y Velocidad',
    color: COLORS.focus, mascot: 'focus',
    nodes: [
      { id: 'z1_s1',     kind: 'exercise', side: 'center', label: 'Test Velocidad', color: COLORS.swift, exId: 'reading_test' },
      { id: 'z1_schulte',kind: 'exercise', side: 'left',   label: 'Tabla Schulte',  color: COLORS.focus, exId: 'schulte' },
      { id: 'z1_s2',     kind: 'exercise', side: 'right',  label: 'Lectura Focal',  color: COLORS.swift, exId: 'reading' },
      { id: 'z1_chest',  kind: 'chest',    side: 'center', label: 'Cofre',          color: '#EAB308' },
      { id: 'z1_focal',  kind: 'exercise', side: 'left',   label: 'Lectura Libre',  color: COLORS.joy,   exId: 'freereading' },
      { id: 'z1_comp',   kind: 'exercise', side: 'right',  label: 'Comprensión',   color: COLORS.joy,   exId: 'comprehension' },
      { id: 'z1_boss',   kind: 'boss',     side: 'center', label: 'Jefe de Zona',  color: COLORS.boss,  exId: 'boss' },
    ],
  },
  {
    title: 'Zona 2', subtitle: 'Memoria',
    color: COLORS.calm, mascot: 'calm',
    nodes: [
      { id: 'z2_lesson', kind: 'lesson',   side: 'center', label: 'Lección',        color: COLORS.calm  },
      { id: 'z2_ws1',    kind: 'exercise', side: 'left',   label: 'Word Span',      color: COLORS.calm,   exId: 'wordspan' },
      { id: 'z2_chest',  kind: 'chest',    side: 'center', label: 'Cofre',           color: '#EAB308' },
      { id: 'z2_ws2',    kind: 'exercise', side: 'right',  label: 'Word Span+',     color: COLORS.calm,   exId: 'wordspan' },
      { id: 'z2_loci',   kind: 'exercise', side: 'left',   label: 'Método Loci',    color: COLORS.loci,  exId: 'loci' },
      { id: 'z2_boss',   kind: 'boss',     side: 'center', label: 'Jefe de Zona',   color: COLORS.boss,  exId: 'boss' },
    ],
  },
  {
    title: 'Zona 3', subtitle: 'Enfoque Avanzado',
    color: COLORS.swift, mascot: 'swift',
    nodes: [
      { id: 'z3_lesson', kind: 'lesson',   side: 'center', label: 'Lección',        color: COLORS.swift },
      { id: 'z3_f1',     kind: 'exercise', side: 'left',   label: '400 WPM',        color: COLORS.swift, exId: 'reading' },
      { id: 'z3_chest',  kind: 'chest',    side: 'center', label: 'Cofre',           color: '#EAB308' },
      { id: 'z3_focus',  kind: 'exercise', side: 'left',   label: 'Enfoque Visual', color: COLORS.focus, exId: 'focus_circle' },
      { id: 'z3_f2',     kind: 'exercise', side: 'right',  label: '600 WPM',        color: COLORS.swift, exId: 'reading' },
      { id: 'z3_boss',   kind: 'boss',     side: 'center', label: 'Jefe de Zona',   color: COLORS.boss,  exId: 'boss' },
    ],
  },
];

const EX_MASCOT: Record<string, MascotKey> = {
  schulte: 'focus',
  reading: 'swift',
  wordspan: 'calm',
  loci: 'loci',
  comprehension: 'joy',
  boss: 'boss',
  reading_test: 'swift',
  focus_circle: 'focus',
};

const EX_METRICS: Record<string, { title: string; desc: string; skills: string[] }> = {
  schulte: {
    title: 'Tabla de Schulte',
    desc: 'Entrena tu velocidad de búsqueda visual y amplía tu campo periférico de lectura.',
    skills: ['Fijación Visual', 'Enfoque Periférico', 'Velocidad de Escaneo'],
  },
  reading: {
    title: 'Lectura RSVP',
    desc: 'Lee palabra por palabra eliminando la subvocalización interna para duplicar tus WPM.',
    skills: ['Eliminación de Subvocalización', 'Procesamiento Rápido', 'Ritmo Semántico'],
  },
  wordspan: {
    title: 'Word Span Retentivo',
    desc: 'Desafía los límites de tu memoria a corto plazo memorizando secuencias de palabras rápidas.',
    skills: ['Memoria de Trabajo', 'Codificación Serial', 'Retención Temporal'],
  },
  loci: {
    title: 'Palacio de Memoria Loci',
    desc: 'Asocia conceptos a coordenadas espaciales utilizando el método ancestral del palacio.',
    skills: ['Anclaje Espacial', 'Pensamiento Creativo', 'Recuperación Memórica'],
  },
  comprehension: {
    title: 'Comprensión Crítica',
    desc: 'Evalúa tu retención respondiendo preguntas analíticas tras lecturas rápidas.',
    skills: ['Retención Textual', 'Deducción Semántica', 'Lectura de Comprensión'],
  },
  boss: {
    title: 'Batalla de Jefe',
    desc: 'Un desafío extremo cronometrado que fusiona todas las habilidades aprendidas en la zona.',
    skills: ['Reacción Cognitiva', 'Resistencia Mental', 'Dominio Integral'],
  },
  reading_test: {
    title: 'Test Diagnóstico Lector',
    desc: 'Mide tu velocidad natural de lectura y tu retención para calibrar el entrenamiento.',
    skills: ['Velocidad Inicial', 'Medición de WPM', 'Comprensión Base'],
  },
  focus_circle: {
    title: 'Círculo de Enfoque',
    desc: 'Entrena la atención visual sostenida y visión periférica fijando la mirada en el círculo en expansión.',
    skills: ['Atención Sostenida', 'Concentración Periférica', 'Relajación Mental'],
  },
};

const NODE_DEPENDENCIES: Record<string, string[][]> = {
  z1_s1:     [],
  z1_schulte:[['z1_s1']],
  z1_s2:     [['z1_schulte']],
  z1_chest:  [['z1_s2']],
  z1_focal:  [['z1_chest']],
  z1_comp:   [['z1_chest']],
  z1_boss:   [['z1_focal', 'z1_comp']],

  z2_lesson: [],
  z2_ws1:    [['z2_lesson']],
  z2_chest:  [['z2_ws1']],
  z2_ws2:    [['z2_chest']],
  z2_loci:   [['z2_ws2']],
  z2_boss:   [['z2_loci']],

  z3_lesson: [],
  z3_f1:     [['z3_lesson']],
  z3_chest:  [['z3_f1']],
  z3_focus:  [['z3_chest']],
  z3_f2:     [['z3_focus']],
  z3_boss:   [['z3_f2']],
};

function resolveNodeLocked(
  nodes: ZoneNode[],
  idx: number,
  completed: string[],
  zoneUnlocked: boolean,
): boolean {
  if (!zoneUnlocked) return true;
  const node = nodes[idx];
  
  if (completed.includes(node.id)) return false;

  const deps = NODE_DEPENDENCIES[node.id];
  if (!deps || deps.length === 0) return false;

  const isAnyClauseSatisfied = deps.some(clause =>
    clause.every(depId => completed.includes(depId))
  );

  return !isAnyClauseSatisfied;
}

function buildTrail(nodes: ZoneNode[]): string {
  const pts = nodes.map((n, i) => ({ x: SIDE_X[n.side], y: START_Y + i * ROW }));
  let d = '';
  pts.forEach((p, i) => {
    if (i === 0) {
      d += `M ${p.x} ${p.y}`;
    } else {
      const prev = pts[i - 1];
      const cy   = (prev.y + p.y) / 2;
      d += ` Q ${prev.x} ${cy} ${(prev.x + p.x) / 2} ${cy} T ${p.x} ${p.y}`;
    }
  });
  return d;
}

// ─── ANIMATED PARALLAX FOREST BACKDROP (ZONE 1) ──────────────────────────────────────
function ForestBackdrop({ scrollOffset }: { scrollOffset: SharedValue<number> }) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollOffset.value * 0.16 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]} pointerEvents="none">
      <FloatingLeaf left={30} top={80} />
      <FloatingLeaf left={W - 80} top={140} />
      <FloatingLeaf left={50} top={260} />
      <FloatingLeaf left={W - 90} top={380} />
      <FloatingLeaf left={120} top={480} />
      <FloatingLeaf left={W - 60} top={620} />
    </Animated.View>
  );
}

function FloatingLeaf({ left, top }: { left: number; top: number }) {
  const floatY = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(16, { duration: 2500 }),
        withTiming(-16, { duration: 2500 })
      ),
      -1,
      true
    );
    rot.value = withRepeat(
      withTiming(360, { duration: 14000 }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left,
    top,
    transform: [
      { translateY: floatY.value },
      { rotate: `${rot.value}deg` }
    ],
    opacity: 0.16,
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 22C2 22 6 18 12 18C18 18 22 22 22 22C22 22 18 14 12 14C6 14 2 22 2 22Z"
          fill="#10B981"
        />
        <Path
          d="M12 2C12 2 8 8 8 14C8 20 12 22 12 22C12 22 16 20 16 14C16 8 12 2 12 2Z"
          fill="#34D399"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── ANIMATED PARALLAX COSMOS BACKDROP (ZONE 2) ──────────────────────────────────────
function CosmosBackdrop({ scrollOffset }: { scrollOffset: SharedValue<number> }) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollOffset.value * 0.18 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]} pointerEvents="none">
      <TwinklingStar left={40} top={60} />
      <TwinklingStar left={W - 80} top={120} />
      <TwinklingStar left={60} top={280} />
      <TwinklingStar left={W - 100} top={400} />
      <TwinklingStar left={140} top={520} />
      <TwinklingStar left={W - 60} top={640} />
    </Animated.View>
  );
}

function TwinklingStar({ left, top }: { left: number; top: number }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1600 }),
        withTiming(0.5, { duration: 1600 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1600 }),
        withTiming(0.2, { duration: 1600 })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left,
    top,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9Z"
          fill="#A855F7"
        />
      </Svg>
    </Animated.View>
  );
}

// ─── ANIMATED PARALLAX CYBER BACKDROP (ZONE 3) ───────────────────────────────────────
function CyberBackdrop({ scrollOffset }: { scrollOffset: SharedValue<number> }) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollOffset.value * 0.22 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]} pointerEvents="none">
      <SpeedLine left={40} />
      <SpeedLine left={130} />
      <SpeedLine left={W - 120} />
      <SpeedLine left={W - 50} />
    </Animated.View>
  );
}

function SpeedLine({ left }: { left: number }) {
  const floatY = useSharedValue(-200);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(800, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left,
    top: floatY.value,
    opacity: 0.12,
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width={40} height={180} viewBox="0 0 40 180" fill="none">
        <Line x1="10" y1="0" x2="30" y2="180" stroke="#38BDF8" strokeWidth={2} strokeDasharray="8 12" />
      </Svg>
    </Animated.View>
  );
}

// ─── ANIMATED PARALLAX CAFE RAIN BACKDROP (bg-cafe) ──────────────────────────────────
function CafeRainBackdrop({ scrollOffset }: { scrollOffset: SharedValue<number> }) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollOffset.value * 0.14 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]} pointerEvents="none">
      <RainDrop left={40} speed={1500} delay={0} />
      <RainDrop left={110} speed={1800} delay={200} />
      <RainDrop left={W - 120} speed={1600} delay={400} />
      <RainDrop left={W - 40} speed={1400} delay={100} />
      <RainDrop left={70} speed={2000} delay={600} />
      <RainDrop left={W - 80} speed={1700} delay={800} />
    </Animated.View>
  );
}

function RainDrop({ left, speed, delay }: { left: number; speed: number; delay: number }) {
  const dropY = useSharedValue(-100);

  useEffect(() => {
    dropY.value = withTiming(800, { duration: speed });
    
    const interval = setInterval(() => {
      dropY.value = -100;
      dropY.value = withTiming(800, { duration: speed });
    }, speed + delay + 100);

    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left,
    top: dropY.value,
    opacity: 0.18,
  }));

  return (
    <Animated.View style={animStyle}>
      <Svg width={4} height={40} viewBox="0 0 4 40" fill="none">
        <Line x1="2" y1="0" x2="2" y2="40" stroke="#38BDF8" strokeWidth={1.5} opacity={0.6} />
      </Svg>
    </Animated.View>
  );
}

// ─── ANIMATED PARALLAX LIBRARY BACKDROP (bg-library) ─────────────────────────────────
function LibraryBackdrop({ scrollOffset }: { scrollOffset: SharedValue<number> }) {
  const parallaxStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollOffset.value * 0.15 }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, parallaxStyle]} pointerEvents="none">
      <FloatingMote left={30} top={80} size={6} />
      <FloatingMote left={W - 70} top={150} size={8} />
      <FloatingMote left={50} top={290} size={5} />
      <FloatingMote left={W - 90} top={410} size={7} />
      <FloatingMote left={110} top={530} size={9} />
      <FloatingMote left={W - 50} top={650} size={6} />
    </Animated.View>
  );
}

function FloatingMote({ left, top, size }: { left: number; top: number; size: number }) {
  const floatY = useSharedValue(0);
  const driftX = useSharedValue(0);
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(withTiming(15, { duration: 3000 }), withTiming(-15, { duration: 3000 })),
      -1,
      true
    );
    driftX.value = withRepeat(
      withSequence(withTiming(10, { duration: 2500 }), withTiming(-10, { duration: 2500 })),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 2000 }), withTiming(0.1, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left + driftX.value,
    top: top + floatY.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animStyle}>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#FCD34D' }} />
    </Animated.View>
  );
}

// ─── MAIN ROUTE SCREEN ───────────────────────────────────────────────────────
export default function RutaScreen() {
  const profile   = useProfileStore(s => s.profile);
  const addXP     = useProfileStore(s => s.addXP);
  const completed = useNodeStore(s => s.completed);
  const completeNode = useNodeStore(s => s.completeNode);
  const newlyCompleted = useNodeStore(s => s.newlyCompletedNodeId);
  const clearNewlyCompleted = useNodeStore(s => s.clearNewlyCompleted);

  // Daily goals
  const mission = useDailyMissionStore(s => s.mission);
  const checkOrGenerate = useDailyMissionStore(s => s.checkOrGenerate);
  const claimReward = useDailyMissionStore(s => s.claimReward);
  const all = useProgressStore(s => s.all);

  const [showNotifications, setShowNotifications] = React.useState(false);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const unreadCount = useNotificationStore(s => s.notifications.filter(n => !n.read).length);

  // States
  const [activeChestNode, setActiveChestNode] = React.useState<ZoneNode | null>(null);
  const [activeExerciseNode, setActiveExerciseNode] = React.useState<ZoneNode | null>(null);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [unlockingZoneTitle, setUnlockingZoneTitle] = React.useState<string | null>(null);

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useScrollViewOffset(scrollRef);

  const zone1BossCompleted = completed.includes('z1_boss');
  const zone2BossCompleted = completed.includes('z2_boss');

  // Trigger daily goal generation and fetch notifications
  useEffect(() => {
    checkOrGenerate();
    fetchNotifications();
  }, []);

  // Detect completed nodes to burst confetti
  useEffect(() => {
    if (newlyCompleted) {
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      clearNewlyCompleted();
    }
  }, [newlyCompleted]);

  // Check Zone Unlocks sequence
  useEffect(() => {
    const checkZoneUnlocks = async () => {
      if (zone1BossCompleted) {
        const seenZ2 = await AsyncStorage.getItem('seen_unlocked_z2');
        if (!seenZ2) {
          setUnlockingZoneTitle('Zona 2');
          await AsyncStorage.setItem('seen_unlocked_z2', 'true');
          return;
        }
      }
      if (zone2BossCompleted) {
        const seenZ3 = await AsyncStorage.getItem('seen_unlocked_z3');
        if (!seenZ3) {
          setUnlockingZoneTitle('Zona 3');
          await AsyncStorage.setItem('seen_unlocked_z3', 'true');
        }
      }
    };
    checkZoneUnlocks();
  }, [zone1BossCompleted, zone2BossCompleted]);

  // Welcome modal logic
  useEffect(() => {
    const checkWelcome = async () => {
      try {
        const value = await AsyncStorage.getItem('lectorapp_has_seen_welcome');
        const isNewUser = (!profile || profile.xp === 0) && completed.length === 0;
        
        if (!value && isNewUser) {
          setShowWelcome(true);
        } else if (!value) {
          await AsyncStorage.setItem('lectorapp_has_seen_welcome', 'true');
        }
      } catch (err) {
        console.warn('Error reading AsyncStorage welcome key:', err);
      }
    };
    checkWelcome();
  }, [profile, completed]);

  const handleCloseWelcome = async () => {
    setShowWelcome(false);
    try {
      await AsyncStorage.setItem('lectorapp_has_seen_welcome', 'true');
    } catch (err) {
      console.warn('Error saving AsyncStorage welcome key:', err);
    }
  };

  const handlePressChest = (node: ZoneNode) => {
    setActiveChestNode(node);
  };

  const handleClaimChest = async () => {
    if (!activeChestNode) return;
    if (completed.includes(activeChestNode.id)) return;
    await addXP(50);
    await completeNode(activeChestNode.id);
  };

  const handleClaimDailyReward = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const success = await claimReward();
    if (success) {
      setShowConfetti(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ruta de aprendizaje</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {profile && (
            <View style={styles.xpBadge}>
              <Ionicons name="flash" size={13} color="#78350F" />
              <Text style={styles.xpText}>{profile.xp} XP</Text>
            </View>
          )}
          <Pressable onPress={() => setShowNotifications(true)} hitSlop={8} style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.ink} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Daily Mission Banner has been migrated to NotificationCenter */}

        {/* Botón Calentamiento Rápido */}
        <Pressable
          onPress={() => {
            const suggested = selectWarmupExercises(all);
            if (suggested && suggested.length > 0) {
              const firstExId = suggested[0];
              const exMeta = EXERCISES[firstExId];
              Alert.alert(
                '⚡ Calentamiento rápido listo',
                `¡Tu cerebro necesita entrenar la destreza de [${exMeta?.category}] hoy!\n\nIniciando ${exMeta?.title}...`,
                [
                  {
                    text: '¡Vamos!',
                    onPress: () => router.push({ pathname: `/exercise/${firstExId}` as any, params: { mode: 'free' } })
                  },
                  {
                    text: 'Cancelar',
                    style: 'cancel'
                  }
                ]
              );
            } else {
              Alert.alert('Calentamiento', '¡Tu cerebro está al 100% hoy! No se requieren recomendaciones.');
            }
          }}
          style={({ pressed }) => [
            styles.warmupBannerCard,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}
        >
          <LinearGradient
            colors={['#EF4444', '#F97316']}
            style={styles.warmupBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.warmupBannerTitle}>⚡ Calentamiento Rápido (5 min)</Text>
              <Text style={styles.warmupBannerSub}>
                Entrena tus áreas cognitivas más frías al instante con recomendaciones personalizadas.
              </Text>
            </View>
            <Ionicons name="flash" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        {ZONES.map((zone, zi) => (
          <ZoneSection
            key={zone.title}
            zone={zone}
            completed={completed}
            scrollOffset={scrollOffset}
            zoneForceUnlocked={
              zi === 0 ? true :
              zi === 1 ? zone1BossCompleted :
              zone2BossCompleted
            }
            unlockingZoneTitle={unlockingZoneTitle}
            onAnimationEnd={() => setUnlockingZoneTitle(null)}
            onPressChest={handlePressChest}
            onPressExercise={(node) => setActiveExerciseNode(node)}
          />
        ))}

        {/* Asistente Conversacional Mente IA */}
        <AIChatbot mode="embedded" />

        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* Interactive Chest Reward Modal */}
      <ChestModal
        node={activeChestNode}
        onClose={() => setActiveChestNode(null)}
        onClaim={handleClaimChest}
        completed={completed}
      />

      {/* Exercise Preview Bottom Sheet */}
      <ExercisePreviewSheet
        node={activeExerciseNode}
        onClose={() => setActiveExerciseNode(null)}
      />

      {/* Welcome Modal for New Users */}
      <WelcomeModal visible={showWelcome} onClose={handleCloseWelcome} />

      {/* Notification Center Bottom Sheet */}
      {showNotifications && (
        <NotificationCenter visible={showNotifications} onClose={() => setShowNotifications(false)} />
      )}

      {/* Confetti Overlay */}
      {showConfetti && (
        <ConfettiOverlay onAnimationEnd={() => setShowConfetti(false)} />
      )}
    </SafeAreaView>
  );
}

// ─── ZONE SECTION WITH GENTLE SHAKE LOCK & LOCK OVERLAY ─────────────────────────
function ZoneSection({
  zone, completed, scrollOffset, zoneForceUnlocked, unlockingZoneTitle, onAnimationEnd, onPressChest, onPressExercise,
}: {
  zone: typeof ZONES[0];
  completed: string[];
  scrollOffset: SharedValue<number>;
  zoneForceUnlocked: boolean;
  unlockingZoneTitle: string | null;
  onAnimationEnd: () => void;
  onPressChest: (node: ZoneNode) => void;
  onPressExercise: (node: ZoneNode) => void;
}) {
  const trailPath = buildTrail(zone.nodes);
  const svgH = zone.nodes.length * ROW + 110;

  const currentIdx = zoneForceUnlocked
    ? zone.nodes.findIndex((n, i) => {
        const locked = resolveNodeLocked(zone.nodes, i, completed, true);
        return !locked && !completed.includes(n.id);
      })
    : -1;

  const equippedBackground = useRewardsStore(s => s.equipped.background);

  // Background choices
  let bgColors: readonly [string, string, ...string[]] =
    zone.title === 'Zona 1' ? ['#022C22', '#064E3B'] :
    zone.title === 'Zona 2' ? ['#0A0E1A', '#1E1B4B'] :
    ['#020617', '#0F172A'];

  if (equippedBackground === 'bg-cafe') {
    bgColors = ['#2E1005', '#451A03'];
  } else if (equippedBackground === 'bg-library') {
    bgColors = ['#1C1917', '#292524'];
  } else if (equippedBackground === 'bg-forest') {
    bgColors = ['#022C22', '#064E3B'];
  } else if (equippedBackground === 'bg-space') {
    bgColors = ['#030712', '#0F172A'];
  }

  const renderBackdrop = () => {
    const activeBg = equippedBackground || (
      zone.title === 'Zona 1' ? 'bg-forest' :
      zone.title === 'Zona 2' ? 'bg-space' :
      'bg-cyber'
    );

    if (activeBg === 'bg-forest') return <ForestBackdrop scrollOffset={scrollOffset} />;
    if (activeBg === 'bg-space') return <CosmosBackdrop scrollOffset={scrollOffset} />;
    if (activeBg === 'bg-cafe') return <CafeRainBackdrop scrollOffset={scrollOffset} />;
    if (activeBg === 'bg-library') return <LibraryBackdrop scrollOffset={scrollOffset} />;
    return <CyberBackdrop scrollOffset={scrollOffset} />;
  };

  // Shared value for active path dashed connector animation
  const flowOffset = useSharedValue(0);

  useEffect(() => {
    if (zoneForceUnlocked) {
      flowOffset.value = withRepeat(
        withTiming(-14, { duration: 1000, easing: (t) => t }),
        -1,
        false
      );
    }
  }, [zoneForceUnlocked]);

  const animatedFlowProps = useAnimatedProps(() => ({
    strokeDashoffset: flowOffset.value,
  }));

  // Lock animation states if unlocking now
  const isUnlockingNow = zone.title === unlockingZoneTitle;
  const overlayOpacity = useSharedValue(1);
  const lockScale = useSharedValue(1);
  const lockOpacity = useSharedValue(1);
  const lockShakeX = useSharedValue(0);
  const unlockTextScale = useSharedValue(0);
  const [animatingUnlock, setAnimatingUnlock] = React.useState(isUnlockingNow);

  const isZoneCompleted = 
    zone.title === 'Zona 1' ? completed.includes('z1_boss') :
    zone.title === 'Zona 2' ? completed.includes('z2_boss') :
    completed.includes('z3_boss');

  const initialCollapsed = !zoneForceUnlocked || isZoneCompleted;
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const heightAnim = useSharedValue(initialCollapsed ? 0 : Math.min(380, svgH));

  useEffect(() => {
    if (isUnlockingNow) {
      setCollapsed(false);
      heightAnim.value = withTiming(Math.min(380, svgH), { duration: 1000 });
    }
  }, [isUnlockingNow]);

  const toggleCollapse = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    heightAnim.value = withTiming(nextCollapsed ? 0 : Math.min(380, svgH), { duration: 300 });
  };

  const animatedContentStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
    opacity: withTiming(heightAnim.value === 0 ? 0 : 1, { duration: 250 }),
    overflow: 'hidden',
  }));

  const padlockStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: lockScale.value },
      { translateX: lockShakeX.value },
    ],
    opacity: lockOpacity.value,
  }));

  const textAlertStyle = useAnimatedStyle(() => ({
    transform: [{ scale: unlockTextScale.value }],
  }));

  return (
    <LinearGradient colors={bgColors} style={styles.zoneCard}>
      {renderBackdrop()}

      {/* Zone header banner */}
      <Pressable 
        onPress={toggleCollapse}
        style={({ pressed }) => [
          styles.zoneBanner, 
          { backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }
        ]}
      >
        <View style={styles.zoneBannerLeft}>
          <Text style={[styles.zoneTitle, { color: '#fff' }]}>{zone.title}</Text>
          <View style={styles.zoneSubRow}>
            {!zoneForceUnlocked && (
              <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.zoneSub, { color: 'rgba(255, 255, 255, 0.8)' }]}>{zone.subtitle}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.zoneMascotWrap}>
            <MascotChar
              which={zone.mascot}
              size={52}
              breathing={zoneForceUnlocked && !collapsed}
              blinking={zoneForceUnlocked && !collapsed}
            />
          </View>
          {zoneForceUnlocked && (
            <Ionicons 
              name={collapsed ? "chevron-down-outline" : "chevron-up-outline"} 
              size={20} 
              color="rgba(255, 255, 255, 0.7)" 
            />
          )}
        </View>
      </Pressable>

      {/* SVG trail + nodes */}
      <Animated.View style={animatedContentStyle}>
        <ScrollView
          style={{ height: '100%', width: '100%' }}
          contentContainerStyle={{ height: svgH }}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={true}
        >
          <View style={[styles.trailContainer, { height: svgH }]}>
            <Svg width={W} height={svgH} style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Subtle baseline locked trail */}
              <Path d={trailPath} stroke="rgba(255,255,255,0.06)" strokeWidth={4} fill="none" strokeDasharray="6 4" />

              {/* Dynamic segments with custom neon glow and animated dashes */}
              {zone.nodes.map((node, i) => {
                if (i === 0) return null;
                const prevNode = zone.nodes[i - 1];
                const currNode = zone.nodes[i];

                // Math coordinates for identical curve
                const x1 = SIDE_X[prevNode.side];
                const y1 = START_Y + (i - 1) * ROW;
                const x2 = SIDE_X[currNode.side];
                const y2 = START_Y + i * ROW;
                const cy = (y1 + y2) / 2;
                const midpointX = (x1 + x2) / 2;

                // Q bezier segment string
                const segmentD = `M ${x1} ${y1} Q ${x1} ${cy} ${midpointX} ${cy} Q ${x2} ${cy} ${x2} ${y2}`;

                const prevCompleted = completed.includes(prevNode.id);
                const currCompleted = completed.includes(currNode.id);
                
                // Traversed path is completed if destination node is completed
                const isCompleted = currCompleted;

                // Active path is the segment currently being traveled (prev completed, destination unlocked & not completed)
                const currLocked = resolveNodeLocked(zone.nodes, i, completed, zoneForceUnlocked);
                const isActive = prevCompleted && !currCompleted && !currLocked;

                if (isCompleted) {
                  return (
                    <React.Fragment key={`seg_${node.id}`}>
                      {/* Neon Glow underlay */}
                      <Path
                        d={segmentD}
                        stroke={zone.color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        fill="none"
                        opacity={0.3}
                      />
                      {/* Neon solid core */}
                      <Path
                        d={segmentD}
                        stroke={zone.color}
                        strokeWidth={3}
                        strokeLinecap="round"
                        fill="none"
                      />
                    </React.Fragment>
                  );
                } else if (isActive) {
                  return (
                    <React.Fragment key={`seg_${node.id}`}>
                      {/* Active segment dim glow */}
                      <Path
                        d={segmentD}
                        stroke={zone.color}
                        strokeWidth={8}
                        strokeLinecap="round"
                        fill="none"
                        opacity={0.12}
                      />
                      {/* Flowing animated dashes core */}
                      <AnimatedPath
                        d={segmentD}
                        stroke={zone.color}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="8 6"
                        animatedProps={animatedFlowProps}
                      />
                    </React.Fragment>
                  );
                }
                return null; // Locked segments only render the background trail
              })}
            </Svg>

            {zone.nodes.map((node, idx) => {
              const nodeLocked = resolveNodeLocked(zone.nodes, idx, completed, zoneForceUnlocked);
              const isCompleted = completed.includes(node.id);
              return (
                <NodeButton
                  key={node.id}
                  node={{ ...node, locked: nodeLocked }}
                  x={SIDE_X[node.side]}
                  y={START_Y + idx * ROW}
                  current={idx === currentIdx}
                  isCompleted={isCompleted}
                  onPressChest={onPressChest}
                  onPressExercise={onPressExercise}
                />
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Absolute Shaking Lock Overlay */}
      {(!zoneForceUnlocked || animatingUnlock) && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.lockOverlay, lockOverlayStyle]}>
          <BlurView intensity={16} style={StyleSheet.absoluteFill} tint="dark" />
          <Animated.View style={[styles.lockCenterCircle, padlockStyle]}>
            <Ionicons name="lock-closed" size={32} color="#FBBF24" />
          </Animated.View>
          <Text style={styles.lockOverlayText}>Zona Bloqueada</Text>
          <Text style={styles.lockOverlaySub}>Completa la zona anterior para desbloquear</Text>

          {animatingUnlock && (
            <Animated.View style={[styles.unlockAlertBox, textAlertStyle]}>
              <Text style={styles.unlockAlertText}>¡NUEVA ZONA DESBLOQUEADA!</Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </LinearGradient>
  );
}

// ─── NODE BUTTON WITH SPRING SCALE ON COMPLETE ──────────────────────────────────
function NodeButton({
  node, x, y, current, isCompleted, onPressChest, onPressExercise,
}: {
  node: ZoneNode; x: number; y: number; current: boolean; isCompleted: boolean;
  onPressChest: (node: ZoneNode) => void;
  onPressExercise: (node: ZoneNode) => void;
}) {
  const scale = useSharedValue(1);
  const haloScale   = useSharedValue(1);
  const haloOpacity = useSharedValue(0.24);

  // Elastic Spring for complete checkmark scaling
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  useEffect(() => {
    if (!current) return;
    haloScale.value   = withRepeat(withSequence(withTiming(1.22, { duration: 900 }), withTiming(1, { duration: 900 })), -1, false);
    haloOpacity.value = withRepeat(withSequence(withTiming(0.08, { duration: 900 }), withTiming(0.24, { duration: 900 })), -1, false);
  }, [current]);

  useEffect(() => {
    if (isCompleted) {
      checkScale.value = withSpring(1.0, { damping: 7, stiffness: 120 });
    } else {
      checkScale.value = 0;
    }
  }, [isCompleted]);

  const haloStyle = useAnimatedStyle(() => ({
    transform:  [{ scale: haloScale.value }],
    opacity:    haloOpacity.value,
  }));

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const onPress = () => {
    if (node.locked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    if (node.kind === 'lesson') {
      router.push(`/lesson/${node.id}` as Parameters<typeof router.push>[0]);
    } else if (node.kind === 'chest') {
      onPressChest(node);
    } else if (node.exId) {
      // Tap active exercise triggers bottom sheet preview instead of immediate route
      onPressExercise(node);
    }
  };

  const RADIUS = node.kind === 'boss' ? 42 : node.kind === 'chest' ? 36 : 34;
  const iconSize = node.kind === 'boss' ? 24 : node.kind === 'chest' ? 22 : 20;

  const nodeInner = () => {
    if (node.locked) {
      return <Ionicons name="lock-closed" size={iconSize} color="rgba(255,255,255,0.3)" />;
    }
    if (isCompleted) {
      return (
        <Animated.View style={checkAnimatedStyle}>
          <Ionicons name="checkmark" size={iconSize + 2} color="#fff" />
        </Animated.View>
      );
    }
    if (node.kind === 'boss') {
      return <MascotChar which="boss" size={40} breathing={false} blinking={false} />;
    }
    if (node.kind === 'exercise' && node.exId && EX_MASCOT[node.exId]) {
      return <MascotChar which={EX_MASCOT[node.exId]} size={36} breathing={false} blinking={false} />;
    }
    if (node.kind === 'lesson') {
      return <Ionicons name="book-outline" size={iconSize} color="#fff" />;
    }
    if (node.kind === 'chest') {
      return <Ionicons name="gift-outline" size={iconSize} color="#fff" />;
    }
    return <Ionicons name="flash" size={iconSize} color="#fff" />;
  };

  const nodeBg = node.locked
    ? 'rgba(255,255,255,0.06)'
    : isCompleted
      ? '#10B981' // Solid complete green
      : node.color;

  const nodeBorder = isCompleted
    ? '#059669'
    : node.locked
      ? 'rgba(255,255,255,0.12)'
      : darken(node.color, 0.15);

  return (
    <Pressable
      style={{ position: 'absolute', left: x - RADIUS, top: y - RADIUS }}
      onPressIn={() => { scale.value = withTiming(0.9, { duration: 80 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 6, stiffness: 300 }); }}
      onPress={onPress}
      disabled={node.locked}
    >
      {/* Pulse halo for current node */}
      {current && (
        <Animated.View style={[{
          position: 'absolute',
          width: RADIUS * 2, height: RADIUS * 2, borderRadius: RADIUS,
          backgroundColor: node.color,
        }, haloStyle]} />
      )}
      <Animated.View style={[{
        width: RADIUS * 2, height: RADIUS * 2, borderRadius: RADIUS,
        backgroundColor: nodeBg,
        borderWidth: 3,
        borderColor: nodeBorder,
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: node.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: node.locked ? 0 : 0.4,
        shadowRadius: 8,
        elevation: node.locked ? 0 : 5,
      }, nodeStyle]}>
        {nodeInner()}
      </Animated.View>
      <Text style={[styles.nodeLabel, { color: node.locked ? 'rgba(255,255,255,0.36)' : '#fff', width: RADIUS * 2, textAlign: 'center' }]}
        numberOfLines={2}>
        {node.label}
      </Text>
    </Pressable>
  );
}

// ─── CHEST REWARD MODAL COMPONENT ────────────────────────────────────────────
function ChestModal({ node, onClose, onClaim, completed }: {
  node: ZoneNode | null;
  onClose: () => void;
  onClaim: () => void;
  completed: string[];
}) {
  const [chestState, setChestState] = React.useState<'closed' | 'opened'>('closed');
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const giftRotate = useSharedValue(0);

  const isAlreadyCompleted = node ? completed.includes(node.id) : false;

  useEffect(() => {
    if (node) {
      const alreadyClaimed = completed.includes(node.id);
      setChestState(alreadyClaimed ? 'opened' : 'closed');
      scale.value = 0.9;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withTiming(1, { duration: 300 });
      if (!alreadyClaimed) {
        giftRotate.value = withRepeat(
          withSequence(withTiming(-5, { duration: 150 }), withTiming(5, { duration: 150 })),
          6,
          true
        );
      } else {
        giftRotate.value = 0;
      }
    }
  }, [node, completed]);

  if (!node) return null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const giftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${giftRotate.value}deg` },
      { scale: chestState === 'opened' ? withSpring(1.2) : withSpring(1) }
    ],
  }));

  const handleOpen = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setChestState('opened');
    onClaim();
  };

  const getTip = () => {
    if (node.id.includes('z1')) {
      return {
        title: 'Ampliación Periférica',
        hack: '¡TRUCO DE ENFOQUE PERIFÉRICO!\n\nNo mires directamente los márgenes del texto. Mantén tu mirada un centímetro hacia adentro de cada borde y deja que tu visión periférica capture las palabras extremas sin esfuerzo.'
      };
    }
    if (node.id.includes('z2')) {
      return {
        title: 'Anclaje Espacial',
        hack: '¡TRUCO DE MEMORIA LOCI!\n\nAsocia los conceptos difíciles con muebles llamativos de tu propia habitación o casa real. Imagínalos encendidos en fuego o bailando; ¡lo absurdo es inolvidable!'
      };
    }
    return {
      title: 'Lectura Rítmica',
      hack: '¡TRUCO DE RITMO SEMÁNTICO!\n\nDesliza tu marcador visual de forma rítmica constante sin detenerte. Tus ojos aprenderán a saltar automáticamente en bloques, en vez de sílaba por sílaba.'
    };
  };

  const tip = getTip();

  return (
    <Modal transparent visible={!!node} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
        <Animated.View style={[styles.chestCard, animatedStyle]}>
          <Text style={styles.chestHeader}>REGALO NEURONAL</Text>
          <Text style={styles.chestSubtitle}>Zona {node.id.includes('z1') ? '1' : node.id.includes('z2') ? '2' : '3'}</Text>
          
          <Animated.View style={[styles.giftIconWrap, giftAnimatedStyle]}>
            <Ionicons 
              name={chestState === 'opened' ? 'gift' : 'gift-outline'} 
              size={110} 
              color={chestState === 'opened' ? '#FBBF24' : '#EAB308'} 
            />
          </Animated.View>

          {chestState === 'closed' ? (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={styles.chestPrompt}>¡Has encontrado un cofre secreto en tu camino de aprendizaje!</Text>
              <Pressable style={styles.openChestBtn} onPress={handleOpen}>
                <Text style={styles.openChestText}>Abrir Cofre</Text>
                <Ionicons name="key" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: 'center', width: '100%' }}>
              <View style={styles.xpRewardBadge}>
                <Ionicons name={isAlreadyCompleted ? "checkmark-circle" : "flash"} size={20} color="#78350F" style={{ marginRight: 4 }} />
                <Text style={styles.xpRewardText}>{isAlreadyCompleted ? "Reclamado" : "+50 XP"}</Text>
              </View>

              <Text style={styles.chestTipTitle}>{tip.title}</Text>
              <View style={styles.chestTipBox}>
                <Text style={styles.chestTipText}>{tip.hack}</Text>
              </View>

              <Pressable style={styles.closeChestBtn} onPress={onClose}>
                <Text style={styles.closeChestText}>{isAlreadyCompleted ? "Cerrar" : "Reclamar y Continuar"}</Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── INTERACTIVE PREVIEW BOTTOM SHEET ──────────────────────────────────────────
function ExercisePreviewSheet({
  node, onClose,
}: {
  node: ZoneNode | null;
  onClose: () => void;
}) {
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (node) {
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
  }, [node]);

  if (!node || !node.exId) return null;

  const data = EX_METRICS[node.exId];
  if (!data) return null;

  // Retrieve best records from Zustand store
  const bestRecord = useProgressStore.getState().get(node.exId);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onClose();
    router.push(`/exercise/${node.exId}?nodeId=${node.id}` as Parameters<typeof router.push>[0]);
  };

  const getRecordLabel = () => {
    if (node.exId === 'schulte') {
      return bestRecord.best_score > 0 ? `${(bestRecord.best_score * 100).toFixed(0)}% Acierto` : 'Ninguno';
    }
    if (node.exId === 'reading') {
      return bestRecord.best_score > 0 ? `${(bestRecord.best_score * 500).toFixed(0)} WPM` : 'Ninguno';
    }
    if (node.exId === 'wordspan') {
      return bestRecord.best_score > 0 ? `${(bestRecord.best_score * 10).toFixed(0)} Palabras` : 'Ninguno';
    }
    if (node.exId === 'loci') {
      return bestRecord.best_score > 0 ? `${(bestRecord.best_score * 100).toFixed(0)}% Precisión` : 'Ninguno';
    }
    return bestRecord.best_score > 0 ? `${(bestRecord.best_score * 100).toFixed(0)}%` : 'Ninguno';
  };

  return (
    <Modal transparent visible={!!node} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.bottomSheet, { backgroundColor: COLORS.canvas }, sheetAnimatedStyle]}>
          <View style={styles.bottomSheetHandle} />
          
          <View style={styles.previewHeader}>
            <View style={[styles.previewIconCircle, { backgroundColor: node.color }]}>
              <MascotChar which={EX_MASCOT[node.exId] || 'focus'} size={48} breathing={false} blinking={false} />
            </View>
            <View style={styles.previewTitleBox}>
              <Text style={styles.previewExType}>EJERCICIO COGNITIVO</Text>
              <Text style={styles.previewTitle}>{data.title}</Text>
            </View>
          </View>

          <Text style={styles.previewDesc}>{data.desc}</Text>

          <View style={styles.previewStatsGrid}>
            <View style={styles.previewStatCard}>
              <Ionicons name="trophy-outline" size={18} color="#D97706" />
              <Text style={styles.previewStatLabel}>Récord Personal</Text>
              <Text style={styles.previewStatVal}>{getRecordLabel()}</Text>
            </View>
            <View style={styles.previewStatCard}>
              <Ionicons name="trending-up-outline" size={18} color="#10B981" />
              <Text style={styles.previewStatLabel}>Dominio Total</Text>
              <Text style={styles.previewStatVal}>{(bestRecord.mastery * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.previewStatCard}>
              <Ionicons name="barbell-outline" size={18} color="#8B5CF6" />
              <Text style={styles.previewStatLabel}>Sesiones</Text>
              <Text style={styles.previewStatVal}>{bestRecord.total_sessions}</Text>
            </View>
          </View>

          <Text style={styles.previewSectionTitle}>Habilidades Potenciadas</Text>
          <View style={styles.previewSkillsWrap}>
            {data.skills.map((s, idx) => (
              <View key={idx} style={styles.previewSkillBadge}>
                <Ionicons name="flash-outline" size={12} color={node.color} />
                <Text style={styles.previewSkillText}>{s}</Text>
              </View>
            ))}
          </View>

          <Pressable style={[styles.previewStartBtn, { backgroundColor: node.color }]} onPress={handleStart}>
            <Text style={styles.previewStartText}>Comenzar Entrenamiento</Text>
            <Ionicons name="play" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </Pressable>

          {node.exId === 'loci' && (
            <Pressable 
              style={[styles.customLociButton, { borderColor: node.color + '40' }]} 
              onPress={() => { onClose(); router.push('/loci/view' as any); }}
            >
              <Ionicons name="images-outline" size={16} color={node.color} />
              <Text style={[styles.customLociText, { color: node.color }]}>Galería y Creador de Palacios</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── WELCOME MODAL COMPONENT (FOR NEW USERS) ──────────────────────────────────
function WelcomeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const mascotBounce = useSharedValue(0);
  const mascotRotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = 0.9;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 14, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 400 });
      
      mascotBounce.value = withRepeat(
        withSequence(
          withSpring(-14, { damping: 10, stiffness: 80 }),
          withSpring(0, { damping: 10, stiffness: 80 })
        ),
        -1,
        true
      );
      mascotRotate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 800 }),
          withTiming(4, { duration: 1600 }),
          withTiming(0, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  if (!visible) return null;

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: mascotBounce.value },
      { rotate: `${mascotRotate.value}deg` }
    ],
  }));

  const handleDismiss = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={50} style={StyleSheet.absoluteFill} tint="dark" />
        <Animated.View style={[styles.welcomeCard, cardStyle, { paddingTop: 40 }]}>
          
          <Animated.View style={[styles.welcomeMascotWrap, mascotStyle, { marginBottom: 20 }]}>
            <MascotChar which="focus" size={120} expression="wow" />
          </Animated.View>

          <Text style={styles.welcomeHeader}>¡HOLA, EXPLORADOR!</Text>
          <Text style={[styles.welcomeTitle, { fontSize: 16, paddingHorizontal: 12, lineHeight: 22, marginTop: 10, textAlign: 'center', color: COLORS.ink }]}>
            Vamos a entrenar tu cerebro para leer el <Text style={{ color: '#10B981', fontFamily: FONTS.headingBold }}>doble de rápido</Text>, comprender al máximo y enfocar tu atención en un viaje divertido.
          </Text>

          <View style={{ height: 24 }} />

          <Pressable style={[styles.welcomeBtn, { marginTop: 10 }]} onPress={handleDismiss}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.welcomeBtnText}>¡Comenzar Entrenamiento!</Text>
            <Ionicons name="rocket-outline" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.canvas },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle:    { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink },
  notifBadge:     { position: 'absolute', top: -3, right: -3, backgroundColor: '#EF4444', borderRadius: 999, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, borderWidth: 1.5, borderColor: COLORS.canvas },
  notifBadgeText: { color: '#FFF', fontSize: 8, fontFamily: FONTS.headingBold, lineHeight: 12 },
  xpBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  xpText:         { fontFamily: FONTS.heading, fontSize: 13, color: '#78350F' },
  scroll:         { paddingTop: 10, alignItems: 'center' },
  zoneCard:       { width: W, borderRadius: 24, padding: 16, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8, position: 'relative' },
  zoneBanner:     { borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', zIndex: 2 },
  zoneBannerLeft: { flex: 1, justifyContent: 'center' },
  zoneSubRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  zoneTitle:      { fontFamily: FONTS.heading, fontSize: 16 },
  zoneSub:        { fontFamily: FONTS.body, fontSize: 13 },
  zoneMascotWrap: { marginRight: -6, marginVertical: -6, opacity: 0.95 },
  trailContainer: { width: W - 32, position: 'relative', alignSelf: 'center', zIndex: 2 },
  nodeLabel:      { fontFamily: FONTS.headingSemi, fontSize: 10, marginTop: 4, letterSpacing: 0.2 },

  // Locked Zone overlay styles
  lockOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  lockCenterCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  lockOverlayText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: '#fff',
    letterSpacing: 0.5,
  },
  lockOverlaySub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  unlockAlertBox: {
    position: 'absolute',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.focus,
    borderWidth: 1.5,
    borderColor: '#34D399',
    bottom: 40,
    shadowColor: COLORS.focus,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  unlockAlertText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: '#fff',
    letterSpacing: 1.5,
  },

  // Daily goal / Mission card styles
  missionCardOuter: {
    width: W,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  missionGradient: {
    padding: 18,
  },
  missionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  missionTitleBox: {
    flex: 1,
    paddingRight: 12,
  },
  missionPreTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: '#A78BFA',
    letterSpacing: 1,
  },
  missionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: '#fff',
    marginTop: 4,
    lineHeight: 20,
  },
  missionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  missionBadgeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: '#FBBF24',
  },
  missionProgressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  missionProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 99,
    overflow: 'hidden',
  },
  missionProgressBar: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 99,
  },
  missionProgressText: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: '#A78BFA',
    minWidth: 32,
    textAlign: 'right',
  },
  missionClaimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  missionClaimedText: {
    fontFamily: FONTS.heading,
    fontSize: 12,
    color: '#34D399',
  },
  missionClaimBtn: {
    marginTop: 14,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  missionClaimBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: '#fff',
  },
  missionHintText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 8,
    textAlign: 'center',
  },

  // Interactive Bottom Sheet Preview Modal styles
  bottomSheet: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bottomSheetHandle: {
    width: 48,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  previewTitleBox: {
    flex: 1,
  },
  previewExType: {
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  previewTitle: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: '#1E293B',
    marginTop: 2,
  },
  previewDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20.5,
    marginTop: 18,
  },
  previewStatsGrid: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  previewStatCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
  },
  previewStatLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  previewStatVal: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: '#1E293B',
    marginTop: 2,
  },
  previewSectionTitle: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: '#1E293B',
    marginTop: 24,
  },
  previewSkillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  previewSkillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewSkillText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#475569',
  },
  previewStartBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  previewStartText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#fff',
  },
  customLociButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#fff',
  },
  customLociText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
  },

  // Modal overlay common
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  chestCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  chestHeader: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: '#1E293B',
    letterSpacing: 1,
  },
  chestSubtitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.loci,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  giftIconWrap: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chestPrompt: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  openChestBtn: {
    backgroundColor: '#EAB308',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    shadowColor: '#EAB308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  openChestText: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: '#fff',
  },
  xpRewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  xpRewardText: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: '#78350F',
  },
  chestTipTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 8,
  },
  chestTipBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  chestTipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    textAlign: 'center',
  },
  closeChestBtn: {
    backgroundColor: COLORS.ink,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  closeChestText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: '#fff',
  },

  // Welcome Modal styles
  welcomeCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  welcomeBannerDecor: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 12,
  },
  welcomeMascotWrap: {
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  welcomeHeader: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: '#10B981',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  welcomeDivider: {
    width: 48,
    height: 3,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    marginVertical: 16,
  },
  welcomeBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18.5,
    marginBottom: 20,
  },
  welcomeHighlights: {
    width: '100%',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  welcomeHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  welcomeHighlightText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  welcomeBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#fff',
    zIndex: 1,
  },
  warmupBannerCard: {
    width: W,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 20,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  warmupBannerGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warmupBannerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 4,
  },
  warmupBannerSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
});
