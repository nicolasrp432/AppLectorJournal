import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickPassage } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

type Mode = 'rsvp' | 'guide' | 'chunk';
type Phase = 'config' | 'reading' | 'quiz';

interface FocalReadingResult {
  wpm: number;
  mode: Mode;
  time: number;
  comprehension: number;
  correct: number;
  total: number;
}

function PageFlipWrapper({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(600);
  const rotateX = useSharedValue(-25);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 75 });
    rotateX.value = withSpring(0, { damping: 15, stiffness: 75 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { perspective: 1200 },
      { translateY: translateY.value },
      { rotateX: `${rotateX.value}deg` },
    ],
    flex: 1,
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

interface Props {
  initialWpm?: number;
  initialMode?: Mode;
  accent?: string;
  onFinish: (result: FocalReadingResult) => void;
  onQuit: () => void;
}

export function FocalReadingExercise({ initialWpm = 280, initialMode = 'rsvp', accent = '#F97316', onFinish, onQuit }: Props) {
  const passage = React.useMemo(() => pickPassage('medium'), []);
  const words = React.useMemo(() => passage.text.split(/\s+/), [passage]);

  const [wpm, setWpm] = useState(initialWpm);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [chunkSize, setChunkSize] = useState(2);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>('config');
  const startTimeRef = useRef<number>(0);
  const [readSeconds, setReadSeconds] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [qIdx, setQIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ qi: number; oi: number; correct: boolean } | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<{ difficulty: string; explanation: string; suggestedWpm: number } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    let active = true;
    async function analyzeText() {
      setIsLoadingAI(true);
      try {
        // Try to fetch from persistent cache first
        const { data: cachedData, error: cacheError } = await supabase
          .from('reading_analyses')
          .select('difficulty, explanation, suggested_wpm')
          .eq('library_item_id', passage.id)
          .maybeSingle();

        if (!cacheError && cachedData && active) {
          const formatted = {
            difficulty: cachedData.difficulty,
            explanation: cachedData.explanation,
            suggestedWpm: cachedData.suggested_wpm,
          };
          setAiAnalysis(formatted);
          if (formatted.suggestedWpm) {
            setWpm(formatted.suggestedWpm);
          }
          setIsLoadingAI(false);
          return;
        }

        // Invoke Edge Function if not cached via safe utility to bypass local session JWT errors (403)
        const { data, error } = await invokeEdgeFunction<{ difficulty: string; explanation: string; suggestedWpm: number }>('ai-analyze-reading', {
          text: passage.text,
        });

        if (error || !data) {
          throw error || new Error('Respuesta de Edge Function vacía');
        }
        if (data && active) {
          setAiAnalysis(data);
          if (data.suggestedWpm) {
            setWpm(data.suggestedWpm);
          }
          // Persist the result in database for future sessions
          await supabase.from('reading_analyses').insert({
            library_item_id: passage.id,
            difficulty: data.difficulty || 'medio',
            suggested_wpm: data.suggestedWpm || 280,
            explanation: data.explanation || 'Análisis de lectura generado por IA.'
          });
        }
      } catch (err) {
        console.warn('AI reading analysis failed, using defaults:', err);
        if (active) {
          setAiAnalysis({ difficulty: 'medio', explanation: 'Análisis no disponible.', suggestedWpm: 280 });
        }
      } finally {
        if (active) setIsLoadingAI(false);
      }
    }
    analyzeText();
    return () => {
      active = false;
    };
  }, [passage]);

  const progressVal = useSharedValue(0);
  useEffect(() => {
    if (words.length > 1) {
      progressVal.value = withTiming(idx / (words.length - 1), { duration: 150 });
    }
  }, [idx, words.length]);

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progressVal.value * 100}%`,
  }));

  const msPerWord = (60 / wpm) * 1000 * (mode === 'chunk' ? chunkSize : 1);

  const idxRef = useRef(idx);
  useEffect(() => {
    idxRef.current = idx;
  }, [idx]);

  useEffect(() => {
    if (!playing || phase !== 'reading') return;

    let timerId: any = null;

    const tick = () => {
      const step = mode === 'chunk' ? chunkSize : 1;
      const nextIdx = idxRef.current + step;

      if (nextIdx >= words.length) {
        setPlaying(false);
        setReadSeconds((Date.now() - startTimeRef.current) / 1000);
        setPhase('quiz');
      } else {
        idxRef.current = nextIdx;
        setIdx(nextIdx);
        timerId = setTimeout(tick, msPerWord);
      }
    };

    timerId = setTimeout(tick, msPerWord);
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [playing, phase, mode, chunkSize, msPerWord, words.length]);

  const start = () => {
    setIdx(0);
    startTimeRef.current = Date.now();
    setPlaying(true);
    setPhase('reading');
  };

  const handleAnswer = (qi: number, oi: number) => {
    if (feedback !== null) return;
    const correct = passage.questions[qi].correct === oi;
    setFeedback({ qi, oi, correct });
    const newPicked = { ...picked, [qi]: oi };
    setPicked(newPicked);
    setTimeout(() => {
      setFeedback(null);
      if (qi + 1 >= passage.questions.length) {
        const totalCorrect = Object.entries(newPicked).filter(([k, v]) => passage.questions[+k].correct === v).length;
        onFinish({ wpm, mode, time: readSeconds, comprehension: totalCorrect / passage.questions.length, correct: totalCorrect, total: passage.questions.length });
      } else {
        setQIdx(qi + 1);
      }
    }, 1100);
  };

  if (phase === 'config') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={0} accent={accent} onQuit={onQuit} title="Configura" />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.configHeader}>
            <Text style={[styles.eyebrow, { color: COLORS.muted }]}>Lectura Focal</Text>
            <Text style={styles.configTitle}>{passage.title}</Text>
            <Text style={styles.configMeta}>{words.length} palabras · ~{Math.round((words.length / wpm) * 60)}s</Text>
          </View>

          <Text style={styles.sectionLabel}>Modo</Text>
          <View style={styles.modeRow}>
            {([
              { k: 'rsvp' as Mode,  l: 'RSVP',  d: 'Palabra fija' },
              { k: 'guide' as Mode, l: 'Guía',   d: 'Highlight' },
              { k: 'chunk' as Mode, l: 'Chunks', d: '2-3 palabras' },
            ]).map(m => (
              <Pressable key={m.k} onPress={() => setMode(m.k)} style={[styles.modeBtn, mode === m.k && { backgroundColor: accent }]}>
                <Text style={[styles.modeBtnTitle, mode === m.k && { color: '#fff' }]}>{m.l}</Text>
                <Text style={[styles.modeBtnDesc, mode === m.k && { color: 'rgba(255,255,255,0.8)' }]}>{m.d}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.wpmCard}>
            <View style={styles.wpmRow}>
              <Text style={styles.sectionLabel}>Velocidad</Text>
              <Text style={[styles.wpmValue, { color: accent }]}>{wpm} <Text style={styles.wpmUnit}>WPM</Text></Text>
            </View>
            <View style={styles.wpmControls}>
              {[200, 300, 400, 500, 600, 700].map(v => (
                <Pressable key={v} onPress={() => setWpm(v)} style={[styles.wpmPill, wpm === v && { backgroundColor: accent }]}>
                  <Text style={[styles.wpmPillText, wpm === v && { color: '#fff' }]}>{v}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.wpmStepper}>
              <Pressable onPress={() => setWpm(w => Math.max(150, w - 10))} style={styles.stepBtn}><Text style={styles.stepBtnText}>−10</Text></Pressable>
              <View style={styles.wpmDisplay}>
                <Text style={[styles.wpmDisplayText, { color: accent }]}>{wpm}</Text>
              </View>
              <Pressable onPress={() => setWpm(w => Math.min(800, w + 10))} style={styles.stepBtn}><Text style={styles.stepBtnText}>+10</Text></Pressable>
            </View>
          </View>

          {mode === 'chunk' && (
            <View style={styles.chunkRow}>
              <Text style={styles.sectionLabel}>Chunk</Text>
              {[2, 3].map(c => (
                <Pressable key={c} onPress={() => setChunkSize(c)} style={[styles.chunkBtn, chunkSize === c && { backgroundColor: accent }]}>
                  <Text style={[styles.chunkBtnText, chunkSize === c && { color: '#fff' }]}>{c} pal</Text>
                </Pressable>
              ))}
            </View>
          )}

          {isLoadingAI && (
            <View style={styles.aiAnalysisLoading}>
              <ActivityIndicator size="small" color={accent} style={{ marginRight: 8 }} />
              <Text style={styles.aiAnalysisLoadingText}>Analizando complejidad del texto con IA...</Text>
            </View>
          )}

          {!isLoadingAI && aiAnalysis && (
            <View style={styles.aiAnalysisBox}>
              <View style={styles.aiAnalysisHeader}>
                <Ionicons name="sparkles" size={16} color={accent} />
                <Text style={styles.aiAnalysisTitle}>Análisis de Complejidad IA</Text>
              </View>
              <Text style={styles.aiAnalysisText}>
                Dificultad estimada: <Text style={{ fontFamily: FONTS.headingSemi, color: aiAnalysis.difficulty === 'dificil' ? '#EF4444' : aiAnalysis.difficulty === 'medio' ? '#F59E0B' : '#10B981', textTransform: 'uppercase' }}>{aiAnalysis.difficulty}</Text>
              </Text>
              <Text style={styles.aiAnalysisExplanation}>{aiAnalysis.explanation}</Text>
              <Text style={[styles.aiAnalysisWpmSuggest, { color: accent }]}>
                Velocidad sugerida: {aiAnalysis.suggestedWpm} WPM
              </Text>
            </View>
          )}

          <View style={[styles.tipBox, { backgroundColor: accent + '10', borderColor: accent + '25' }]}>
            <Text style={[styles.tipText, { color: '#374151' }]}>
              <Text style={{ color: accent, fontFamily: FONTS.headingSemi }}>Tip: </Text>
              Después leerás {passage.questions.length} preguntas. La comprensión cuenta tanto como la velocidad.
            </Text>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
        <View style={styles.footer}>
          <Pressable onPress={start} style={[styles.startBtn, { backgroundColor: accent }]}>
            <Text style={styles.startBtnText}>Empezar lectura</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'reading') {
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={-1} accent={accent} onQuit={onQuit} title={`${wpm} WPM`} />
        <View style={{ flex: 1, minHeight: 0 }}>
          <View style={styles.displayArea}>
            {mode === 'rsvp'  && (
              <RSVPDisplay word={words[idx]} accent={accent} />
            )}
            {mode === 'guide' && <GuideDisplay words={words} idx={idx} accent={accent} />}
            {mode === 'chunk' && <ChunkDisplay words={words} idx={idx} chunkSize={chunkSize} accent={accent} />}
          </View>
          <View style={styles.controls}>
            {/* 1. Primary Playback Control Row */}
            <View style={styles.playbackRow}>
              <Pressable
                onPress={() => setIdx(i => Math.max(0, i - 5))}
                style={({ pressed }) => [styles.secondaryControlBtn, pressed && styles.controlBtnPressed]}
              >
                <Ionicons name="play-back" size={20} color={COLORS.inkLight} />
              </Pressable>

              <Pressable
                onPress={() => setPlaying(p => !p)}
                style={({ pressed }) => [
                  styles.primaryPlayBtn,
                  { backgroundColor: accent },
                  pressed && styles.controlBtnPressed
                ]}
              >
                <Ionicons name={playing ? 'pause' : 'play'} size={28} color="#FFF" style={{ marginLeft: playing ? 0 : 2 }} />
              </Pressable>

              <Pressable
                onPress={() => setIdx(i => Math.min(words.length - 1, i + 5))}
                style={({ pressed }) => [styles.secondaryControlBtn, pressed && styles.controlBtnPressed]}
              >
                <Ionicons name="play-forward" size={20} color={COLORS.inkLight} />
              </Pressable>
            </View>

            {/* 2. WPM Controller Row */}
            <View style={styles.wpmStepperRow}>
              <Pressable
                onPress={() => setWpm(w => Math.max(150, w - 10))}
                style={({ pressed }) => [styles.wpmStepBtn, pressed && styles.controlBtnPressed]}
              >
                <Ionicons name="remove" size={18} color={COLORS.muted} />
              </Pressable>

              <View style={styles.wpmDisplayBadge}>
                <Ionicons name="speedometer-outline" size={16} color={accent} style={{ marginRight: 6 }} />
                <Text style={[styles.wpmTextValue, { color: COLORS.ink }]}>
                  {wpm} <Text style={{ fontSize: 10, fontFamily: FONTS.body, color: COLORS.muted }}>WPM</Text>
                </Text>
              </View>

              <Pressable
                onPress={() => setWpm(w => Math.min(800, w + 10))}
                style={({ pressed }) => [styles.wpmStepBtn, pressed && styles.controlBtnPressed]}
              >
                <Ionicons name="add" size={18} color={COLORS.muted} />
              </Pressable>
            </View>

            {/* 3. Visual Progress Bar */}
            <View style={styles.progressRow}>
              <View style={styles.progressBarContainer}>
                <Animated.View style={[styles.progressBarFill, { backgroundColor: accent }, animatedProgressStyle]} />
              </View>
              <Text style={styles.progressText}>
                Palabra {Math.min(words.length, idx + 1)} de {words.length}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Quiz phase
  const q = passage.questions[qIdx];
  return (
    <PageFlipWrapper>
      <View style={[styles.container, { flex: 1 }]}>
        <ExerciseTopBar progress={qIdx / passage.questions.length} accent={accent} onQuit={onQuit} title={`Pregunta ${qIdx + 1}/${passage.questions.length}`} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>Comprensión</Text>
          <Text style={styles.questionText}>{q.q}</Text>
          <View style={{ marginTop: 18, gap: 8 }}>
            {q.opts.map((opt, i) => {
              const isPicked = picked[qIdx] === i;
              const showCorrect = feedback && i === q.correct;
              const showWrong = feedback && isPicked && i !== q.correct;
              return (
                <Pressable
                  key={i}
                  onPress={() => handleAnswer(qIdx, i)}
                  disabled={!!feedback}
                  style={[
                    styles.optionBtn,
                    showCorrect && styles.optionCorrect,
                    showWrong && styles.optionWrong,
                    isPicked && !showCorrect && !showWrong && { backgroundColor: accent + '15', borderColor: accent },
                  ]}
                >
                  <View style={[styles.optionBadge, showCorrect && { backgroundColor: '#22C55E' }, showWrong && { backgroundColor: '#EF4444' }]}>
                    <Text style={[styles.optionBadgeText, (showCorrect || showWrong) && { color: '#fff' }]}>
                      {showCorrect ? '✓' : showWrong ? '✕' : String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={styles.optionText}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </PageFlipWrapper>
  );
}

function RSVPDisplay({ word, accent }: { word: string; accent: string }) {
  if (!word) return <View />;
  const orpIdx = Math.max(0, Math.min(word.length - 1, Math.floor(word.length * 0.35)));
  const prefix = word.slice(0, orpIdx);
  const orpLetter = word[orpIdx];
  const suffix = word.slice(orpIdx + 1);

  return (
    <View style={rsvpStyles.container}>
      <View style={rsvpStyles.wordContainer}>
        <View style={rsvpStyles.prefixAlign}>
          <Text style={rsvpStyles.wordTextSide}>{prefix}</Text>
        </View>
        <Text style={[rsvpStyles.wordTextORP, { color: accent }]}>{orpLetter}</Text>
        <View style={rsvpStyles.suffixAlign}>
          <Text style={rsvpStyles.wordTextSide}>{suffix}</Text>
        </View>
      </View>
    </View>
  );
}

function GuideDisplay({ words, idx, accent }: { words: string[]; idx: number; accent: string }) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Estimate line position: ~34px line height, ~8 words per line
    const approxLine = Math.floor(idx / 8);
    const y = approxLine * 34;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
  }, [idx]);

  return (
    <ScrollView ref={scrollRef} scrollEnabled={false} style={{ flex: 1 }} contentContainerStyle={guideStyles.content}>
      <View style={[guideStyles.pacer, { borderLeftColor: accent, backgroundColor: accent + '10' }]} pointerEvents="none" />
      <Text style={guideStyles.text}>
        {words.map((w, i) => (
          <Text
            key={i}
            style={[
              guideStyles.word,
              i < idx  ? { color: '#B4B0AA' } : null,
              i === idx ? { backgroundColor: accent, color: '#fff', borderRadius: 6, paddingHorizontal: 4 } : null,
            ]}
          >
            {w + (i < words.length - 1 ? ' ' : '')}
          </Text>
        ))}
      </Text>
    </ScrollView>
  );
}

function ChunkDisplay({ words, idx, chunkSize, accent }: { words: string[]; idx: number; chunkSize: number; accent: string }) {
  const chunk = words.slice(idx, idx + chunkSize).join(' ');
  return (
    <View style={chunkStyles.container}>
      <Text style={[chunkStyles.text, { borderBottomColor: accent }]}>{chunk}</Text>
    </View>
  );
}

const rsvpStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
    minHeight: 120,
  },
  wordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  prefixAlign: { flex: 1, alignItems: 'flex-end' },
  suffixAlign: { flex: 1, alignItems: 'flex-start' },
  wordTextSide: {
    fontFamily: FONTS.body,
    fontSize: 34,
    color: '#475569',
    letterSpacing: 0.5,
  },
  wordTextORP: {
    fontFamily: FONTS.heading,
    fontSize: 36,
    fontWeight: '900',
    marginHorizontal: 2,
  },
});

const guideStyles = StyleSheet.create({
  content:  { padding: 22, paddingBottom: 200 },
  pacer:    { position: 'absolute', left: 8, right: 8, top: 0, height: 34, borderLeftWidth: 3, borderRadius: 8 },
  text:     { fontFamily: FONTS.body, fontSize: 18, lineHeight: 34, color: COLORS.ink },
  word:     { fontFamily: FONTS.body, fontSize: 18, lineHeight: 34 },
});

const chunkStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  text:      { fontFamily: FONTS.body, fontSize: 28, color: COLORS.ink, textAlign: 'center', borderBottomWidth: 2, paddingBottom: 6 },
});

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.canvas },
  scroll:        { padding: 20 },
  configHeader:  { alignItems: 'center', marginBottom: 20 },
  eyebrow:       { fontFamily: FONTS.headingSemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 },
  configTitle:   { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, marginTop: 4 },
  configMeta:    { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 4 },
  sectionLabel:  { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  modeRow:       { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modeBtn:       { flex: 1, padding: 10, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  modeBtnTitle:  { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
  modeBtnDesc:   { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, marginTop: 2 },
  wpmCard:       { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  wpmRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  wpmValue:      { fontFamily: FONTS.heading, fontSize: 22 },
  wpmUnit:       { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },
  wpmControls:   { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  wpmPill:       { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: COLORS.surface },
  wpmPillText:   { fontFamily: FONTS.headingSemi, fontSize: 12, color: COLORS.muted },
  wpmStepper:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  stepBtn:       { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surface, borderRadius: 10 },
  stepBtnText:   { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
  wpmDisplay:    { paddingHorizontal: 16 },
  wpmDisplayText:{ fontFamily: FONTS.heading, fontSize: 18 },
  chunkRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  chunkBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.surface },
  chunkBtnText:  { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
  tipBox:        { borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 8 },
  tipText:       { fontFamily: FONTS.body, fontSize: 12, lineHeight: 18 },
  footer:        { padding: 16, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface },
  startBtn:      { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  startBtnText:  { fontFamily: FONTS.heading, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  displayArea:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 8,
  },
  progressRow: {
    alignItems: 'center',
    width: '100%',
  },
  progressBarContainer: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  primaryPlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  controlBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  wpmStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 4,
  },
  wpmStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wpmDisplayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wpmTextValue: {
    fontFamily: FONTS.heading,
    fontSize: 14,
  },
  questionText:  { fontFamily: FONTS.heading, fontSize: 19, color: COLORS.ink, lineHeight: 26, marginTop: 8 },
  optionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  optionWrong:   { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionBadge:   { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  optionBadgeText:{ fontFamily: FONTS.heading, fontSize: 11, color: COLORS.muted },
  optionText:    { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink, flex: 1 },
  aiAnalysisBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 8,
  },
  aiAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiAnalysisTitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiAnalysisText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#334155',
  },
  aiAnalysisExplanation: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  aiAnalysisWpmSuggest: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    marginTop: 2,
  },
  aiAnalysisLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  aiAnalysisLoadingText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: '#64748B',
  },
});
