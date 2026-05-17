import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// Victory Native uses Skia (CanvasKit/WASM) — only load on native platforms
const VictoryNative = Platform.OS !== 'web'
  ? require('victory-native')
  : null;
import { useProfileStore } from '../../store/useProfileStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useSessionStore } from '../../store/useSessionStore';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { EXERCISES } from '../../constants/exercises';
import { levelProgress } from '../../lib/xpEngine';
import type { ExerciseId } from '../../types/db';

const SCREEN_W = Dimensions.get('window').width;

const EX_IDS: ExerciseId[] = ['schulte', 'reading', 'wordspan', 'loci', 'comprehension', 'boss'];

export default function ProgresoScreen() {
  const profile = useProfileStore(s => s.profile);
  const all     = useProgressStore(s => s.all);
  const list    = useSessionStore(s => s.list);

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

  // 28-day heatmap
  const heatmap = useMemo(() => {
    const all28 = list({ since: Date.now() - 28 * 86_400_000 });
    const map: Record<string, number> = {};
    for (const s of all28) {
      const day = s.finished_at.split('T')[0];
      map[day] = (map[day] || 0) + 1;
    }
    const days: { date: string; count: number }[] = [];
    for (let d = 27; d >= 0; d--) {
      const date = new Date(Date.now() - d * 86_400_000).toISOString().split('T')[0];
      days.push({ date, count: map[date] || 0 });
    }
    return days;
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

        {/* WPM Trend chart — native only (Skia) */}
        <Text style={styles.sectionTitle}>Velocidad lectora (7 días)</Text>
        <View style={styles.chartCard}>
          {VictoryNative && wpmTrend.some(d => d.wpm > 0) ? (
            <VictoryNative.CartesianChart
              data={wpmTrend}
              xKey="day"
              yKeys={['wpm']}
              axisOptions={{ font: undefined, labelColor: COLORS.muted, lineColor: COLORS.border, tickCount: { x: 7, y: 4 } }}
              domainPadding={{ top: 20, bottom: 10 }}
            >
              {({ points }: any) => (
                <VictoryNative.Line
                  points={points.wpm}
                  color={COLORS.calm}
                  strokeWidth={2.5}
                  animate={{ type: 'timing', duration: 600 }}
                  connectMissingData
                />
              )}
            </VictoryNative.CartesianChart>
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>
                {wpmTrend.some(d => d.wpm > 0) ? 'Gráficas disponibles en la app' : 'Sin datos de WPM esta semana'}
              </Text>
            </View>
          )}
        </View>

        {/* Sessions bar chart — native only (Skia) */}
        <Text style={styles.sectionTitle}>Sesiones por día</Text>
        <View style={styles.chartCard}>
          {VictoryNative && sessionsByDay.some(d => d.count > 0) ? (
            <VictoryNative.CartesianChart
              data={sessionsByDay}
              xKey="day"
              yKeys={['count']}
              axisOptions={{ font: undefined, labelColor: COLORS.muted, lineColor: COLORS.border, tickCount: { x: 7, y: 4 } }}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 10 }}
            >
              {({ points, chartBounds }: any) => (
                <VictoryNative.Bar
                  points={points.count}
                  chartBounds={chartBounds}
                  color={COLORS.focus}
                  roundedCorners={{ topLeft: 6, topRight: 6 }}
                  animate={{ type: 'timing', duration: 600 }}
                />
              )}
            </VictoryNative.CartesianChart>
          ) : (
            <View style={styles.chartEmpty}>
              <Text style={styles.chartEmptyText}>
                {sessionsByDay.some(d => d.count > 0) ? 'Gráficas disponibles en la app' : 'Completa ejercicios para ver estadísticas'}
              </Text>
            </View>
          )}
        </View>

        {/* Heatmap */}
        <Text style={styles.sectionTitle}>Actividad (28 días)</Text>
        <View style={styles.heatmap}>
          {heatmap.map(day => {
            const intensity = Math.min(1, day.count / 4);
            const bg = day.count === 0 ? COLORS.surface : `rgba(34,197,94,${0.15 + intensity * 0.75})`;
            return (
              <View key={day.date} style={[styles.heatCell, { backgroundColor: bg }]} />
            );
          })}
        </View>

        {/* Exercise cards */}
        <Text style={styles.sectionTitle}>Ejercicios</Text>
        {EX_IDS.map(exId => {
          const meta = EXERCISES[exId];
          const prog = all[exId];
          if (!meta || !prog) return null;
          return (
            <View key={exId} style={[styles.exerciseCard, { borderColor: meta.color + '30' }]}>
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
            </View>
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
  heatmap:   { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 20 },
  heatCell:  { width: (require('react-native').Dimensions.get('window').width - 60) / 7 - 4, aspectRatio: 1, borderRadius: 4 },
  exerciseCard: { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, padding: 14, marginBottom: 10 },
  exRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  exDot:     { width: 10, height: 10, borderRadius: 5 },
  exTitle:   { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.ink, flex: 1 },
  exLevel:   { fontFamily: FONTS.heading, fontSize: 12 },
  exStats:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  exStat:    { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
});
