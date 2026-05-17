import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickWords } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

type Phase = 'show' | 'recall';

interface Props {
  level?: number;
  showMs?: number;
  distractorCount?: number;
  accent?: string;
  onFinish: (result: { correct: number; total: number; time: number }) => void;
  onQuit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function WordSpanExercise({ level = 6, showMs = 1100, distractorCount = 4, accent = '#3B82F6', onFinish, onQuit }: Props) {
  const allWords = pickWords(level + distractorCount + 4, false);
  const [sequence] = useState(() => allWords.slice(0, level));
  const [phase, setPhase] = useState<Phase>('show');
  const [shownIdx, setShownIdx] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const startTime = React.useRef(Date.now());

  useEffect(() => {
    if (phase !== 'show') return;
    if (shownIdx < sequence.length) {
      const t = setTimeout(() => setShownIdx(i => i + 1), showMs);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        const distractors = allWords.filter(w => !sequence.includes(w)).slice(0, distractorCount);
        setOptions(shuffle([...sequence, ...distractors]));
        setPhase('recall');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [shownIdx, phase]);

  const toggleSelect = (word: string) => {
    if (selection.includes(word)) {
      setSelection(s => s.filter(w => w !== word));
    } else if (selection.length < sequence.length) {
      const newSel = [...selection, word];
      setSelection(newSel);
      if (newSel.length === sequence.length) {
        setTimeout(() => {
          const correct = newSel.filter((w, i) => w === sequence[i]).length;
          onFinish({ correct, total: sequence.length, time: (Date.now() - startTime.current) / 1000 });
        }, 600);
      }
    }
  };

  if (phase === 'show') {
    const current = sequence[shownIdx];
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={shownIdx / sequence.length} accent={accent} onQuit={onQuit} title="Memoriza" />
        <View style={styles.showCenter}>
          <Text style={styles.counter}>Palabra {shownIdx + 1} de {sequence.length}</Text>
          {current ? (
            <WordBubble key={shownIdx} word={current} accent={accent} />
          ) : (
            <View style={styles.waitBox}>
              <Text style={styles.waitText}>Concéntrate…</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExerciseTopBar progress={selection.length / sequence.length} accent={accent} onQuit={onQuit} title="Recuerda" />
      <View style={styles.hintRow}><Text style={styles.hint}>Selecciona en orden</Text></View>

      <View style={styles.slotArea}>
        <View style={styles.slotRow}>
          {Array.from({ length: sequence.length }).map((_, i) => {
            const w = selection[i];
            return (
              <View key={i} style={[styles.slot, w ? { borderColor: accent, backgroundColor: accent + '12' } : {}]}>
                <Text style={[styles.slotText, w ? { color: accent } : { color: COLORS.border }]}>{w || (i + 1)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <View style={styles.bankCard}>
        <View style={styles.bankGrid}>
          {options.map(w => {
            const selected = selection.includes(w);
            return (
              <Pressable key={w} onPress={() => toggleSelect(w)} style={[styles.wordBtn, selected && styles.wordBtnSelected]}>
                <Text style={[styles.wordBtnText, { color: selected ? COLORS.muted : accent }, selected && { opacity: 0.5 }]}>{w}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function WordBubble({ word, accent }: { word: string; accent: string }) {
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <Animated.View style={[style, { padding: 32, paddingHorizontal: 48, borderRadius: 28, backgroundColor: accent, shadowColor: accent, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 50, elevation: 8 }]}>
      <Text style={{ fontFamily: FONTS.heading, fontSize: 44, color: '#fff' }}>{word}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.canvas },
  showCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20 },
  counter:    { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  waitBox:    { padding: 32, alignItems: 'center' },
  waitText:   { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink },
  hintRow:    { paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
  hint:       { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  slotArea:   { paddingHorizontal: 20, paddingTop: 14 },
  slotRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  slot:       { minWidth: 60, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center' },
  slotText:   { fontFamily: FONTS.heading, fontSize: 15 },
  bankCard:   { margin: 16, backgroundColor: COLORS.white, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  bankGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wordBtn:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface },
  wordBtnSelected: { backgroundColor: COLORS.border },
  wordBtnText:{ fontFamily: FONTS.heading, fontSize: 14 },
});
