import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
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
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

type Phase = 'read' | 'quiz';

interface Props {
  accent?: string;
  onFinish: (result: { correct: number; total: number; wpm: number; time: number }) => void;
  onQuit: () => void;
}

export function ComprehensionExercise({ accent = '#EAB308', onFinish, onQuit }: Props) {
  const basePassage = React.useMemo(() => pickPassage('medium'), []);
  const [passage, setPassage] = useState(basePassage);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [phase, setPhase] = useState<Phase>('read');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Divide text into individual sentences safely for sentence-by-sentence pacing
  const sentences = React.useMemo(() => {
    return passage.text.split(/([.!?]\s+)/).reduce<string[]>((acc, current, index) => {
      if (index % 2 === 0) {
        if (current) acc.push(current);
      } else {
        if (acc.length > 0) {
          acc[acc.length - 1] += current;
        }
      }
      return acc;
    }, []);
  }, [passage.text]);

  const [activeSentence, setActiveSentence] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadAIQuestions() {
      setIsLoadingAI(true);
      try {
        const { data, error } = await invokeEdgeFunction<{ questions: any[] }>('ai-questions', {
          text: basePassage.text,
          count: 3,
        });

        if (error || !data) {
          throw error || new Error('Respuesta de Edge Function vacía');
        }
        if (active && data && data.questions && data.questions.length > 0) {
          setPassage({
            ...basePassage,
            questions: data.questions
          });
        }
      } catch (err) {
        console.warn('Could not load dynamic AI questions, using pre-defined:', err);
      } finally {
        if (active) setIsLoadingAI(false);
      }
    }
    loadAIQuestions();
    return () => { active = false; };
  }, [basePassage]);
  
  const startTime = useRef(Date.now());
  const readStart = useRef(Date.now());
  const readTimeRef = useRef(0);

  // ─── 3D Page Flip and Reading Ruler Reanimated State ──────────────────────
  const pageRotation = useSharedValue(0);
  const rulerY = useSharedValue(16);
  const rulerOpacity = useSharedValue(1);

  // Animate the reading ruler smoothly to the active sentence card
  useEffect(() => {
    if (phase === 'read' && sentences.length > 0) {
      // 12px padding top + estimated Y index offset per card
      const targetY = activeSentence * 74 + 18;
      rulerY.value = withSpring(targetY, { damping: 15, stiffness: 90 });
    }
  }, [activeSentence, phase, sentences.length]);

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

  const handlePressSentence = (idx: number) => {
    setActiveSentence(idx);
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
                {isLoadingAI ? (
                  <View style={styles.aiBadgeLoading}>
                    <ActivityIndicator size="small" color={accent} style={{ marginRight: 6 }} />
                    <Text style={styles.aiBadgeText}>Generando preguntas con IA...</Text>
                  </View>
                ) : (
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={10} color="#8B5CF6" style={{ marginRight: 4 }} />
                    <Text style={[styles.aiBadgeText, { color: '#8B5CF6' }]}>Preguntas Dinámicas con Gemini Flash</Text>
                  </View>
                )}
              </View>

              {/* Informative tips helper */}
              <View style={[styles.tipBanner, { backgroundColor: `${accent}12`, borderColor: `${accent}25` }]}>
                <Ionicons name="bulb" size={16} color={accent} style={{ marginRight: 6 }} />
                <Text style={[styles.tipBannerText, { color: '#374151' }]}>
                  Toca cualquier línea del texto para guiar tus ojos y evitar regresar.
                </Text>
              </View>

              {/* Passage Card Container with Interactive Sentence-by-Sentence pacing */}
              <View style={styles.passageCardWrap}>
                <ScrollView scrollEnabled={false} style={styles.passageCard}>
                  <View style={styles.sentencesContainer}>
                    {sentences.map((sentence, idx) => {
                      const isActive = idx === activeSentence;
                      const isPast = idx < activeSentence;
                      return (
                        <Pressable
                          key={idx}
                          onPress={() => handlePressSentence(idx)}
                          style={[
                            styles.sentenceBlock,
                            isActive && { backgroundColor: accent + '0C', borderColor: accent }
                          ]}
                        >
                          <Text
                            style={[
                              styles.sentenceText,
                              isActive && { color: COLORS.ink, fontFamily: FONTS.headingSemi },
                              isPast && { color: COLORS.muted, opacity: 0.45 },
                              !isActive && !isPast && { color: COLORS.ink }
                            ]}
                          >
                            {sentence}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>


              </View>

              <Text style={styles.hint}>Tómate tu tiempo. Después responderás {passage.questions.length} preguntas.</Text>
              <View style={{ height: 16 }} />
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={() => {
                  if (activeSentence < sentences.length - 1) {
                    setActiveSentence(s => s + 1);
                  } else {
                    handleNextPhase();
                  }
                }}
                style={[styles.ctaBtn, { backgroundColor: accent }]}
              >
                <Text style={styles.ctaBtnText}>
                  {activeSentence < sentences.length - 1 ? 'Siguiente oración' : 'Ya leí, continuar al Quiz'}
                </Text>
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
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderColor: '#E9E3FF',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  aiBadgeLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  aiBadgeText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10,
    color: '#6B7280',
  },
  sentencesContainer: {
    gap: 4,
  },
  sentenceBlock: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    minHeight: 66,
    justifyContent: 'center',
  },
  sentenceText: {
    fontFamily: FONTS.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: '#334155',
  },
});
