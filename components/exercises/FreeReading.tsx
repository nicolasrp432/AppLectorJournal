import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickPassage } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

type Phase = 'reading' | 'quiz';

interface FreeReadingResult {
  wpm: number;
  mode: 'free';
  time: number;
  comprehension: number;
  correct: number;
  total: number;
}

interface Props {
  accent?: string;
  onFinish: (result: FreeReadingResult) => void;
  onQuit: () => void;
}

export function FreeReadingExercise({ accent = '#22C55E', onFinish, onQuit }: Props) {
  const passage = React.useMemo(() => pickPassage('medium'), []);
  const wordCount = React.useMemo(() => passage.text.split(/\s+/).length, [passage]);

  const [phase, setPhase] = useState<Phase>('reading');
  const [scrollPct, setScrollPct] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const startTime  = React.useRef<number | null>(null);
  const totalStart = React.useRef(Date.now());
  const hasStarted = React.useRef(false);
  const wpmRef     = React.useRef(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      startTime.current = Date.now();
    }
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      setScrollPct(Math.min(1, contentOffset.y / maxScroll));
    }
  };

  const finishReading = () => {
    const readSeconds = startTime.current
      ? (Date.now() - startTime.current) / 1000
      : (Date.now() - totalStart.current) / 1000;
    wpmRef.current = readSeconds > 0 ? Math.round((wordCount / readSeconds) * 60) : 0;
    setPhase('quiz');
  };

  const handlePick = (i: number) => {
    if (showFeedback) return;
    setPicked(i);
    setShowFeedback(true);
    setTimeout(() => {
      const correct = i === passage.questions[qIdx].correct;
      const newAnswers = [...answers, correct];
      setAnswers(newAnswers);
      setPicked(null);
      setShowFeedback(false);
      if (qIdx + 1 >= passage.questions.length) {
        const totalCorrect = newAnswers.filter(Boolean).length;
        const comprehension = totalCorrect / passage.questions.length;
        onFinish({
          wpm: wpmRef.current,
          mode: 'free',
          time: (Date.now() - totalStart.current) / 1000,
          comprehension,
          correct: totalCorrect,
          total: passage.questions.length,
        });
      } else {
        setQIdx(idx => idx + 1);
      }
    }, 1200);
  };

  if (phase === 'reading') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar
          progress={scrollPct}
          accent={accent}
          onQuit={onQuit}
          title="Lectura libre"
        />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{wordCount} palabras</Text>
            <Text style={styles.passageTitle}>{passage.title}</Text>
          </View>
          <View style={styles.passageCard}>
            <Text style={styles.passageText}>{passage.text}</Text>
          </View>
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>
              Cuando termines, responderás {passage.questions.length} preguntas sin volver al texto.
            </Text>
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            onPress={finishReading}
            style={[styles.ctaBtn, { backgroundColor: accent }]}
          >
            <Text style={styles.ctaBtnText}>Terminé · ir al quiz →</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const q = passage.questions[qIdx];
  return (
    <View style={styles.container}>
      <ExerciseTopBar
        progress={qIdx / passage.questions.length}
        accent={accent}
        onQuit={onQuit}
        title={`Pregunta ${qIdx + 1}/${passage.questions.length}`}
      />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.qLabel}>Pregunta {qIdx + 1}</Text>
        <Text style={styles.qText}>{q.q}</Text>
        <View style={{ marginTop: 20, gap: 8 }}>
          {q.opts.map((opt, i) => {
            const isPicked = picked === i;
            const isCorrect = showFeedback && i === q.correct;
            const isWrong   = showFeedback && isPicked && i !== q.correct;
            return (
              <Pressable
                key={i}
                onPress={() => handlePick(i)}
                disabled={showFeedback}
                style={[
                  styles.option,
                  isCorrect && styles.optionCorrect,
                  isWrong   && styles.optionWrong,
                  isPicked && !isCorrect && !isWrong && { backgroundColor: accent + '15', borderColor: accent },
                ]}
              >
                <View style={[styles.badge, isCorrect && { backgroundColor: '#22C55E' }, isWrong && { backgroundColor: '#EF4444' }]}>
                  <Text style={[styles.badgeText, (isCorrect || isWrong) && { color: '#fff' }]}>
                    {isCorrect ? '✓' : isWrong ? '✕' : String.fromCharCode(65 + i)}
                  </Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.canvas },
  scroll:       { padding: 20 },
  header:       { alignItems: 'center', marginBottom: 16 },
  eyebrow:      { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  passageTitle: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, marginTop: 4, textAlign: 'center' },
  passageCard:  { backgroundColor: COLORS.white, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: COLORS.border },
  passageText:  { fontFamily: FONTS.bodyLight, fontSize: 16, lineHeight: 28, color: '#1F2937' },
  tipBox:       { marginTop: 16, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  tipText:      { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, textAlign: 'center', lineHeight: 18 },
  footer:       { padding: 16, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface },
  ctaBtn:       { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  ctaBtnText:   { fontFamily: FONTS.heading, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  qLabel:       { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
  qText:        { fontFamily: FONTS.heading, fontSize: 19, color: COLORS.ink, lineHeight: 26 },
  option:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
  optionCorrect:{ backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  optionWrong:  { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  badge:        { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  badgeText:    { fontFamily: FONTS.heading, fontSize: 11, color: COLORS.muted },
  optionText:   { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink, flex: 1 },
});
