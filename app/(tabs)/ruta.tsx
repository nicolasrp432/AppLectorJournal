import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useProfileStore } from '../../store/useProfileStore';
import { useNodeStore } from '../../store/useNodeStore';
import { COLORS, darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { MascotChar, MascotKey } from '../../components/ui/MascotChar';

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

export default function RutaScreen() {
  const profile   = useProfileStore(s => s.profile);
  const addXP     = useProfileStore(s => s.addXP);
  const completed = useNodeStore(s => s.completed);
  const completeNode = useNodeStore(s => s.completeNode);

  const [activeChestNode, setActiveChestNode] = React.useState<ZoneNode | null>(null);

  const zone1BossCompleted = completed.includes('z1_boss');
  const zone2BossCompleted = completed.includes('z2_boss');

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

  return (
    <View style={styles.zoneSection}>
      {/* Zone header */}
      <View style={[styles.zoneBanner, { backgroundColor: zoneColor + '18', borderColor: zoneColor + '40' }]}>
        <View style={styles.zoneBannerLeft}>
          <Text style={[styles.zoneTitle, { color: zoneColor }]}>{zone.title}</Text>
          <View style={styles.zoneSubRow}>
            {!zoneForceUnlocked && (
              <Ionicons name="lock-closed" size={13} color={zoneColor} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.zoneSub, { color: zoneColor }]}>{zone.subtitle}</Text>
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
          <Path d={trailPath} stroke={zone.color + '30'} strokeWidth={6} fill="none" strokeDasharray="8 6" />
          <Path d={trailPath} stroke={zone.color} strokeWidth={6} fill="none"
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
    </View>
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
  const haloOpacity = useSharedValue(0.18);

  React.useEffect(() => {
    if (!current) return;
    haloScale.value   = withRepeat(withSequence(withTiming(1.18, { duration: 900 }), withTiming(1, { duration: 900 })), -1, false);
    haloOpacity.value = withRepeat(withSequence(withTiming(0.05, { duration: 900 }), withTiming(0.18, { duration: 900 })), -1, false);
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
      return <Ionicons name="lock-closed" size={iconSize} color={COLORS.subtle} />;
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
        backgroundColor: node.locked ? COLORS.surface : isCompleted ? darken(node.color, 0.08) : node.color,
        borderWidth: isCompleted ? 3 : 3,
        borderColor: isCompleted ? '#22C55E' : node.locked ? COLORS.border : darken(node.color, 0.15),
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        shadowColor: node.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: node.locked ? 0 : 0.3,
        shadowRadius: 8,
        elevation: node.locked ? 0 : 4,
      }, nodeStyle]}>
        {nodeInner()}
      </Animated.View>
      <Text style={[styles.nodeLabel, { color: node.locked ? COLORS.subtle : node.color, width: RADIUS * 2, textAlign: 'center' }]}
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

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLORS.canvas },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle:    { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink },
  xpBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  xpText:         { fontFamily: FONTS.heading, fontSize: 13, color: '#78350F' },
  scroll:         { paddingTop: 8, alignItems: 'center' },
  zoneSection:    { marginBottom: 28, width: W },
  zoneBanner:     { borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden' },
  zoneBannerLeft: { flex: 1, justifyContent: 'center' },
  zoneSubRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  zoneTitle:      { fontFamily: FONTS.heading, fontSize: 16 },
  zoneSub:        { fontFamily: FONTS.body, fontSize: 13 },
  zoneMascotWrap: { marginRight: -6, marginVertical: -6, opacity: 0.9 },
  trailContainer: { width: W, position: 'relative' },
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
});
