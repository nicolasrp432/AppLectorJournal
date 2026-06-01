import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { selectWarmupExercises } from '../../lib/dailyWarmup';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { useProfileStore } from '../../store/useProfileStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useSessionStore } from '../../store/useSessionStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { useNodeStore } from '../../store/useNodeStore';
import { MascotChar } from '../../components/ui/MascotChar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { RadarChart } from '../../components/ui/RadarChart';
import { WarmupModal } from '../../components/ui/WarmupModal';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { EXERCISES } from '../../constants/exercises';
import { levelProgress } from '../../lib/xpEngine';
import type { ExerciseId, Session } from '../../types/db';

const SCREEN_W = Dimensions.get('window').width;

const EX_IDS: ExerciseId[] = ['schulte', 'reading', 'wordspan', 'loci', 'comprehension', 'boss'];

function hexToRgba(hex: string, opacity: number) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// ─── UNIVERSAL SVG LINE CHART (WPM TREND) ───────────────────────────────────
function UniversalLineChart({ data, themeColor }: { data: { day: string; wpm: number }[]; themeColor: string }) {
  const maxWpm = Math.max(...data.map(d => d.wpm), 200);

  const width = 320;
  const height = 120;
  const paddingLeft = 32;
  const paddingRight = 12;
  const paddingTop = 15;
  const paddingBottom = 22;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const gridLines = [0, 0.33, 0.66, 1];

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartW;
    const y = paddingTop + chartH - (d.wpm / maxWpm) * chartH;
    return { x, y, value: d.wpm, day: d.day };
  });

  let pathD = '';
  let fillD = '';
  
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    fillD = `M ${points[0].x} ${paddingTop + chartH} L ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
      fillD += ` L ${points[i].x} ${points[i].y}`;
    }
    
    fillD += ` L ${points[points.length - 1].x} ${paddingTop + chartH} Z`;
  }

  return (
    <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={themeColor} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={themeColor} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {gridLines.map((ratio, idx) => {
          const y = paddingTop + chartH - ratio * chartH;
          const valLabel = Math.round(ratio * maxWpm);
          return (
            <React.Fragment key={idx}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke={COLORS.border}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={paddingLeft - 6}
                y={y + 3}
                fontSize={8}
                fontFamily={FONTS.body}
                fill={COLORS.muted}
                textAnchor="end"
              >
                {valLabel}
              </SvgText>
            </React.Fragment>
          );
        })}

        {fillD ? <Path d={fillD} fill="url(#lineGrad)" /> : null}

        {pathD ? (
          <Path
            d={pathD}
            fill="none"
            stroke={themeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {points.map((pt, idx) => {
          const hasVal = pt.value > 0;
          return (
            <React.Fragment key={idx}>
              {hasVal && (
                <>
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={3.5}
                    fill={themeColor}
                    stroke={COLORS.white}
                    strokeWidth={1.5}
                  />
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={7}
                    fill={themeColor}
                    fillOpacity={0.12}
                  />
                </>
              )}
              <SvgText
                x={pt.x}
                y={height - 4}
                fontSize={9}
                fontFamily={FONTS.headingSemi}
                fill={COLORS.muted}
                textAnchor="middle"
              >
                {pt.day}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// ─── UNIVERSAL INTERACTIVE BAR CHART (SESSIONS) ────────────────────────────
function UniversalBarChart({ data, themeColor }: { data: { day: string; count: number }[]; themeColor: string }) {
  const maxVal = Math.max(...data.map(d => d.count), 4);
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);

  return (
    <View style={barStyles.container}>
      <View style={barStyles.barsRow}>
        {data.map((item, idx) => {
          const percentage = maxVal > 0 ? (item.count / maxVal) * 100 : 0;
          const isSelected = selectedIdx === idx;
          return (
            <Pressable
              key={idx}
              onPressIn={() => setSelectedIdx(idx)}
              onPressOut={() => setSelectedIdx(null)}
              style={barStyles.column}
            >
              <View style={[barStyles.tooltip, { opacity: isSelected ? 1 : 0, transform: [{ translateY: isSelected ? 0 : 4 }] }]}>
                <Text style={barStyles.tooltipText}>{item.count} ses</Text>
                <View style={[barStyles.tooltipArrow, { borderTopColor: COLORS.ink }]} />
              </View>

              <View style={barStyles.track}>
                <View
                  style={[
                    barStyles.barFill,
                    {
                      height: `${percentage}%`,
                      backgroundColor: isSelected ? themeColor : hexToRgba(themeColor, 0.75),
                    },
                  ]}
                />
              </View>

              <Text style={[barStyles.dayLabel, isSelected && { color: themeColor, fontFamily: FONTS.headingSemi }]}>
                {item.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function ProgresoScreen() {
  const profile = useProfileStore(s => s.profile);
  const all     = useProgressStore(s => s.all);
  const themeColor = usePrefsStore(s => s.prefs.theme_color) || COLORS.focus;

  const completed = useNodeStore(s => s.completed);
  const sessions = useSessionStore(s => s.sessions);
  const hasSessions = sessions.length > 0;
  const [showWarmupModal, setShowWarmupModal] = React.useState(false);

  // Una sola lista ordenada (desc por fecha) derivada de `sessions`. Antes cada
  // serie llamaba a list() que copiaba+ordenaba ~200 ítems por separado (hasta 15
  // veces). Ahora se ordena una vez y todas las series filtran sobre esta base;
  // además depende de `sessions`, así las estadísticas se actualizan al registrar
  // una sesión nueva (antes quedaban congeladas hasta remontar la pantalla).
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) =>
      new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime()),
    [sessions],
  );
  const inRange = (s: Session, since?: number, until?: number) => {
    const t = new Date(s.finished_at).getTime();
    if (since != null && t < since) return false;
    if (until != null && t >= until) return false;
    return true;
  };

  // Real progress per zone calculations
  const zoneProgress = useMemo(() => {
    const z1Completed = completed.filter(id => id.startsWith('z1_')).length;
    const z2Completed = completed.filter(id => id.startsWith('z2_')).length;
    const z3Completed = completed.filter(id => id.startsWith('z3_')).length;

    const z1Total = 7;
    const z2Total = 6;
    const z3Total = 5;

    return [
      { id: 'z1', label: 'Zona 1: Enfoque', progress: z1Completed / z1Total, completed: z1Completed, total: z1Total, color: COLORS.focus },
      { id: 'z2', label: 'Zona 2: Memoria', progress: z2Completed / z2Total, completed: z2Completed, total: z2Total, color: COLORS.calm },
      { id: 'z3', label: 'Zona 3: Velocidad', progress: z3Completed / z3Total, completed: z3Completed, total: z3Total, color: COLORS.swift },
    ];
  }, [completed]);

  const radarSkills = useMemo(() => {
    return [
      { key: 'schulte',       label: 'Enfoque',      value: all.schulte?.mastery ?? 0.1,       color: EXERCISES.schulte?.color ?? COLORS.focus },
      { key: 'reading',       label: 'Velocidad',    value: all.reading?.mastery ?? 0.1,       color: EXERCISES.reading?.color ?? COLORS.swift },
      { key: 'wordspan',      label: 'Retención',    value: all.wordspan?.mastery ?? 0.1,      color: EXERCISES.wordspan?.color ?? COLORS.calm },
      { key: 'loci',          label: 'Asociación',   value: all.loci?.mastery ?? 0.1,          color: EXERCISES.loci?.color ?? COLORS.joy },
      { key: 'comprehension', label: 'Comprensión', value: all.comprehension?.mastery ?? 0.1, color: EXERCISES.comprehension?.color ?? COLORS.focus },
      { key: 'boss',          label: 'Maestría',     value: all.boss?.mastery ?? 0.1,          color: EXERCISES.boss?.color ?? COLORS.swift },
    ];
  }, [all]);

  const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  function hexToRgba(hex: string, opacity: number) {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  const sessions7d = useMemo(() => {
    const since = Date.now() - 7 * 86_400_000;
    return sortedSessions.filter(s => inRange(s, since));
  }, [sortedSessions]);

  const minutes7d = useMemo(() =>
    sessions7d.reduce((acc, s) => acc + s.time_seconds / 60, 0), [sessions7d]);

  const avgWpm = useMemo(() => {
    const wpmSessions = sessions7d.filter(s => s.wpm !== null);
    if (!wpmSessions.length) return 0;
    return Math.round(wpmSessions.reduce((acc, s) => acc + (s.wpm ?? 0), 0) / wpmSessions.length);
  }, [sessions7d]);

  const avgComp = useMemo(() => {
    const compSessions = sessions7d.filter(s => s.comprehension !== null);
    if (!compSessions.length) return 0;
    return Math.round(compSessions.reduce((acc, s) => acc + (s.comprehension ?? 0), 0) / compSessions.length * 100);
  }, [sessions7d]);

  // 7-day WPM trend (one point per day)
  const wpmTrend = useMemo(() => {
    const DAYS = ['D', 'C', 'M', 'X', 'J', 'V', 'S'];
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(Date.now() - (6 - i) * 86_400_000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const daySessions = sortedSessions.filter(s => inRange(s, dayStart.getTime(), dayEnd.getTime()));
      const wpmItems = daySessions.filter(s => s.wpm != null);
      const wpm = wpmItems.length
        ? Math.round(wpmItems.reduce((a, s) => a + (s.wpm ?? 0), 0) / wpmItems.length)
        : 0;
      return { day: DAYS[dayStart.getDay()], wpm };
    });
  }, [sortedSessions]);

  // 7-day session count per day (for bar chart)
  const sessionsByDay = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(Date.now() - (6 - i) * 86_400_000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const count = sortedSessions.filter(s => inRange(s, dayStart.getTime(), dayEnd.getTime())).length;
      const LABELS = ['D', 'C', 'M', 'X', 'J', 'V', 'S'];
      return { day: LABELS[dayStart.getDay()], count };
    });
  }, [sortedSessions]);

  // 18-week GitHub style horizontal heatmap (126 days, 18 weeks × 7 days)
  const githubHeatmap = useMemo(() => {
    const since = Date.now() - 130 * 86_400_000;
    const allSessions = sortedSessions.filter(s => inRange(s, since));
    const sessionMap: Record<string, number> = {};
    for (const s of allSessions) {
      const day = s.finished_at.split('T')[0];
      sessionMap[day] = (sessionMap[day] || 0) + 1;
    }

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
    const currentMonday = new Date(now.getTime() - daysToSubtract * 86_400_000);
    currentMonday.setHours(0, 0, 0, 0);

    const startMonday = new Date(currentMonday.getTime() - 17 * 7 * 86_400_000);

    const weeks: { date: string; count: number }[][] = [];
    for (let w = 0; w < 18; w++) {
      const weekDays: { date: string; count: number }[] = [];
      const weekMonday = new Date(startMonday.getTime() + w * 7 * 86_400_000);
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(weekMonday.getTime() + d * 86_400_000);
        const dateStr = dayDate.toISOString().split('T')[0];
        weekDays.push({
          date: dateStr,
          count: sessionMap[dateStr] || 0,
        });
      }
      weeks.push(weekDays);
    }
    return weeks;
  }, [sortedSessions]);

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mi progreso</Text>

        {/* Level bar */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <Text style={styles.levelLabel}>Nivel {profile.level}</Text>
            <Text style={styles.levelXP}>{profile.xp % 500}/500 XP</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={levelProgress(profile.xp)} color={COLORS.focus} height={12} />
          </View>
        </View>

        {/* Avance en la Ruta Principal */}
        <View style={styles.routeProgressCard}>
          <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Avance en la Ruta Principal</Text>
          <View style={{ gap: 14 }}>
            {zoneProgress.map(zone => (
              <View key={zone.id} style={styles.zoneProgressRow}>
                <View style={styles.zoneProgressHeader}>
                  <Text style={styles.zoneProgressLabel}>{zone.label}</Text>
                  <Text style={[styles.zoneProgressCount, { color: zone.color, fontFamily: FONTS.heading }]}>
                    {zone.completed}/{zone.total}
                  </Text>
                </View>
                <View style={{ marginTop: 6 }}>
                  <ProgressBar value={zone.progress} color={zone.color} height={8} />
                </View>
              </View>
            ))}
          </View>
        </View>

        {!hasSessions && (
          <View style={styles.emptyStateBanner}>
            <ExpoLinearGradient
              colors={['#1E3A8A', '#0F172A'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateGradient}
            >
              <View style={[styles.emptyStateMascotWrap, { marginRight: 12 }]}>
                <MascotChar which="focus" size={60} breathing />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyStateTitle}>🚀 ¡Comienza tu Neuro-Viaje!</Text>
                <Text style={styles.emptyStateDesc}>
                  Completa tu primera lección o ejercicio en la Ruta para ver tus estadísticas y métricas cerebrales en tiempo real.
                </Text>
              </View>
            </ExpoLinearGradient>
          </View>
        )}

        {/* Habilidades Cognitivas Radar Chart */}
        <Text style={styles.sectionTitle}>Habilidades Cognitivas</Text>
        <View style={styles.radarCard}>
          <RadarChart skills={radarSkills} themeColor={themeColor} size={280} />
        </View>

        {/* KPI grid */}
        <View style={styles.kpiGrid}>
          {[
            { label: 'Minutos (7d)', value: Math.round(minutes7d), unit: 'min', color: COLORS.calm },
            { label: 'Racha',        value: profile.streak,         unit: 'días', color: COLORS.swift },
            { label: 'WPM (prom)',   value: avgWpm,                 unit: 'wpm', color: COLORS.swift },
            { label: 'Comprensión', value: avgComp,                unit: '%',   color: COLORS.joy  },
          ].map(kpi => (
            <View key={kpi.label} style={[styles.kpiCard, { borderColor: kpi.color + '40' }]}>
              <Text style={[styles.kpiValue, { color: kpi.color }]}>{kpi.value}<Text style={styles.kpiUnit}> {kpi.unit}</Text></Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Botón Calentamiento Rápido */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
            setShowWarmupModal(true);
          }}
          style={({ pressed }) => [
            styles.warmupBannerCard,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}
        >
          <ExpoLinearGradient
            colors={['#EF4444', '#F97316'] as [string, string]}
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
          </ExpoLinearGradient>
        </Pressable>

        {/* WPM Trend chart */}
        <Text style={styles.sectionTitle}>Velocidad lectora (7 días)</Text>
        <View style={styles.chartCard}>
          {wpmTrend.some(d => d.wpm > 0) ? (
            <UniversalLineChart data={wpmTrend} themeColor={COLORS.calm} />
          ) : (
            <View style={styles.chartEmpty}>
              <Ionicons name="analytics-outline" size={28} color={COLORS.muted + '40'} style={{ marginBottom: 6 }} />
              <Text style={styles.chartEmptyText}>Sin datos de WPM esta semana</Text>
              <Text style={styles.chartEmptySub}>Entrena en Lectura RSVP para ver tu progreso</Text>
            </View>
          )}
        </View>

        {/* Sessions bar chart */}
        <Text style={styles.sectionTitle}>Sesiones por día</Text>
        <View style={styles.chartCard}>
          {sessionsByDay.some(d => d.count > 0) ? (
            <UniversalBarChart data={sessionsByDay} themeColor={COLORS.focus} />
          ) : (
            <View style={styles.chartEmpty}>
              <Ionicons name="bar-chart-outline" size={28} color={COLORS.muted + '40'} style={{ marginBottom: 6 }} />
              <Text style={styles.chartEmptyText}>Completa ejercicios para ver estadísticas</Text>
              <Text style={styles.chartEmptySub}>Tus sesiones de entrenamiento se verán aquí</Text>
            </View>
          )}
        </View>

        {/* Heatmap */}
        <Text style={styles.sectionTitle}>Mi actividad (18 semanas)</Text>
        <View style={styles.heatmapCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.dayLabelsCol}>
              <Text style={styles.dayLabel}>L</Text>
              <Text style={styles.dayLabel}></Text>
              <Text style={styles.dayLabel}>M</Text>
              <Text style={styles.dayLabel}></Text>
              <Text style={styles.dayLabel}>V</Text>
              <Text style={styles.dayLabel}></Text>
              <Text style={styles.dayLabel}>D</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heatmapScroll}>
              <View>
                {/* Month Labels Row */}
                <View style={styles.monthsRow}>
                  {githubHeatmap.map((week, w) => {
                    const firstDay = new Date(week[0].date + 'T12:00:00');
                    const showMonth = w === 0 || (w > 0 && new Date(githubHeatmap[w - 1][0].date + 'T12:00:00').getMonth() !== firstDay.getMonth());
                    return (
                      <View key={w} style={{ width: 14 + 4 }}>
                        {showMonth && (
                          <Text style={[styles.monthText, { position: 'absolute', width: 50, left: 0 }]} numberOfLines={1}>
                            {MONTH_NAMES[firstDay.getMonth()]}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Grid of columns */}
                <View style={styles.gridRow}>
                  {githubHeatmap.map((week, w) => (
                    <View key={w} style={styles.gridColumn}>
                      {week.map(day => {
                        const intensity = Math.min(1, day.count / 4);
                        const bg = day.count === 0 ? COLORS.surface : hexToRgba(themeColor, 0.25 + intensity * 0.75);
                        return (
                          <View
                            key={day.date}
                            style={[styles.heatCell, { backgroundColor: bg }]}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Heatmap Legend */}
          <View style={styles.legendRow}>
            <Text style={styles.legendText}>Menos</Text>
            <View style={[styles.legendCell, { backgroundColor: COLORS.surface }]} />
            <View style={[styles.legendCell, { backgroundColor: hexToRgba(themeColor, 0.3) }]} />
            <View style={[styles.legendCell, { backgroundColor: hexToRgba(themeColor, 0.5) }]} />
            <View style={[styles.legendCell, { backgroundColor: hexToRgba(themeColor, 0.75) }]} />
            <View style={[styles.legendCell, { backgroundColor: themeColor }]} />
            <Text style={styles.legendText}>Más</Text>
          </View>
        </View>

        {/* Flashcards Banner */}
        <Text style={styles.sectionTitle}>Repetición Espaciada</Text>
        <Pressable
          onPress={() => router.push('/flashcards' as any)}
          style={({ pressed }) => [
            styles.flashcardBannerCard,
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
          ]}
        >
          <ExpoLinearGradient
            colors={['#8B5CF6', '#EC4899'] as [string, string]}
            style={styles.flashcardBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.flashcardBannerTitle}>📚 Flashcards Mnemónicas</Text>
              <Text style={styles.flashcardBannerSub}>
                Entrena tu memoria a largo plazo con el algoritmo SM-2 y personalización por IA.
              </Text>
            </View>
            <Ionicons name="chevron-forward-circle" size={28} color="#FFFFFF" />
          </ExpoLinearGradient>
        </Pressable>

        {/* Práctica Libre Grid */}
        <Text style={styles.sectionTitle}>Práctica Libre (Modo Libre)</Text>
        <Text style={styles.sectionSub}>Entrena de forma ilimitada y ponte a prueba sin alterar tu progreso en la ruta principal.</Text>
        <View style={styles.freePracticeGrid}>
          {EX_IDS.map(exId => {
            const meta = EXERCISES[exId];
            const prog = all[exId];
            if (!meta || !prog) return null;
            return (
              <Pressable
                key={exId}
                onPress={() => router.push({ pathname: `/exercise/${exId}` as any, params: { mode: 'free' } })}
                style={({ pressed }) => [
                  styles.freePracticeCard,
                  { borderColor: meta.color + '30' },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }
                ]}
              >
                <ExpoLinearGradient
                  colors={[COLORS.white, hexToRgba(meta.color, 0.05)]}
                  style={styles.freePracticeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <View style={[styles.freeIconCircle, { backgroundColor: meta.color + '15' }]}>
                    <Ionicons 
                      name={
                        exId === 'schulte' ? 'grid-outline' :
                        exId === 'reading' ? 'speedometer-outline' :
                        exId === 'wordspan' ? 'layers-outline' :
                        exId === 'loci' ? 'home-outline' :
                        exId === 'comprehension' ? 'book-outline' :
                        'skull-outline'
                      } 
                      size={20} 
                      color={meta.color} 
                    />
                  </View>
                  <Text style={styles.freeTitle} numberOfLines={1}>{meta.title}</Text>
                  <Text style={[styles.freeCategory, { color: meta.color }]}>{meta.category}</Text>
                  
                  <View style={styles.freeProgressRow}>
                    <View style={styles.freeProgressBarTrack}>
                      <View style={[styles.freeProgressBarFill, { width: `${prog.mastery * 100}%`, backgroundColor: meta.color }]} />
                    </View>
                    <Text style={styles.freeProgressText}>{Math.round(prog.mastery * 100)}%</Text>
                  </View>
                  
                  <View style={styles.freeStats}>
                    <Text style={styles.freeStatText}>Record: {Math.round(prog.best_score * 100)}%</Text>
                    <Text style={styles.freeStatText}>Nivel: {prog.current_level}</Text>
                  </View>
                </ExpoLinearGradient>
              </Pressable>
            );
          })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <WarmupModal
        visible={showWarmupModal}
        onClose={() => setShowWarmupModal(false)}
        allProgress={all}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.canvas },
  scroll:    { padding: 20 },
  title:     { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink, marginBottom: 16 },
  levelCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: COLORS.focus + '40', marginBottom: 16 },
  radarCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  levelRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  levelLabel:{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink },
  levelXP:   { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  kpiGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  kpiCard:   { flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, padding: 14 },
  kpiValue:  { fontFamily: FONTS.heading, fontSize: 22 },
  kpiUnit:   { fontSize: 13, fontFamily: FONTS.body },
  kpiLabel:  { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 2 },
  sectionTitle:{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, marginBottom: 10 },
  chartCard:   { backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, marginBottom: 20, height: 180 },
  chartEmpty:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chartEmptyText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.subtle, textAlign: 'center' },
  heatmapCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'column',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
    width: '100%',
    paddingRight: 10,
  },
  legendText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.muted,
    marginHorizontal: 2,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  dayLabelsCol: {
    marginRight: 8,
    marginTop: 18,
    justifyContent: 'space-between',
    height: 7 * 14 + 6 * 4,
  },
  dayLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.muted,
    textAlign: 'center',
    height: 14,
    lineHeight: 14,
  },
  heatmapScroll: {
    paddingRight: 10,
  },
  monthsRow: {
    flexDirection: 'row',
    height: 18,
    marginBottom: 4,
  },
  monthText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10,
    color: COLORS.muted,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridColumn: {
    flexDirection: 'column',
    gap: 4,
    marginRight: 4,
  },
  heatCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  exerciseCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  exRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  exDot:     { width: 10, height: 10, borderRadius: 5 },
  exTitle:   { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.ink, flex: 1 },
  exLevel:   { fontFamily: FONTS.heading, fontSize: 12 },
  exStats:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  exStat:    { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
  flashcardBannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  flashcardBannerGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flashcardBannerTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 4,
  },
  flashcardBannerSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
  },
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 16,
    marginTop: -4,
  },
  freePracticeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  freePracticeCard: {
    width: (SCREEN_W - 52) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  freePracticeGradient: {
    padding: 16,
  },
  freeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  freeTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
    marginBottom: 2,
  },
  freeCategory: {
    fontFamily: FONTS.body,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  freeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  freeProgressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  freeProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  freeProgressText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.ink,
  },
  freeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    marginTop: 4,
  },
  freeStatText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.muted,
  },
  warmupBannerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  warmupBannerGradient: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  warmupBannerTitle: {
    fontFamily: FONTS.heading,
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
  emptyStateBanner: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  emptyStateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateMascotWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyStateDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 16,
  },
  routeProgressCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  zoneProgressRow: {
    width: '100%',
  },
  zoneProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneProgressLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
  },
  zoneProgressCount: {
    fontFamily: FONTS.heading,
    fontSize: 14,
  },
  chartEmptySub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
  },
});

const barStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: 8,
  },
  column: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  track: {
    width: 14,
    height: 80,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    bottom: 95,
    backgroundColor: COLORS.ink,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 46,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  tooltipText: {
    color: COLORS.white,
    fontFamily: FONTS.headingSemi,
    fontSize: 9,
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

