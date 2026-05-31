import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseTopBar } from './ExerciseTopBar';
import { MascotChar } from '../ui/MascotChar';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { usePrefsStore } from '../../store/usePrefsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Phase = 'intro' | 'read' | 'quiz' | 'result';

interface Props {
  accent?: string;
  onFinish: (result: { correct: number; total: number; wpm: number; time: number; comprehension: number }) => void;
  onQuit: () => void;
}

const PASSAGE = {
  title: 'El Cerebro y la Lectura',
  text: 'Cuando lees, tu cerebro no realiza un escaneo continuo de las palabras, sino que da pequeños saltos llamados sacadas. Durante estas sacadas, que duran unos pocos milisegundos, estás funcionalmente ciego. El procesamiento real del texto ocurre durante las pausas entre saltos, conocidas como fijaciones. Un lector promedio realiza una fijación por cada palabra, lo que limita su velocidad a unas doscientas cincuenta palabras por minuto. Sin embargo, el cerebro es altamente plástico y flexible. Con el entrenamiento adecuado de visión periférica y la eliminación de la subvocalización, es posible capturar de tres a cuatro palabras por fijación. Esto te permite duplicar o triplicar tu velocidad de lectura sin sacrificar la comprensión, abriendo una ventana directa al conocimiento eficiente.',
  words: 125,
  questions: [
    {
      q: '¿Cómo se llaman los saltos oculares que ocurren durante la lectura?',
      opts: ['Fijaciones', 'Sacadas', 'Subvocalizaciones', 'Regresiones'],
      correct: 1,
    },
    {
      q: '¿Cuándo ocurre el procesamiento real del texto por parte del cerebro?',
      opts: ['Durante las sacadas', 'Durante las fijaciones', 'Al parpadear', 'Al subvocalizar'],
      correct: 1,
    },
    {
      q: '¿Cuál es el beneficio de entrenar la visión periférica?',
      opts: ['Ver en la oscuridad', 'Evitar parpadear', 'Capturar más palabras por fijación', 'Disminuir las pausas cerebrales'],
      correct: 2,
    },
  ],
};

