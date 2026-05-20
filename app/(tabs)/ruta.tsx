import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileStore } from '../../store/useProfileStore';
import { useNodeStore } from '../../store/useNodeStore';
import { useRewardsStore } from '../../store/useRewardsStore';
import { COLORS, darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { MascotChar, MascotKey } from '../../components/ui/MascotChar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const W    = Math.min(Dimensions.get('window').width, 520) - 40;
const ROW  = 120;
const HALF = W / 2;

const SIDE_X = { left: HALF - 80, center: HALF, right: HALF + 80 };

type NodeSide = 'left' | 'center' | 'right';
type NodeKind = 'lesson' | 'exercise' | 'chest' | 'boss';

interface ZoneNode {
  id:      string;
  kind:    NodeKind;
  side:    NodeSide;
  label:   string;
  exId?:   string;
  color:   string;
  locked?: boolean;
}

const ZONES: { title: string; subtitle: string; color: string; mascot: MascotKey; locked?: boolean; nodes: ZoneNode[] }[] = [
  {
    title: 'Zona 1', subtitle: 'Enfoque',
    color: COLORS.focus, mascot: 'focus',
    nodes: [
      { id: 'z1_lesson', kind: 'lesson',   side: 'center', label: 'Lección',       color: COLORS.focus },
      { id: 'z1_s1',     kind: 'exercise', side: 'left',   label: 'Schulte 3×3',   color: COLORS.focus, exId: 'schulte' },
      { id: 'z1_s2',     kind: 'exercise', side: 'right',  label: 'Schulte 4×4',   color: COLORS.focus, exId: 'schulte' },
      { id: 'z1_chest',  kind: 'chest',    side: 'center', label: 'Cofre',          color: '#EAB308' },
      { id: 'z1_focal',  kind: 'exercise', side: 'left',   label: 'Lectura focal',  color: COLORS.swift, exId: 'reading' },
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
    title: 'Zona 3', subtitle: 'Velocidad',
    color: COLORS.swift, mascot: 'swift',
    nodes: [
      { id: 'z3_lesson', kind: 'lesson',   side: 'center', label: 'Lección',        color: COLORS.swift },
      { id: 'z3_f1',     kind: 'exercise', side: 'left',   label: '400 WPM',        color: COLORS.swift, exId: 'reading' },
      { id: 'z3_chest',  kind: 'chest',    side: 'center', label: 'Cofre',           color: '#EAB308' },
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
};

const NODE_DEPENDENCIES: Record<string, string[][]> = {
  z1_lesson: [],
  z1_s1:     [['z1_lesson']],
  z1_s2:     [['z1_lesson']],
  z1_chest:  [['z1_s1'], ['z1_s2']],
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
  z3_f2:     [['z3_chest']],
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
  
  // A completed node is never locked
  if (completed.includes(node.id)) return false;

  const deps = NODE_DEPENDENCIES[node.id];
  if (!deps || deps.length === 0) return false;

  const isAnyClauseSatisfied = deps.some(clause =>
    clause.every(depId => completed.includes(depId))
  );

  return !isAnyClauseSatisfied;
}

function buildTrail(nodes: ZoneNode[]): string {
  const pts = nodes.map((n, i) => ({ x: SIDE_X[n.side], y: 26 + i * ROW }));
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

// ─── ANIMATED FOREST BACKDROP (ZONE 1) ──────────────────────────────────────
function ForestBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <FloatingLeaf left={30} top={80} />
      <FloatingLeaf left={W - 80} top={140} />
      <FloatingLeaf left={50} top={260} />
      <FloatingLeaf left={W - 90} top={380} />
      <FloatingLeaf left={120} top={480} />
      <FloatingLeaf left={W - 60} top={620} />
    </View>
  );
}

function FloatingLeaf({ left, top }: { left: number; top: number }) {
  const floatY = useSharedValue(0);
  const rot = useSharedValue(0);

  React.useEffect(() => {
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

// ─── ANIMATED COSMOS BACKDROP (ZONE 2) ──────────────────────────────────────
function CosmosBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <TwinklingStar left={40} top={60} />
      <TwinklingStar left={W - 80} top={120} />
      <TwinklingStar left={60} top={280} />
      <TwinklingStar left={W - 100} top={400} />
      <TwinklingStar left={140} top={520} />
      <TwinklingStar left={W - 60} top={640} />
    </View>
  );
}

function TwinklingStar({ left, top }: { left: number; top: number }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.2);

  React.useEffect(() => {
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

// ─── ANIMATED CYBER BACKDROP (ZONE 3) ───────────────────────────────────────
function CyberBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <SpeedLine left={40} />
      <SpeedLine left={130} />
      <SpeedLine left={W - 120} />
      <SpeedLine left={W - 50} />
    </View>
  );
}

function SpeedLine({ left }: { left: number }) {
  const floatY = useSharedValue(-200);

  React.useEffect(() => {
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

// ─── ANIMATED CAFE RAIN BACKDROP (bg-cafe) ──────────────────────────────────
function CafeRainBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <RainDrop left={40} speed={1500} delay={0} />
      <RainDrop left={110} speed={1800} delay={200} />
      <RainDrop left={W - 120} speed={1600} delay={400} />
      <RainDrop left={W - 40} speed={1400} delay={100} />
      <RainDrop left={70} speed={2000} delay={600} />
      <RainDrop left={W - 80} speed={1700} delay={800} />
    </View>
  );
}

function RainDrop({ left, speed, delay }: { left: number; speed: number; delay: number }) {
  const dropY = useSharedValue(-100);

  React.useEffect(() => {
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

// ─── ANIMATED LIBRARY BACKDROP (bg-library) ─────────────────────────────────
function LibraryBackdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <FloatingMote left={30} top={80} size={6} />
      <FloatingMote left={W - 70} top={150} size={8} />
      <FloatingMote left={50} top={290} size={5} />
      <FloatingMote left={W - 90} top={410} size={7} />
      <FloatingMote left={110} top={530} size={9} />
      <FloatingMote left={W - 50} top={650} size={6} />
    </View>
  );
}

function FloatingMote({ left, top, size }: { left: number; top: number; size: number }) {
  const floatY = useSharedValue(0);
  const driftX = useSharedValue(0);
  const opacity = useSharedValue(0.1);

  React.useEffect(() => {
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

  const [activeChestNode, setActiveChestNode] = React.useState<ZoneNode | null>(null);
  const [showWelcome, setShowWelcome] = React.useState(false);

  const zone1BossCompleted = completed.includes('z1_boss');
  const zone2BossCompleted = completed.includes('z2_boss');

  React.useEffect(() => {
    const checkWelcome = async () => {
      try {
        const value = await AsyncStorage.getItem('lectorapp_has_seen_welcome');
        // Un usuario es nuevo si tiene 0 XP (o no definido) y no ha completado ninguna lección/nodo
        const isNewUser = (!profile || profile.xp === 0) && completed.length === 0;
        
        if (!value && isNewUser) {
          setShowWelcome(true);
        } else if (!value) {
          // Si el usuario no es nuevo pero no tiene la marca, la guardamos silenciosamente para no molestarle
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ruta de aprendizaje</Text>
        {profile && (
          <View style={styles.xpBadge}>
            <Ionicons name="flash" size={13} color="#78350F" />
            <Text style={styles.xpText}>{profile.xp} XP</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {ZONES.map((zone, zi) => (
          <ZoneSection
            key={zone.title}
            zone={zone}
            completed={completed}
            zoneForceUnlocked={
              zi === 0 ? true :
              zi === 1 ? zone1BossCompleted :
              zone2BossCompleted
            }
            onPressChest={handlePressChest}
          />
        ))}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Interactive Chest Reward Modal */}
      <ChestModal
        node={activeChestNode}
        onClose={() => setActiveChestNode(null)}
        onClaim={handleClaimChest}
        completed={completed}
      />

      {/* Welcome Modal for New Users */}
      <WelcomeModal visible={showWelcome} onClose={handleCloseWelcome} />
    </SafeAreaView>
  );
}

function ZoneSection({ zone, completed, zoneForceUnlocked, onPressChest }: {
  zone: typeof ZONES[0];
  completed: string[];
  zoneForceUnlocked: boolean;
  onPressChest: (node: ZoneNode) => void;
}) {
  const trailPath = buildTrail(zone.nodes);
  const svgH = zone.nodes.length * ROW + 40;

  const zoneColor = zoneForceUnlocked ? zone.color : COLORS.border;

  const currentIdx = zoneForceUnlocked
    ? zone.nodes.findIndex((n, i) => {
        const locked = resolveNodeLocked(zone.nodes, i, completed, true);
        return !locked && !completed.includes(n.id);
      })
    : -1;

  const equippedBackground = useRewardsStore(s => s.equipped.background);

  // Rich Scenic Gradients
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

    if (activeBg === 'bg-forest') return <ForestBackdrop />;
    if (activeBg === 'bg-space') return <TwinklingStarBackdrop />; // TwinklingStar mapped
    if (activeBg === 'bg-cafe') return <CafeRainBackdrop />;
    if (activeBg === 'bg-library') return <LibraryBackdrop />;
    return <CyberBackdrop />;
  };

  // Fallback map stars
  function TwinklingStarBackdrop() {
    return <CosmosBackdrop />;
  }

  return (
    <LinearGradient colors={bgColors} style={styles.zoneCard}>
      {renderBackdrop()}

      {/* Zone header banner */}
      <View style={[styles.zoneBanner, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
        <View style={styles.zoneBannerLeft}>
          <Text style={[styles.zoneTitle, { color: '#fff' }]}>{zone.title}</Text>
          <View style={styles.zoneSubRow}>
            {!zoneForceUnlocked && (
              <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.5)" style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.zoneSub, { color: 'rgba(255, 255, 255, 0.8)' }]}>{zone.subtitle}</Text>
          </View>
        </View>
        <View style={styles.zoneMascotWrap}>
          <MascotChar
            which={zone.mascot}
            size={52}
            breathing={zoneForceUnlocked}
            blinking={zoneForceUnlocked}
          />
        </View>
      </View>

      {/* SVG trail + nodes */}
      <View style={[styles.trailContainer, { height: svgH }]}>
        <Svg width={W} height={svgH} style={{ position: 'absolute', top: 0, left: 0 }}>
          <Path d={trailPath} stroke="rgba(255,255,255,0.12)" strokeWidth={6} fill="none" strokeDasharray="8 6" />
          <Path d={trailPath} stroke={zoneForceUnlocked ? zone.color : 'rgba(255,255,255,0.15)'} strokeWidth={6} fill="none"
            strokeDasharray="60 100" strokeLinecap="round" />
        </Svg>

        {zone.nodes.map((node, idx) => {
          const nodeLocked = resolveNodeLocked(zone.nodes, idx, completed, zoneForceUnlocked);
          const isCompleted = completed.includes(node.id);
          return (
            <NodeButton
              key={node.id}
              node={{ ...node, locked: nodeLocked }}
              x={SIDE_X[node.side]}
              y={26 + idx * ROW}
              current={idx === currentIdx}
              isCompleted={isCompleted}
              onPressChest={onPressChest}
            />
          );
        })}
      </View>
    </LinearGradient>
  );
}

function NodeButton({
  node, x, y, current, isCompleted, onPressChest,
}: {
  node: ZoneNode; x: number; y: number; current: boolean; isCompleted: boolean;
  onPressChest: (node: ZoneNode) => void;
}) {
  const scale = useSharedValue(1);
  const haloScale   = useSharedValue(1);
  const haloOpacity = useSharedValue(0.24);

  React.useEffect(() => {
    if (!current) return;
    haloScale.value   = withRepeat(withSequence(withTiming(1.22, { duration: 900 }), withTiming(1, { duration: 900 })), -1, false);
    haloOpacity.value = withRepeat(withSequence(withTiming(0.08, { duration: 900 }), withTiming(0.24, { duration: 900 })), -1, false);
  }, [current]);

  const haloStyle = useAnimatedStyle(() => ({
    transform:  [{ scale: haloScale.value }],
    opacity:    haloOpacity.value,
  }));

  const nodeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPress = () => {
    if (node.locked) return;
    if (node.kind === 'lesson') {
      router.push(`/lesson/${node.id}` as Parameters<typeof router.push>[0]);
    } else if (node.kind === 'chest') {
      onPressChest(node);
    } else if (node.exId) {
      router.push(`/exercise/${node.exId}?nodeId=${node.id}` as Parameters<typeof router.push>[0]);
    }
  };

  const RADIUS = node.kind === 'boss' ? 38 : node.kind === 'chest' ? 32 : 30;
  const iconSize = node.kind === 'boss' ? 22 : 18;

  const nodeInner = () => {
    if (node.locked) {
      return <Ionicons name="lock-closed" size={iconSize} color="rgba(255,255,255,0.3)" />;
    }
    if (isCompleted) {
      return <Ionicons name="checkmark" size={iconSize + 2} color="#fff" />;
    }
    if (node.kind === 'boss') {
      return <MascotChar which="boss" size={36} breathing={false} blinking={false} />;
    }
    if (node.kind === 'exercise' && node.exId && EX_MASCOT[node.exId]) {
      return <MascotChar which={EX_MASCOT[node.exId]} size={32} breathing={false} blinking={false} />;
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
      ? darken(node.color, 0.08)
      : node.color;

  const nodeBorder = isCompleted
    ? '#22C55E'
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

  React.useEffect(() => {
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

// ─── WELCOME MODAL COMPONENT (FOR NEW USERS) ──────────────────────────────────
function WelcomeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const mascotBounce = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = 0.9;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 14, stiffness: 100 });
      opacity.value = withTiming(1, { duration: 400 });
      
      mascotBounce.value = withRepeat(
        withSequence(
          withTiming(-8, { duration: 800 }),
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
    transform: [{ translateY: mascotBounce.value }],
  }));

  const handleDismiss = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleDismiss}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />
        <Animated.View style={[styles.welcomeCard, cardStyle]}>
          {/* Top Decorative Spark */}
          <View style={styles.welcomeBannerDecor}>
            <LinearGradient
              colors={['#10B981', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* Animated Mascot wrapper */}
          <Animated.View style={[styles.welcomeMascotWrap, mascotStyle]}>
            <MascotChar which="focus" size={100} expression="happy" />
          </Animated.View>

          <Text style={styles.welcomeHeader}>¡BIENVENIDO!</Text>
          <Text style={styles.welcomeTitle}>Tu viaje neuro-cognitivo comienza hoy</Text>

          <View style={styles.welcomeDivider} />

          <Text style={styles.welcomeBody}>
            Entrena tu visión periférica, agudiza tu memoria y duplica tu velocidad de lectura.
          </Text>

          <View style={styles.welcomeHighlights}>
            <View style={styles.welcomeHighlightRow}>
              <Ionicons name="sparkles" size={16} color="#10B981" />
              <Text style={styles.welcomeHighlightText}>Ejercicios interactivos personalizados</Text>
            </View>
            <View style={styles.welcomeHighlightRow}>
              <Ionicons name="stats-chart" size={16} color="#3B82F6" />
              <Text style={styles.welcomeHighlightText}>Métricas de velocidad y progreso</Text>
            </View>
          </View>

          <Pressable style={styles.welcomeBtn} onPress={handleDismiss}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.welcomeBtnText}>Comenzar entrenamiento</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
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
  xpBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  xpText:         { fontFamily: FONTS.heading, fontSize: 13, color: '#78350F' },
  scroll:         { paddingTop: 8, alignItems: 'center' },
  zoneCard:       { width: W, borderRadius: 24, padding: 16, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  zoneBanner:     { borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  zoneBannerLeft: { flex: 1, justifyContent: 'center' },
  zoneSubRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  zoneTitle:      { fontFamily: FONTS.heading, fontSize: 16 },
  zoneSub:        { fontFamily: FONTS.body, fontSize: 13 },
  zoneMascotWrap: { marginRight: -6, marginVertical: -6, opacity: 0.95 },
  trailContainer: { width: W - 32, position: 'relative', alignSelf: 'center' },
  nodeLabel:      { fontFamily: FONTS.headingSemi, fontSize: 10, marginTop: 4, letterSpacing: 0.2 },

  // Chest Modal styles
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
});
