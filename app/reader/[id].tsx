import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useLibraryStore } from '../../store/useLibraryStore';
import { useProfileStore } from '../../store/useProfileStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { useQuizCacheStore, QuizQuestion } from '../../store/useQuizCacheStore';
import { supabase } from '../../lib/supabase';
import { MascotChar } from '../../components/ui/MascotChar';
import { PushButton } from '../../components/ui/PushButton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { XPBanner } from '../../components/ui/XPBanner';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

type ReaderPhase = 'setup' | 'reading' | 'quiz' | 'done';
type ReadMode = 'rsvp' | 'scroll';

const ACCENT = COLORS.swift;

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `h_${Math.abs(hash)}`;
}

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get, update } = useLibraryStore();
  const { addXP } = useProfileStore();
  const prefs = usePrefsStore(s => s.prefs);
  const defaultWpm = prefs?.wpm_default;

  const isDyslexia = prefs?.dyslexia_font ?? false;
  const fontSize = prefs?.font_size || 16;
  const lineHeight = isDyslexia ? Math.round(fontSize * 1.8) : Math.round(fontSize * 1.5);
  const letterSpacing = isDyslexia ? 1.5 : undefined;

  let fontBg = 'Lexend_400Regular';
  let fontHeading = 'Nunito_900Black';

  if (isDyslexia) {
    fontBg = 'Georgia';
    fontHeading = 'Georgia';
  } else {
    const family = prefs?.font_family ?? 'Lexend';
    if (family === 'Nunito') {
      fontBg = 'Nunito_700Bold';
      fontHeading = 'Nunito_900Black';
    } else if (family === 'Georgia') {
      fontBg = 'Georgia';
      fontHeading = 'Georgia';
    }
  }

  const book = get(id ?? '');

  const [phase, setPhase] = useState<ReaderPhase>('setup');
  const [mode, setMode] = useState<ReadMode>('rsvp');
  const [wpm, setWpm] = useState(defaultWpm || 250);
  const [wordIdx, setWordIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Quiz state variables
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const startRef = useRef(Date.now());
  const hasScrollStarted = useRef(false);
  const scrollStartRef = useRef(Date.now());

  const words = React.useMemo(
    () => (book?.content ? book.content.split(/\s+/).filter(Boolean) : []),
    [book?.content],
  );

  // Resume RSVP from saved progress position
  const resumeWordIdx = React.useMemo(
    () => Math.floor((book?.progress ?? 0) * words.length),
    [book?.progress, words.length],
  );

  const msPerWord = (60 / wpm) * 1000;

  // RSVP engine
  useEffect(() => {
    if (!playing || mode !== 'rsvp' || phase !== 'reading') return;
    if (wordIdx >= words.length) {
      setPlaying(false);
      finishSession();
      return;
    }
    const t = setTimeout(() => setWordIdx(i => i + 1), msPerWord);
    return () => clearTimeout(t);
  }, [wordIdx, playing, msPerWord, mode, words.length, phase]);

  const getReadSlice = () => {
    if (!book?.content) return '';
    if (mode === 'scroll') {
      const end = Math.floor(scrollPct * book.content.length);
      const start = Math.max(0, end - 3000); // last 3000 characters
      return book.content.substring(start, end).trim();
    } else {
      const totalWords = words.length;
      const currentWordCount = Math.min(wordIdx, totalWords);
      const start = Math.max(0, currentWordCount - 500);
      return words.slice(start, currentWordCount).join(' ').trim();
    }
  };

  const finishSession = async () => {
    const progress = mode === 'scroll'
      ? scrollPct
      : (words.length > 0 ? Math.min(1, wordIdx / words.length) : 0);

    const slice = getReadSlice();
    const sliceWords = slice.split(/\s+/).filter(Boolean).length;

    if (book?.id && progress > 0) {
      update(book.id, {
        progress,
        last_read_at: new Date().toISOString(),
      });
    }

    if (book && sliceWords >= 40) {
      const sliceHash = simpleHash(slice);
      setLoadingQuiz(true);
      setPhase('quiz');

      try {
        const quizCacheStore = useQuizCacheStore.getState();
        await quizCacheStore.fetchQuizzes(book.id);
        const cached = quizCacheStore.getQuiz(book.id, sliceHash);

        if (cached && cached.questions && cached.questions.length > 0) {
          setActiveQuiz(cached.questions);
          setQIdx(0);
          setQuizScore(0);
          setLoadingQuiz(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke('ai-questions', {
          body: { text: slice, count: 3 }
        });

        if (error) throw error;
        if (data && data.questions && data.questions.length > 0) {
          await quizCacheStore.insertQuiz(book.id, sliceHash, data.questions);
          setActiveQuiz(data.questions);
          setQIdx(0);
          setQuizScore(0);
        } else {
          throw new Error('No se pudieron generar preguntas de comprensión.');
        }
      } catch (err: any) {
        console.warn('AI Quiz generation failed, bypassing to done phase:', err);
        completeSessionXP(progress, 0);
      } finally {
        setLoadingQuiz(false);
      }
    } else {
      completeSessionXP(progress, 0);
    }
  };

  const completeSessionXP = (progress: number, score: number) => {
    const baseXP = Math.floor(50 * progress);
    const bonusXP = score * 15; // +15 XP bonus per correct answer
    const totalXP = baseXP + bonusXP;
    setXpEarned(totalXP);

    if (book?.id && progress > 0) {
      addXP(totalXP);
    }

    setPhase('done');
    if (totalXP > 0) setShowBanner(true);
  };

  const handleAnswerSelect = (oi: number) => {
    setPicked(oi);
    setShowFeedback(true);
    const isCorrect = activeQuiz[qIdx].correct === oi;
    if (isCorrect) {
      setQuizScore(s => s + 1);
    }

    setTimeout(() => {
      setPicked(null);
      setShowFeedback(false);

      if (qIdx + 1 >= activeQuiz.length) {
        const finalScore = quizScore + (isCorrect ? 1 : 0);
        const progress = mode === 'scroll'
          ? scrollPct
          : (words.length > 0 ? Math.min(1, wordIdx / words.length) : 0);
        completeSessionXP(progress, finalScore);
      } else {
        setQIdx(idx => idx + 1);
      }
    }, 1500);
  };

  const handleBack = () => {
    const progress = mode === 'scroll'
      ? scrollPct
      : (words.length > 0 ? Math.min(1, wordIdx / words.length) : 0);
    if (book?.id) {
      update(book.id, {
        progress,
        last_read_at: new Date().toISOString(),
      });
    }
    router.back();
  };

  const startReading = () => {
    startRef.current = Date.now();
    setWordIdx(resumeWordIdx);
    setScrollPct(book?.progress ?? 0);
    setPhase('reading');
    if (mode === 'rsvp') setPlaying(true);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!hasScrollStarted.current) {
      hasScrollStarted.current = true;
      scrollStartRef.current = Date.now();
    }
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      setScrollPct(Math.min(1, contentOffset.y / maxScroll));
    }
  };

  if (!book) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Libro no encontrado</Text>
          <Pressable onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkText}>← Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Setup phase ──────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    const hasContent = !!book.content && words.length > 0;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.setupScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotRow}>
            <MascotChar which="swift" size={90} />
          </View>

          <Text style={styles.bookTitle} numberOfLines={2}>{book.title}</Text>
          {book.author && <Text style={styles.bookAuthor}>{book.author}</Text>}

          {hasContent ? (
            <>
              <Text style={styles.bookMeta}>
                {words.length.toLocaleString()} palabras
                {book.progress && book.progress > 0
                  ? ` · ${Math.round(book.progress * 100)}% leído`
                  : ''}
              </Text>

              {/* Mode selector */}
              <Text style={styles.sectionLabel}>Modo de lectura</Text>
              <View style={styles.modeRow}>
                {([
                  { k: 'rsvp' as ReadMode,  label: 'RSVP',   desc: 'Palabra a palabra' },
                  { k: 'scroll' as ReadMode, label: 'Scroll', desc: 'Texto completo' },
                ]).map(m => (
                  <Pressable
                    key={m.k}
                    onPress={() => setMode(m.k)}
                    style={[styles.modePill, mode === m.k && { backgroundColor: ACCENT, borderColor: ACCENT }]}
                  >
                    <Text style={[styles.modePillLabel, mode === m.k && { color: '#fff' }]}>{m.label}</Text>
                    <Text style={[styles.modePillDesc, mode === m.k && { color: '#fff' }]}>{m.desc}</Text>
                  </Pressable>
                ))}
              </View>

              {/* WPM stepper (only for RSVP) */}
              {mode === 'rsvp' && (
                <>
                  <Text style={styles.sectionLabel}>Velocidad</Text>
                  <View style={styles.wpmRow}>
                    <Pressable
                      onPress={() => setWpm(w => Math.max(100, w - 25))}
                      style={styles.wpmBtn}
                    >
                      <Ionicons name="remove" size={24} color={COLORS.ink} />
                    </Pressable>
                    <View style={styles.wpmDisplay}>
                      <Text style={[styles.wpmValue, { color: ACCENT }]}>{wpm}</Text>
                      <Text style={styles.wpmUnit}>WPM</Text>
                    </View>
                    <Pressable
                      onPress={() => setWpm(w => Math.min(800, w + 25))}
                      style={styles.wpmBtn}
                    >
                      <Ionicons name="add" size={24} color={COLORS.ink} />
                    </Pressable>
                  </View>
                </>
              )}

              <View style={{ height: 24 }} />
              <PushButton color={ACCENT} onPress={startReading}>
                {resumeWordIdx > 0 ? `Continuar (${Math.round((book.progress ?? 0) * 100)}% leído)` : 'Comenzar lectura'}
              </PushButton>
              {resumeWordIdx > 0 && (
                <Pressable
                  onPress={() => { setWordIdx(0); setScrollPct(0); startReading(); }}
                  style={{ alignItems: 'center', paddingVertical: 10 }}
                >
                  <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted }}>
                    Empezar desde el principio
                  </Text>
                </Pressable>
              )}
            </>
          ) : (
            <View style={styles.noContentBox}>
              <Text style={styles.noContentText}>
                Este libro no tiene texto disponible.{'\n'}
                Agrega texto personalizado desde Biblioteca.
              </Text>
              <Pressable onPress={() => router.back()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Volver a Biblioteca</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Reading phase (RSVP) ─────────────────────────────────────────────────────
  if (phase === 'reading' && mode === 'rsvp') {
    const currentWord = words[Math.min(wordIdx, words.length - 1)] ?? '';
    const progress = words.length > 0 ? wordIdx / words.length : 0;

    return (
      <View style={styles.safe}>
        {/* Top bar */}
        <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.canvas }}>
          <View style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
            </Pressable>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <ProgressBar value={progress} color={ACCENT} height={6} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
          </View>
        </SafeAreaView>

        {/* RSVP word display */}
        <View style={styles.rsvpContainer}>
          <View style={styles.focusLines}>
            <View style={[styles.focusLine, { backgroundColor: ACCENT }]} />
            <View style={styles.wordBox}>
              <Text style={[styles.rsvpWord, { color: COLORS.ink, fontFamily: fontHeading, fontSize: isDyslexia ? 38 : 36, letterSpacing }]}>
                {currentWord}
              </Text>
            </View>
            <View style={[styles.focusLine, { backgroundColor: ACCENT }]} />
          </View>
          <Text style={styles.rsvpCounter}>{wordIdx}/{words.length}</Text>
        </View>

        {/* Controls */}
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: COLORS.white }}>
          <View style={styles.rsvpControls}>
            <Pressable
              onPress={() => setWpm(w => Math.max(100, w - 25))}
              style={styles.wpmBtn}
            >
              <Ionicons name="remove" size={22} color={COLORS.ink} />
            </Pressable>
            <Pressable
              onPress={() => setPlaying(p => !p)}
              style={[styles.playBtn, { backgroundColor: ACCENT }]}
            >
              <Ionicons name={playing ? 'pause' : 'play'} size={24} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => setWpm(w => Math.min(800, w + 25))}
              style={styles.wpmBtn}
            >
              <Ionicons name="add" size={22} color={COLORS.ink} />
            </Pressable>
            <View style={styles.wpmDisplay}>
              <Text style={[styles.wpmValue, { color: ACCENT }]}>{wpm}</Text>
              <Text style={styles.wpmUnit}>WPM</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Reading phase (scroll) ───────────────────────────────────────────────────
  if (phase === 'reading' && mode === 'scroll') {
    return (
      <View style={styles.safe}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.canvas }}>
          <View style={styles.topBar}>
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
            </Pressable>
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <ProgressBar value={scrollPct} color={ACCENT} height={6} />
            </View>
            <Text style={styles.progressText}>{Math.round(scrollPct * 100)}%</Text>
          </View>
        </SafeAreaView>

        <ScrollView
          contentContainerStyle={styles.scrollReadContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.author && <Text style={styles.bookAuthor}>{book.author}</Text>}
          <View style={styles.divider} />
          <Text style={[styles.scrollText, { fontFamily: fontBg, fontSize, lineHeight, letterSpacing }]}>{book.content}</Text>
          <View style={{ height: 100 }} />
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={{ backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface }}>
          <View style={{ padding: 16 }}>
            <PushButton color={ACCENT} onPress={finishSession}>
              Terminé de leer
            </PushButton>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── Quiz phase ───────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    if (loadingQuiz) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.quizLoadingBox}>
            <MascotChar which="swift" expression="happy" size={110} />
            <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 24 }} />
            <Text style={styles.quizLoadingText}>Procesando lectura con IA...</Text>
            <Text style={styles.quizLoadingSub}>Diseñando preguntas personalizadas para evaluar tu comprensión lectora.</Text>
          </View>
        </SafeAreaView>
      );
    }

    if (activeQuiz.length > 0) {
      const currentQ = activeQuiz[qIdx];
      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.quizScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.quizHeader}>
              <Text style={[styles.eyebrow, { color: ACCENT }]}>Evaluación de Comprensión</Text>
              <Text style={styles.quizProgressText}>Pregunta {qIdx + 1} de {activeQuiz.length}</Text>
            </View>

            <View style={styles.quizCard}>
              <Text style={styles.quizQuestionText}>{currentQ.q}</Text>
            </View>

            <View style={styles.optionsList}>
              {currentQ.opts.map((opt, oi) => {
                const isPicked = picked === oi;
                const isCorrect = currentQ.correct === oi;
                
                let btnStyle = {};
                let textStyle = {};

                if (showFeedback) {
                  if (isCorrect) {
                    btnStyle = { borderColor: '#10B981', backgroundColor: '#10B98115' };
                    textStyle = { color: '#047857', fontFamily: FONTS.headingSemi };
                  } else if (isPicked) {
                    btnStyle = { borderColor: '#EF4444', backgroundColor: '#EF444415' };
                    textStyle = { color: '#B91C1C', fontFamily: FONTS.headingSemi };
                  } else {
                    btnStyle = { opacity: 0.6 };
                  }
                } else if (isPicked) {
                  btnStyle = { borderColor: ACCENT, backgroundColor: ACCENT + '10' };
                }

                return (
                  <Pressable
                    key={oi}
                    disabled={showFeedback}
                    onPress={() => handleAnswerSelect(oi)}
                    style={[styles.optionBtn, btnStyle]}
                  >
                    <View style={styles.optionRow}>
                      <View style={[styles.optionDot, isPicked && { backgroundColor: ACCENT }, showFeedback && isCorrect && { backgroundColor: '#10B981' }, showFeedback && isPicked && !isCorrect && { backgroundColor: '#EF4444' }]}>
                        <Text style={styles.optionDotText}>{String.fromCharCode(65 + oi)}</Text>
                      </View>
                      <Text style={[styles.optionText, textStyle]}>{opt}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }
  }

  // ── Done phase ───────────────────────────────────────────────────────────────
  const readPct = mode === 'scroll'
    ? Math.round(scrollPct * 100)
    : (words.length > 0 ? Math.round(Math.min(1, wordIdx / words.length) * 100) : 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.doneScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.doneMascot}>
          <MascotChar which="joy" expression="happy" size={110} />
        </View>

        <Text style={[styles.doneLabel, { color: ACCENT }]}>¡Sesión completada!</Text>
        <Text style={styles.doneTitle}>{book.title}</Text>

        <View style={styles.statsGrid}>
          <StatCard label="Leído" value={`${readPct}%`} color={ACCENT} />
          <StatCard
            label="Palabras"
            value={(mode === 'scroll'
              ? Math.round(scrollPct * words.length)
              : Math.min(wordIdx, words.length)
            ).toLocaleString()}
            color="#3B82F6"
          />
          <StatCard label="XP" value={`+${xpEarned}`} color="#EAB308" />
          {mode === 'rsvp' && (
            <StatCard label="Velocidad" value={`${wpm} WPM`} color="#F97316" />
          )}
        </View>

        <View style={{ height: 32 }} />
        <PushButton color={ACCENT} onPress={() => router.back()}>
          Continuar el viaje
        </PushButton>
        <View style={{ height: 40 }} />
      </ScrollView>

      {showBanner && (
        <XPBanner amount={xpEarned} onDone={() => setShowBanner(false)} />
      )}
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const opacity = useSharedValue(0);
  React.useEffect(() => { opacity.value = withTiming(1, { duration: 400 }); }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.statCard, animStyle]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.canvas },
  header:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  topBar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  backIcon:         { fontSize: 18, color: COLORS.ink },
  progressText:     { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, minWidth: 34, textAlign: 'right' },

  setupScroll:      { padding: 24 },
  mascotRow:        { alignItems: 'center', marginBottom: 16 },
  bookTitle:        { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, textAlign: 'center', lineHeight: 28, marginBottom: 4 },
  bookAuthor:       { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', marginBottom: 4 },
  bookMeta:         { fontFamily: FONTS.body, fontSize: 12, color: COLORS.subtle, textAlign: 'center', marginBottom: 24 },

  sectionLabel:     { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  modeRow:          { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modePill:         { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, alignItems: 'center' },
  modePillLabel:    { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
  modePillDesc:     { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, marginTop: 2 },

  wpmRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 },
  wpmBtn:           { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  wpmBtnText:       { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, lineHeight: 28 },
  wpmDisplay:       { alignItems: 'center', minWidth: 80 },
  wpmValue:         { fontFamily: FONTS.heading, fontSize: 28 },
  wpmUnit:          { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },

  noContentBox:     { backgroundColor: COLORS.surface, borderRadius: 18, padding: 24, alignItems: 'center', marginTop: 16, gap: 16 },
  noContentText:    { fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
  backLink:         { paddingVertical: 8 },
  backLinkText:     { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.calm, textDecorationLine: 'underline' },

  // RSVP reading
  rsvpContainer:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  focusLines:       { flexDirection: 'row', alignItems: 'center', gap: 16 },
  focusLine:        { width: 3, height: 48, borderRadius: 2, opacity: 0.6 },
  wordBox:          { minWidth: 220, alignItems: 'center', paddingHorizontal: 12 },
  rsvpWord:         { fontFamily: FONTS.heading, fontSize: 36, textAlign: 'center' },
  rsvpCounter:      { fontFamily: FONTS.body, fontSize: 11, color: COLORS.subtle, marginTop: 24 },
  rsvpControls:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 16, paddingBottom: 8 },
  playBtn:          { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  playBtnText:      { fontSize: 22, color: '#fff' },

  // Scroll reading
  scrollReadContent:{ padding: 24 },
  divider:          { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  scrollText:       { fontFamily: FONTS.bodyLight, fontSize: 16, lineHeight: 28, color: '#1F2937' },

  // Done
  doneScroll:       { padding: 24, alignItems: 'center' },
  doneMascot:       { marginBottom: 16 },
  doneLabel:        { fontFamily: FONTS.headingSemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  doneTitle:        { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, textAlign: 'center', marginBottom: 24 },
  statsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  statCard:         { flex: 1, minWidth: '44%', backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  statValue:        { fontFamily: FONTS.heading, fontSize: 20 },
  statLabel:        { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },

  // Empty state
  emptyCenter:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText:        { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.muted },

  // Quiz styling
  quizScroll:       { padding: 24 },
  quizHeader:       { marginBottom: 20, alignItems: 'center' },
  eyebrow:          { fontFamily: FONTS.headingSemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  quizProgressText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  quizCard:         { backgroundColor: COLORS.white, borderRadius: 20, padding: 24, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 20, shadowColor: COLORS.ink, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quizQuestionText: { fontFamily: FONTS.headingSemi, fontSize: 16, lineHeight: 24, color: COLORS.ink },
  optionsList:      { gap: 12 },
  optionBtn:        { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: COLORS.border },
  optionRow:        { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionDot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  optionDotText:    { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
  optionText:       { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink, flex: 1, lineHeight: 20 },
  
  quizLoadingBox:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  quizLoadingText:  { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink, marginTop: 16, textAlign: 'center' },
  quizLoadingSub:   { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
