import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { useProfileStore } from '../../store/useProfileStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useSessionStore } from '../../store/useSessionStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { EXERCISES } from '../../constants/exercises';
import { levelProgress } from '../../lib/xpEngine';
import type { ExerciseId } from '../../types/db';

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
  const list    = useSessionStore(s => s.list);
  const themeColor = usePrefsStore(s => s.prefs.theme_color) || COLORS.focus;

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
    return list({ since });
  }, [list]);

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
      const daySessions = list({ since: dayStart.getTime(), until: dayEnd.getTime() });
      const wpmItems = daySessions.filter(s => s.wpm != null);
      const wpm = wpmItems.length
        ? Math.round(wpmItems.reduce((a, s) => a + (s.wpm ?? 0), 0) / wpmItems.length)
        : 0;
      return { day: DAYS[dayStart.getDay()], wpm };
    });
  }, [list]);

  // 7-day session count per day (for bar chart)
  const sessionsByDay = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(Date.now() - (6 - i) * 86_400_000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 86_400_000);
      const count = list({ since: dayStart.getTime(), until: dayEnd.getTime() }).length;
      const LABELS = ['D', 'C', 'M', 'X', 'J', 'V', 'S'];
      return { day: LABELS[dayStart.getDay()], count };
    });
  }, [list]);

  // 18-week GitHub style horizontal heatmap (126 days, 18 weeks × 7 days)
  const githubHeatmap = useMemo(() => {
    const since = Date.now() - 130 * 86_400_000;
    const allSessions = list({ since });
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
  }, [list]);

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

        {/* WPM Trend chart */}
        <Text style={styles.sectionTitle}>Velocidad lectora (7 días)</Text>
        <View style={styles.chartCard}>
          {wpmTrend.some(d => d.wpm > 0) ? (
            <UniversalLineChart data={wpmTrend} themeColor={COLORS.calm} />
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>Sin datos de WPM esta semana</Text>
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
              <Text style={styles.chartEmptyText}>Completa ejercicios para ver estadísticas</Text>
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

        {/* Exercise cards */}
        <Text style={styles.sectionTitle}>Ejercicios</Text>
        {EX_IDS.map(exId => {
          const meta = EXERCISES[exId];
          const prog = all[exId];
          if (!meta || !prog) return null;
          return (
            <Pressable
              key={exId}
              onPress={() => router.push(`/exercise/${exId}`)}
              style={({ pressed }) => [
                styles.exerciseCard,
                { borderColor: meta.color + '30' },
                pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
              ]}
            >
              <View style={styles.exRow}>
                <View style={[styles.exDot, { backgroundColor: meta.color }]} />
                <Text style={styles.exTitle}>{meta.title}</Text>
                <Text style={[styles.exLevel, { color: meta.color }]}>Nivel {prog.current_level}</Text>
              </View>
              <ProgressBar value={prog.mastery} color={meta.color} height={8} />
              <View style={styles.exStats}>
                <Text style={styles.exStat}>Sesiones: {prog.total_sessions}</Text>
                <Text style={styles.exStat}>Mejor: {Math.round(prog.best_score * 100)}%</Text>
                <Text style={styles.exStat}>Última: {Math.round(prog.last_score * 100)}%</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: COLORS.canvas },
  scroll:    { padding: 20 },
  title:     { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink, marginBottom: 16 },
  levelCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1.5, borderColor: COLORS.focus + '40', marginBottom: 16 },
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

