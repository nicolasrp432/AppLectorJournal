import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useProfileStore } from '../../store/useProfileStore';
import { useNodeStore } from '../../store/useNodeStore';
import { COLORS, darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { EXERCISES } from '../../constants/exercises';

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

const ZONES: { title: string; subtitle: string; color: string; locked?: boolean; nodes: ZoneNode[] }[] = [
  {
    title: 'Zona 1', subtitle: 'Enfoque',
    color: COLORS.focus,
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
    color: COLORS.calm,
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
    color: COLORS.swift,
    locked: true,
    nodes: [
      { id: 'z3_lesson', kind: 'lesson',   side: 'center', label: 'Lección',        color: COLORS.swift, locked: true },
      { id: 'z3_f1',     kind: 'exercise', side: 'left',   label: '400 WPM',        color: COLORS.swift, exId: 'reading', locked: true },
      { id: 'z3_chest',  kind: 'chest',    side: 'center', label: 'Cofre',           color: '#EAB308',    locked: true },
      { id: 'z3_f2',     kind: 'exercise', side: 'right',  label: '600 WPM',        color: COLORS.swift, exId: 'reading', locked: true },
      { id: 'z3_boss',   kind: 'boss',     side: 'center', label: 'Jefe de Zona',   color: COLORS.boss,  exId: 'boss',    locked: true },
    ],
  },
];

function resolveNodeLocked(
  nodes: ZoneNode[],
  idx: number,
  completed: string[],
  zoneUnlocked: boolean,
): boolean {
  if (!zoneUnlocked) return true;
  for (let i = idx - 1; i >= 0; i--) {
    if (nodes[i].exId) return !completed.includes(nodes[i].id);
  }
  return false;
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
  const completed = useNodeStore(s => s.completed);

  const zone1BossCompleted = completed.includes('z1_boss');
  const zone2BossCompleted = completed.includes('z2_boss');

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ruta de aprendizaje</Text>
        {profile && (
          <View style={styles.xpBadge}>
            <Text style={styles.xpText}>⚡ {profile.xp} XP</Text>
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
          />
        ))}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ZoneSection({ zone, completed, zoneForceUnlocked }: {
  zone: typeof ZONES[0];
  completed: string[];
  zoneForceUnlocked: boolean;
}) {
  const trailPath = buildTrail(zone.nodes);
  const svgH = zone.nodes.length * ROW + 40;

  const zoneColor = zoneForceUnlocked ? zone.color : COLORS.border;

  const currentIdx = zoneForceUnlocked
    ? zone.nodes.findIndex((n, i) => {
        const locked = resolveNodeLocked(zone.nodes, i, completed, true);
        return !locked && !completed.includes(n.id) && !!n.exId;
      })
    : -1;

  return (
    <View style={styles.zoneSection}>
      {/* Zone header */}
      <View style={[styles.zoneBanner, { backgroundColor: zoneColor + '18', borderColor: zoneColor + '40' }]}>
        <Text style={[styles.zoneTitle, { color: zoneColor }]}>{zone.title}</Text>
        <Text style={[styles.zoneSub, { color: zoneColor }]}>{zone.subtitle}</Text>
        {!zoneForceUnlocked && <Text style={{ fontSize: 16 }}>🔒</Text>}
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
            />
          );
        })}
      </View>
    </View>
  );
}

function NodeButton({
  node, x, y, current, isCompleted,
}: {
  node: ZoneNode; x: number; y: number; current: boolean; isCompleted: boolean;
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
    if (node.exId) {
      router.push(`/exercise/${node.exId}?nodeId=${node.id}` as Parameters<typeof router.push>[0]);
    }
  };

  const RADIUS = node.kind === 'boss' ? 38 : node.kind === 'chest' ? 32 : 30;
  const icon   = NODE_ICON[node.kind];

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
        borderWidth: 3,
        borderColor: node.locked ? COLORS.border : darken(node.color, 0.15),
        alignItems: 'center', justifyContent: 'center',
        shadowColor: node.color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: node.locked ? 0 : 0.3,
        shadowRadius: 8,
        elevation: node.locked ? 0 : 4,
      }, nodeStyle]}>
        <Text style={{ fontSize: node.kind === 'boss' ? 22 : 18 }}>
          {node.locked ? '🔒' : isCompleted ? '✓' : icon}
        </Text>
      </Animated.View>
      {/* Completed star badge */}
      {isCompleted && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>★</Text>
        </View>
      )}
      <Text style={[styles.nodeLabel, { color: node.locked ? COLORS.subtle : node.color, width: RADIUS * 2, textAlign: 'center' }]}
        numberOfLines={2}>
        {node.label}
      </Text>
    </Pressable>
  );
}

const NODE_ICON: Record<NodeKind, string> = {
  lesson:   '📖',
  exercise: '⚡',
  chest:    '📦',
  boss:     '👾',
};

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLORS.canvas },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerTitle:{ fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink },
  xpBadge:   { backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  xpText:    { fontFamily: FONTS.heading, fontSize: 13, color: '#78350F' },
  scroll:    { paddingTop: 8, alignItems: 'center' },
  zoneSection:{ marginBottom: 28, width: W },
  zoneBanner: { borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneTitle:  { fontFamily: FONTS.heading, fontSize: 16 },
  zoneSub:    { fontFamily: FONTS.body, fontSize: 13 },
  trailContainer:    { width: W, position: 'relative' },
  nodeLabel:         { fontFamily: FONTS.headingSemi, fontSize: 10, marginTop: 4, letterSpacing: 0.2 },
  completedBadge:    { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  completedBadgeText:{ fontSize: 10, color: '#fff' },
});
