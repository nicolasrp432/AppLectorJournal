import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickPassage } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

type Phase = 'read' | 'quiz';

interface Props {
  accent?: string;
  onFinish: (result: { correct: number; total: number; wpm: number; time: number }) => void;
  onQuit: () => void;
}

export function ComprehensionExercise({ accent = '#EAB308', onFinish, onQuit }: Props) {
  const passage = React.useMemo(() => pickPassage('medium'), []);
  const [phase, setPhase] = useState<Phase>('read');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const startTime = React.useRef(Date.now());
  const readStart = React.useRef(Date.now());
  const readTimeRef = React.useRef(0);

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
        const wordCount = passage.text.split(/\s+/).length;
        const wpm = readTimeRef.current > 0 ? Math.round((wordCount / readTimeRef.current) * 60) : 0;
        onFinish({ correct: newAnswers.filter(Boolean).length, total: passage.questions.length, wpm, time: (Date.now() - startTime.current) / 1000 });
      } else {
        setQIdx(i => i + 1);
      }
    }, 1200);
  };

  if (phase === 'read') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={0} accent={accent} onQuit={onQuit} title="Lee" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Lectura con comprensión</Text>
            <Text style={styles.passageTitle}>{passage.title}</Text>
          </View>
          <View style={styles.passageCard}>
            <Text style={styles.passageText}>{passage.text}</Text>
          </View>
          <Text style={styles.hint}>Después responderás {passage.questions.length} preguntas</Text>
          <View style={{ height: 16 }} />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            onPress={() => { readTimeRef.current = (Date.now() - readStart.current) / 1000; setPhase('quiz'); }}
            style={[styles.ctaBtn, { backgroundColor: accent }]}
          >
            <Text style={styles.ctaBtnText}>Ya leí, continuar</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const q = passage.questions[qIdx];
  return (
    <View style={styles.container}>
      <ExerciseTopBar progress={qIdx / passage.questions.length} accent={accent} onQuit={onQuit} title={`Pregunta ${qIdx + 1}/${passage.questions.length}`} />
      <ScrollView contentContainerStyle={styles.scroll}>
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
  passageTitle: { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, marginTop: 4 },
  passageCard:  { backgroundColor: COLORS.white, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: COLORS.border },
  passageText:  { fontFamily: FONTS.body, fontSize: 15, lineHeight: 26, color: '#1F2937' },
  hint:         { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, textAlign: 'center', marginTop: 14 },
  footer:       { padding: 16, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface },
  ctaBtn:       { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
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