export function ReadingSpeedTest({ accent = '#F97316', onFinish, onQuit }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [isReadingStarted, setIsReadingStarted] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [calculatedWpm, setCalculatedWpm] = useState(280);
  const [comprehensionScore, setComprehensionScore] = useState(0);

  const testStart = useRef(Date.now());
  const readStart = useRef(Date.now());
  const readTimeRef = useRef(0);

  const triggerFadeTransition = (nextPhaseCallback: () => void) => {
    nextPhaseCallback();
  };

  const handleStartReading = () => {
    triggerFadeTransition(() => {
      setPhase('read');
      setIsReadingStarted(false);
    });
  };

  const handleRevealText = () => {
    readStart.current = Date.now();
    setIsReadingStarted(true);
  };

  const handleFinishReading = () => {
    readTimeRef.current = (Date.now() - readStart.current) / 1000;
    triggerFadeTransition(() => {
      setPhase('quiz');
    });
  };

  const handlePick = (i: number) => {
    if (showFeedback) return;
    setPicked(i);
    setShowFeedback(true);
    
    setTimeout(() => {
      const correct = i === PASSAGE.questions[qIdx].correct;
      const newAnswers = [...answers, correct];
      setAnswers(newAnswers);
      setPicked(null);
      setShowFeedback(false);
      
      if (qIdx + 1 >= PASSAGE.questions.length) {
        const totalCorrect = newAnswers.filter(Boolean).length;
        const comp = totalCorrect / PASSAGE.questions.length;
        setComprehensionScore(comp);

        const wpm = readTimeRef.current > 0 ? Math.round((PASSAGE.words / readTimeRef.current) * 60) : 250;
        const finalWpm = Math.max(100, Math.min(800, wpm)); // Clamp to sensible bounds
        setCalculatedWpm(finalWpm);

        // If comprehension is sufficient (>= 60%), update the user defaults!
        if (comp >= 0.6) {
          usePrefsStore.getState().update({ wpm_default: finalWpm }).catch(err => {
            console.warn('Failed to update wpm_default in store:', err);
          });
        }

        triggerFadeTransition(() => {
          setPhase('result');
        });
      } else {
        setQIdx(i => i + 1);
      }
    }, 1100);
  };

  const handleCloseResults = () => {
    onFinish({
      correct: answers.filter(Boolean).length,
      total: PASSAGE.questions.length,
      wpm: calculatedWpm,
      time: (Date.now() - testStart.current) / 1000,
      comprehension: comprehensionScore,
    });
  };



  if (phase === 'intro') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={0} accent={accent} onQuit={onQuit} title="Test de Velocidad" />
        <View style={styles.contentWrap}>
          <ScrollView contentContainerStyle={styles.centerScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.mascotWrapper}>
              <MascotChar which="swift" size={130} expression="wow" />
            </View>
            <Text style={styles.title}>Diagnóstico Inicial</Text>
            <Text style={styles.subtitle}>
              Para adaptar la experiencia a tus capacidades, mediremos tu velocidad y comprensión lectora base en tres pasos rápidos.
            </Text>

            <View style={styles.stepsCard}>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: accent }]}>
                  <Text style={styles.stepDotText}>1</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Revela y lee el texto</Text>
                  <Text style={styles.stepDesc}>Te presentaremos un texto corto. No corras, lee a tu velocidad cómoda de comprensión.</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: accent }]}>
                  <Text style={styles.stepDotText}>2</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>Responde 3 preguntas</Text>
                  <Text style={styles.stepDesc}>Evaluaremos tu nivel de retención. Necesitamos al menos 60% de comprensión para validar el test.</Text>
                </View>
              </View>
              <View style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: accent }]}>
                  <Text style={styles.stepDotText}>3</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>¡Obtén tu nivel base!</Text>
                  <Text style={styles.stepDesc}>Calibraremos la velocidad base de los ejercicios futuros de acuerdo a tu puntuación.</Text>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable onPress={handleStartReading} style={[styles.ctaBtn, { backgroundColor: accent }]}>
              <Text style={styles.ctaBtnText}>Comenzar Diagnóstico</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'read') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={0.3} accent={accent} onQuit={onQuit} title="Paso 1: Lee a Conciencia" />
        <View style={styles.contentWrap}>
          <View style={styles.contentWrap}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>Lectura Diagnóstica</Text>
                <Text style={styles.passageTitle}>{PASSAGE.title}</Text>
              </View>

              {!isReadingStarted ? (
                <View style={styles.placeholderCard}>
                  <Ionicons name="eye-off-outline" size={48} color={accent} style={{ marginBottom: 12 }} />
                  <Text style={styles.placeholderTitle}>Texto Oculto</Text>
                  <Text style={styles.placeholderDesc}>
                    Pulsa el botón de abajo para revelar el texto y comenzar a medir tu velocidad inicial.
                  </Text>
                </View>
              ) : (
                <View style={styles.passageCardWrap}>
                  <View style={styles.passageCard}>
                    <Text style={styles.passageText}>{PASSAGE.text}</Text>
                  </View>
                </View>
              )}

              {isReadingStarted && (
                <Text style={styles.hint}>Toca "Terminé de leer" inmediatamente al acabar la última palabra.</Text>
              )}
              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={styles.footer}>
              {!isReadingStarted ? (
                <Pressable onPress={handleRevealText} style={[styles.ctaBtn, { backgroundColor: accent }]}>
                  <Text style={styles.ctaBtnText}>👁️ Revelar Texto e Iniciar</Text>
                </Pressable>
              ) : (
                <Pressable onPress={handleFinishReading} style={[styles.ctaBtn, { backgroundColor: '#22C55E' }]}>
                  <Text style={styles.ctaBtnText}>Terminé de leer ⚡</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (phase === 'quiz') {
    const q = PASSAGE.questions[qIdx];
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={0.3 + (qIdx / PASSAGE.questions.length) * 0.5} accent={accent} onQuit={onQuit} title={`Pregunta ${qIdx + 1}/3`} />
        <View style={styles.contentWrap}>
          <View style={styles.contentWrap}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.qLabel}>Pregunta {qIdx + 1} de 3</Text>
              <Text style={styles.qText}>{q.q}</Text>
              <View style={{ marginTop: 20, gap: 10 }}>
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
        </View>
      </View>
    );
  }

  // Result phase
  const validated = comprehensionScore >= 0.6;
  return (
    <View style={styles.container}>
      <ExerciseTopBar progress={1.0} accent={accent} onQuit={onQuit} title="Resultados del Test" />
      <View style={styles.contentWrap}>
        <ScrollView contentContainerStyle={styles.centerScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotWrapper}>
            <MascotChar which={validated ? 'joy' : 'calm'} size={120} expression={validated ? 'happy' : 'sleepy'} />
          </View>

          <Text style={styles.title}>{validated ? '¡Diagnóstico Listo!' : 'Test no Concluyente'}</Text>
          <Text style={styles.subtitle}>
            {validated 
              ? 'Hemos medido tu velocidad y comprensión con éxito. Tus configuraciones de lectura han sido actualizadas.'
              : 'Tu comprensión fue menor al 60%. Es probable que hayas leído con prisa. Mantendremos la velocidad recomendada base de 280 WPM para entrenar tu foco.'
            }
          </Text>

          <View style={styles.resultStatsCard}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Velocidad</Text>
              <Text style={[styles.statValue, { color: accent }]}>{validated ? calculatedWpm : 280}</Text>
              <Text style={styles.statUnit}>WPM</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Comprensión</Text>
              <Text style={[styles.statValue, { color: validated ? '#22C55E' : '#EF4444' }]}>
                {Math.round(comprehensionScore * 100)}%
              </Text>
              <Text style={styles.statUnit}>{answers.filter(Boolean).length}/3 Respuestas</Text>
            </View>
          </View>

          <View style={styles.insightBox}>
            <Ionicons name="sparkles" size={18} color={accent} style={{ marginRight: 8 }} />
            <Text style={styles.insightText}>
              {validated
                ? `¡Excelente! Empezarás tu entrenamiento lector en el nivel de ${calculatedWpm} WPM. Esto personalizará tu experiencia en cada ejercicio.`
                : 'Consejo: La velocidad no sirve sin comprensión. Intenta fijar la mirada en cada línea concentrándote plenamente en absorber los conceptos, no solo en acabar rápido.'
              }
            </Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={handleCloseResults} style={[styles.ctaBtn, { backgroundColor: accent }]}>
            <Text style={styles.ctaBtnText}>Continuar Entrenamiento</Text>
          </Pressable>
        </View>
      </View>
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
    width: '100%',
  },
  scroll: {
    padding: 20,
  },
  centerScroll: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotWrapper: {
    marginVertical: 14,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FONTS.bodyLight,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    width: '100%',
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepDotText: {
    color: '#fff',
    fontFamily: FONTS.headingBold,
    fontSize: 12,
  },
  stepTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
  },
  stepDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 16,
    marginTop: 2,
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
  placeholderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
    marginVertical: 10,
  },
  placeholderTitle: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    color: COLORS.ink,
    marginBottom: 8,
  },
  placeholderDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  passageCardWrap: {
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
    fontSize: 16,
    lineHeight: 30,
    color: '#334155',
  },
  hint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
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
    width: '100%',
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
  resultStatsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1.5,
    height: 50,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.headingBold,
    fontSize: 32,
    lineHeight: 36,
  },
  statUnit: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  insightBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 16,
  },
  insightText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    flex: 1,
  },
});
