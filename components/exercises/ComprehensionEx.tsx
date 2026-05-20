import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickPassage } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { useRewardsStore } from '../../store/useRewardsStore';

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
  
  const startTime = useRef(Date.now());
  const readStart = useRef(Date.now());
  const readTimeRef = useRef(0);

  // ─── 3D Page Flip and Reading Ruler Reanimated State ──────────────────────
  const pageRotation = useSharedValue(0);
  const rulerY = useSharedValue(24);
  const rulerOpacity = useSharedValue(1);

  // Rewards powerup skip question state
  const { owned, consume } = useRewardsStore();
  const hasSkip = owned.includes('pw-skip');

  const startQuizPhase = () => {
    setPhase('quiz');
  };

  const handleNextPhase = () => {
    readTimeRef.current = (Date.now() - readStart.current) / 1000;
    
    // 3D book page flip transition sequence
    pageRotation.value = withTiming(-90, { duration: 320 }, () => {
      runOnJS(startQuizPhase)();
      pageRotation.value = 90;
      pageRotation.value = withSpring(0, { damping: 14 });
    });
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
        const wordCount = passage.text.split(/\s+/).length;
        const wpm = readTimeRef.current > 0 ? Math.round((wordCount / readTimeRef.current) * 60) : 0;
        onFinish({
          correct: newAnswers.filter(Boolean).length,
          total: passage.questions.length,
          wpm,
          time: (Date.now() - startTime.current) / 1000,
        });
      } else {
        // Animate question card swing on correct/wrong
        setQIdx(i => i + 1);
      }
    }, 1200);
  };

  const handleSkipQuestion = () => {
    if (showFeedback) return;
    consume('pw-skip');
    
    // Count this current question as correct
    const newAnswers = [...answers, true];
    setAnswers(newAnswers);
    
    if (qIdx + 1 >= passage.questions.length) {
      const wordCount = passage.text.split(/\s+/).length;
      const wpm = readTimeRef.current > 0 ? Math.round((wordCount / readTimeRef.current) * 60) : 0;
      onFinish({
        correct: newAnswers.filter(Boolean).length,
        total: passage.questions.length,
        wpm,
        time: (Date.now() - startTime.current) / 1000,
      });
    } else {
      setQIdx(i => i + 1);
    }
  };

  const handlePressPassageCard = (event: any) => {
    const y = event.nativeEvent.locationY;
    // Snap ruler vertically and animate with smooth bouncy spring
    rulerY.value = withSpring(y - 14, { damping: 16 });
  };

  // Reanimated Styles
  const flipCardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${pageRotation.value}deg` },
    ],
    backfaceVisibility: 'hidden',
    flex: 1,
  }));

  const rulerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: rulerY.value }],
    opacity: rulerOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <ExerciseTopBar
        progress={phase === 'read' ? 0.3 : (qIdx + 1) / passage.questions.length}
        accent={accent}
        onQuit={onQuit}
        title={phase === 'read' ? 'Lee a Conciencia' : `Pregunta ${qIdx + 1}/${passage.questions.length}`}
      />

      <Animated.View style={flipCardStyle}>
        {phase === 'read' ? (
          <View style={styles.contentWrap}>
            <ScrollView contentContainerStyle={styles.scroll}>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>Lectura con comprensión</Text>
                <Text style={styles.passageTitle}>{passage.title}</Text>
              </View>

              {/* Informative tips helper */}
              <View style={[styles.tipBanner, { backgroundColor: `${accent}12`, borderColor: `${accent}25` }]}>
                <Ionicons name="bulb" size={16} color={accent} style={{ marginRight: 6 }} />
                <Text style={[styles.tipBannerText, { color: '#374151' }]}>
                  Toca cualquier línea del texto para guiar tus ojos y evitar regresar.
                </Text>
              </View>

              {/* Passage Card Container with Tap Gesture Snapping Ruler */}
              <Pressable onPress={handlePressPassageCard} style={styles.passageCardWrap}>
                <View style={styles.passageCard}>
                  <Text style={styles.passageText}>{passage.text}</Text>
                </View>

                {/* Glassmorphic Sliding Focus Ruler Line */}
                <Animated.View pointerEvents="none" style={[styles.readingRuler, { borderColor: accent, backgroundColor: `${accent}16` }, rulerStyle]}>
                  <View style={[styles.rulerHandleLeft, { backgroundColor: accent }]} />
                  <View style={[styles.rulerHandleRight, { backgroundColor: accent }]} />
                </Animated.View>
              </Pressable>

              <Text style={styles.hint}>Tómate tu tiempo. Después responderás {passage.questions.length} preguntas.</Text>
              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={handleNextPhase}
                style={[styles.ctaBtn, { backgroundColor: accent }]}
              >
                <Text style={styles.ctaBtnText}>Ya leí, continuar al Quiz</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // Quiz phase with slide transitions
          <View style={styles.contentWrap}>
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.qLabel}>Pregunta {qIdx + 1}</Text>
              <Text style={styles.qText}>{passage.questions[qIdx].q}</Text>
              <View style={{ marginTop: 20, gap: 10 }}>
                {passage.questions[qIdx].opts.map((opt, i) => {
                  const isPicked = picked === i;
                  const isCorrect = showFeedback && i === passage.questions[qIdx].correct;
                  const isWrong   = showFeedback && isPicked && i !== passage.questions[qIdx].correct;

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

              {hasSkip && !showFeedback && (
                <View style={styles.skipContainer}>
                  <View style={styles.divider} />
                  <Pressable
                    onPress={handleSkipQuestion}
                    style={[styles.skipBtn, { borderColor: '#F97316' }]}
                  >
                    <Ionicons name="sparkles" size={16} color="#F97316" />
                    <Text style={styles.skipBtnText}>Saltar pregunta (Usar power-up)</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  contentWrap: {
    flex: 1,
  },
  scroll: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  passageTitle: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.ink,
    marginTop: 4,
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  tipBannerText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  passageCardWrap: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    ...Platform.select({
      web: { boxShadow: '0 8px 30px rgba(0,0,0,0.03)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
        elevation: 2,
      },
    }),
  },
  passageCard: {
    padding: 22,
  },
  passageText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 28,
    color: '#334155',
  },
  readingRuler: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 28,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    justifyContent: 'center',
  },
  rulerHandleLeft: {
    position: 'absolute',
    left: 2,
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  rulerHandleRight: {
    position: 'absolute',
    right: 2,
    width: 4,
    height: 14,
    borderRadius: 2,
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 14,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
  },
  ctaBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  qText: {
    fontFamily: FONTS.heading,
    fontSize: 19,
    color: COLORS.ink,
    lineHeight: 26,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionCorrect: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: COLORS.muted,
  },
  optionText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.ink,
    flex: 1,
  },
  skipContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    backgroundColor: '#FFF7ED',
  },
  skipBtnText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: '#EA580C',
  },
});
