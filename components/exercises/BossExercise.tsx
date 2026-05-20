import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../../constants/typography';

const BOSS_ACCENT = '#DC2626';

interface Props {
  onFinish: (result: { score: number; defeated: boolean; time: number; rounds: number }) => void;
  onQuit: () => void;
}

type Phase = 'intro' | 'playing' | 'round-end';

const CHALLENGES = [
  { type: 'speed',         label: 'Velocidad' },
  { type: 'memory',        label: 'Memoria' },
  { type: 'comprehension', label: 'Comprensión' },
];

export function BossExercise({ onFinish, onQuit }: Props) {
  const [cIdx, setCIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [bossHP, setBossHP] = useState(100);
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundResult, setRoundResult] = useState<{ score: number; damage: number } | null>(null);
  const startTime = useRef(Date.now());

  const hp = useSharedValue(100);
  const hpStyle = useAnimatedStyle(() => ({ width: `${hp.value}%` as any }));

  const handleRoundFinish = (score: number) => {
    const damage = Math.floor(score * 35);
    const newHP = Math.max(0, bossHP - damage);
    setBossHP(newHP);
    hp.value = withTiming(newHP, { duration: 700 });
    const newScores = [...scores, score];
    setScores(newScores);
    setRoundResult({ score, damage });
    setPhase('round-end');
  };

  const handleNext = () => {
    if (cIdx + 1 >= CHALLENGES.length) {
      const totalScore = scores.reduce((a, b) => a + b, 0) / CHALLENGES.length;
      onFinish({ score: totalScore, defeated: bossHP === 0, time: (Date.now() - startTime.current) / 1000, rounds: scores.length });
    } else {
      setCIdx(i => i + 1);
      setPhase('playing');
      setRoundResult(null);
    }
  };

  const BossHeader = () => (
    <LinearGradient colors={['#450A0A', '#1F2937']} style={styles.bossHeader}>
      <View style={styles.bossHeaderInner}>
        <Pressable onPress={onQuit} style={styles.quitBtn}>
          <Text style={styles.quitIcon}>✕</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.roundLabel}>JEFE · Ronda {cIdx + 1}/{CHALLENGES.length}</Text>
          <Text style={styles.bossName}>Guardián de la Comprensión</Text>
        </View>
        <Text style={{ fontSize: 40 }}>👹</Text>
      </View>
      <View style={styles.hpTrack}>
        <Animated.View style={[styles.hpFill, hpStyle]} />
      </View>
      <Text style={styles.hpLabel}>HP: {bossHP}/100</Text>
    </LinearGradient>
  );

  if (phase === 'intro') {
    return (
      <View style={[styles.container, { backgroundColor: '#1F2937' }]}>
        <BossHeader />
        <View style={styles.introCenter}>
          <Text style={{ fontSize: 100 }}>👹</Text>
          <Text style={styles.introSubtitle}>Reto final de la zona</Text>
          <Text style={styles.introTitle}>3 rondas.{'\n'}Un jefe.</Text>
          <Text style={styles.introDesc}>Supera las pruebas de velocidad, memoria y comprensión. Cada acierto debilita al jefe.</Text>
          <View style={styles.challengeRow}>
            {CHALLENGES.map((c, i) => (
              <View key={i} style={styles.challengePill}>
                <Text style={styles.challengePillText}>{i + 1}. {c.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={() => setPhase('playing')} style={styles.battleBtn}>
            <Text style={styles.battleBtnText}>¡A LA BATALLA!</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'round-end') {
    const emoji = roundResult!.score > 0.66 ? '⚔️' : roundResult!.score > 0.33 ? '💥' : '🛡️';
    return (
      <View style={[styles.container, { backgroundColor: '#1F2937' }]}>
        <BossHeader />
        <View style={styles.roundEndCenter}>
          <Text style={{ fontSize: 80 }}>{emoji}</Text>
          <Text style={styles.roundDoneLabel}>Ronda completada</Text>
          <Text style={styles.damageText}>-{roundResult!.damage} HP</Text>
          <Text style={styles.roundDesc}>
            {bossHP === 0 ? '¡El jefe está vencido!' : cIdx + 1 >= CHALLENGES.length ? 'Última ronda terminada' : 'Prepárate para la siguiente'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={handleNext} style={[styles.battleBtn, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.battleBtnText}>{cIdx + 1 >= CHALLENGES.length ? 'Ver resultado final' : 'Siguiente ronda'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const current = CHALLENGES[cIdx];
  return (
    <View style={styles.container}>
      <BossHeader />
      <View style={{ flex: 1 }}>
        {current.type === 'speed'         && <BossSpeedRound onFinish={handleRoundFinish} />}
        {current.type === 'memory'        && <BossMemoryRound onFinish={handleRoundFinish} />}
        {current.type === 'comprehension' && <BossComprehensionRound onFinish={handleRoundFinish} />}
      </View>
    </View>
  );
}

function BossSpeedRound({ onFinish }: { onFinish: (score: number) => void }) {
  const words = ['rápido', 'leer', 'foco', 'mente', 'atento', 'claro', 'ágil', 'despierto'];
  const [idx, setIdx] = useState(0);
  const start = useRef(Date.now());

  useEffect(() => {
    if (idx >= words.length) {
      const time = (Date.now() - start.current) / 1000;
      const score = Math.max(0, Math.min(1, 1 - (time - 6) / 10));
      onFinish(score);
    }
  }, [idx]);

  if (idx >= words.length) return null;

  return (
    <View style={[bossStyles.roundContainer, { backgroundColor: '#111827' }]}>
      <Text style={bossStyles.roundHint}>Toca tan rápido como leas · {idx}/{words.length}</Text>
      <View style={[bossStyles.wordCard, { backgroundColor: BOSS_ACCENT }]}>
        <Text style={bossStyles.wordText}>{words[idx]}</Text>
      </View>
      <Pressable onPress={() => setIdx(i => i + 1)} style={bossStyles.nextBtn}>
        <Text style={bossStyles.nextBtnText}>Siguiente ↓</Text>
      </Pressable>
    </View>
  );
}

function BossMemoryRound({ onFinish }: { onFinish: (score: number) => void }) {
  const [digits] = useState(() => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [input, setInput] = useState<number[]>([]);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), 3500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const tap = (n: number) => {
    const newIn = [...input, n];
    setInput(newIn);
    if (newIn.length === digits.length) {
      const correct = newIn.filter((d, i) => d === digits[i]).length;
      onFinish(correct / digits.length);
    }
  };

  if (phase === 'show') {
    return (
      <View style={[bossStyles.roundContainer, { backgroundColor: '#111827' }]}>
        <Text style={bossStyles.roundHint}>Memoriza estos números</Text>
        <View style={bossStyles.digitsRow}>
          {digits.map((d, i) => (
            <View key={i} style={bossStyles.digitCard}>
              <Text style={bossStyles.digitText}>{d}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[bossStyles.roundContainer, { backgroundColor: '#111827', justifyContent: 'flex-start', paddingTop: 20 }]}>
      <Text style={bossStyles.roundHint}>Escribe los números en orden</Text>
      <View style={bossStyles.inputRow}>
        {digits.map((_, i) => (
          <View key={i} style={[bossStyles.inputSlot, input[i] != null && { borderColor: BOSS_ACCENT, backgroundColor: `${BOSS_ACCENT}30` }]}>
            <Text style={bossStyles.inputText}>{input[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <View style={bossStyles.numpad}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <Pressable key={n} onPress={() => tap(n)} style={bossStyles.numKey}>
            <Text style={bossStyles.numKeyText}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function BossComprehensionRound({ onFinish }: { onFinish: (score: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const q = {
    text: 'La práctica espaciada mejora la memoria a largo plazo más que estudiar todo de una vez.',
    q: '¿Qué afirma el texto?',
    opts: ['Estudiar intensivo es igual de eficaz', 'Espaciar la práctica mejora el recuerdo duradero', 'La memoria no se puede entrenar'],
    correct: 1,
  };

  const handle = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => onFinish(i === q.correct ? 1 : 0), 1000);
  };

  return (
    <View style={[bossStyles.roundContainer, { backgroundColor: '#111827', justifyContent: 'center', gap: 16 }]}>
      <Text style={bossStyles.roundHint}>Lee y responde</Text>
      <View style={bossStyles.textCard}>
        <Text style={bossStyles.textCardContent}>{q.text}</Text>
      </View>
      <Text style={bossStyles.qText}>{q.q}</Text>
      <View style={{ gap: 8 }}>
        {q.opts.map((opt, i) => {
          const correct = picked !== null && i === q.correct;
          const wrong   = picked === i && i !== q.correct;
          return (
            <Pressable
              key={i}
              onPress={() => handle(i)}
              disabled={picked !== null}
              style={[bossStyles.optBtn, correct && { backgroundColor: '#16A34A' }, wrong && { backgroundColor: '#DC2626' }]}
            >
              <Text style={bossStyles.optText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  bossHeader:     { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16 },
  bossHeaderInner:{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  quitBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  quitIcon:       { color: '#fff', fontSize: 16 },
  roundLabel:     { fontFamily: FONTS.headingSemi, fontSize: 10, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 2 },
  bossName:       { fontFamily: FONTS.heading, fontSize: 18, color: '#fff', marginTop: 2 },
  hpTrack:        { height: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, overflow: 'hidden' },
  hpFill:         { height: '100%', backgroundColor: '#EF4444', borderRadius: 5 },
  hpLabel:        { fontFamily: FONTS.headingSemi, fontSize: 10, color: '#FCA5A5', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
  introCenter:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 14 },
  introSubtitle:  { fontFamily: FONTS.headingSemi, fontSize: 11, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 2 },
  introTitle:     { fontFamily: FONTS.heading, fontSize: 28, color: '#fff', textAlign: 'center' },
  introDesc:      { fontFamily: FONTS.body, fontSize: 14, color: '#D1D5DB', textAlign: 'center', maxWidth: 300 },
  challengeRow:   { flexDirection: 'row', gap: 8, marginTop: 8 },
  challengePill:  { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  challengePillText:{ fontFamily: FONTS.heading, fontSize: 11, color: '#fff' },
  footer:         { padding: 16, paddingBottom: 28 },
  battleBtn:      { backgroundColor: '#EF4444', borderRadius: 14, paddingVertical: 15, alignItems: 'center', ...Platform.select({ web: { boxShadow: '0 10px 30px rgba(239,68,68,0.5)' } as any, default: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 6 } }) },
  battleBtnText:  { fontFamily: FONTS.heading, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: 1 },
  roundEndCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  roundDoneLabel: { fontFamily: FONTS.headingSemi, fontSize: 11, color: '#FCA5A5', textTransform: 'uppercase', letterSpacing: 2 },
  damageText:     { fontFamily: FONTS.heading, fontSize: 42, color: '#EF4444' },
  roundDesc:      { fontFamily: FONTS.body, fontSize: 14, color: '#D1D5DB' },
});

const bossStyles = StyleSheet.create({
  roundContainer: { flex: 1, padding: 20, alignItems: 'center', gap: 28, justifyContent: 'center' },
  roundHint:      { fontFamily: FONTS.headingSemi, fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 2, textAlign: 'center' },
  wordCard:       { paddingVertical: 28, paddingHorizontal: 40, borderRadius: 24, ...Platform.select({ web: { boxShadow: '0 20px 50px rgba(220,38,38,0.6)' } as any, default: { shadowColor: '#DC2626', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 50, elevation: 8 } }) },
  wordText:       { fontFamily: FONTS.heading, fontSize: 52, color: '#fff' },
  nextBtn:        { paddingHorizontal: 32, paddingVertical: 14, backgroundColor: '#fff', borderRadius: 14 },
  nextBtnText:    { fontFamily: FONTS.heading, fontSize: 14, color: '#111827', textTransform: 'uppercase', letterSpacing: 1 },
  digitsRow:      { flexDirection: 'row', gap: 10 },
  digitCard:      { width: 46, height: 60, borderRadius: 12, backgroundColor: BOSS_ACCENT, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { boxShadow: '0 8px 20px rgba(220,38,38,0.5)' } as any, default: { shadowColor: BOSS_ACCENT, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 4 } }) },
  digitText:      { fontFamily: FONTS.heading, fontSize: 30, color: '#fff' },
  inputRow:       { flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 16 },
  inputSlot:      { width: 38, height: 48, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  inputText:      { fontFamily: FONTS.heading, fontSize: 22, color: '#fff' },
  numpad:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  numKey:         { width: '18%', paddingVertical: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  numKeyText:     { fontFamily: FONTS.heading, fontSize: 22, color: '#fff' },
  textCard:       { padding: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', width: '100%' },
  textCardContent:{ fontFamily: FONTS.body, fontSize: 16, lineHeight: 24, color: '#F3F4F6' },
  qText:          { fontFamily: FONTS.heading, fontSize: 16, color: '#fff', textAlign: 'center' },
  optBtn:         { padding: 14, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 12, width: '100%' },
  optText:        { fontFamily: FONTS.body, fontSize: 14, color: '#fff' },
});
