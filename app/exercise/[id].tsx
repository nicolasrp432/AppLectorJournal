import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, Platform, Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { XPBanner } from '../../components/ui/XPBanner';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { MascotChar } from '../../components/ui/MascotChar';

import { EXERCISES } from '../../constants/exercises';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { adaptLevel } from '../../lib/adaptLevel';

import { useProfileStore } from '../../store/useProfileStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useSessionStore } from '../../store/useSessionStore';
import { useNodeStore } from '../../store/useNodeStore';
import { useLibraryStore } from '../../store/useLibraryStore';
import { useAchievementsStore } from '../../store/useAchievementsStore';
import { useRewardsStore } from '../../store/useRewardsStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { supabase } from '../../lib/supabase';
import { AchievementToast } from '../../components/ui/AchievementToast';

import { SchulteGrid } from '../../components/exercises/SchulteGrid';
import { FocalReadingExercise } from '../../components/exercises/FocalReading';
import { WordSpanExercise } from '../../components/exercises/WordSpan';
import { LociExercise } from '../../components/exercises/LociExercise';
import { ComprehensionExercise } from '../../components/exercises/ComprehensionEx';
import { BossExercise } from '../../components/exercises/BossExercise';
import { FreeReadingExercise } from '../../components/exercises/FreeReading';
import { ExerciseDemo } from '../../components/exercises/ExerciseDemo';

import type { ExerciseId } from '../../types/db';

type Phase = 'intro' | 'playing' | 'result';

interface RawResult {
  time?: number;
  errors?: number;
  size?: number;
  wpm?: number;
  mode?: string;
  comprehension?: number;
  correct?: number;
  total?: number;
  score?: number;
  defeated?: boolean;
  rounds?: number;
}

interface BuiltResult {
  passed: boolean;
  headline: string | null;
  xpEarned: number;
  stats: { icon: string; value: string | number; unit: string; label: string; color: string }[];
  insight: string;
}

export default function ExerciseScreen() {
  const { id, nodeId } = useLocalSearchParams<{ id: string; nodeId?: string }>();
  const exerciseId = (id ?? 'schulte') as ExerciseId;
  const exercise = EXERCISES[exerciseId];

  const {
    addXP,
    fetchDailySessionsCount,
    canStartSession,
    incrementSessionCountLocal,
    isPremium,
  } = useProfileStore();

  const { get: getProgress, update: updateProgress } = useProgressStore();
  const { insert: insertSession }          = useSessionStore();
  const { completeNode }                   = useNodeStore();
  const { checkAll }                       = useAchievementsStore();

  const [phase, setPhase]                  = useState<Phase>('intro');
  const [result, setResult]                = useState<BuiltResult | null>(null);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal]   = useState(false);

  React.useEffect(() => {
    fetchDailySessionsCount();
  }, []);

  // Customizable parametric states for exercises
  const [schulteSize, setSchulteSize] = useState<number>(5);
  const [wordSpanCount, setWordSpanCount] = useState<number>(6);
  const [wordSpanInterval, setWordSpanInterval] = useState<number>(1100);
  const [lociCount, setLociCount] = useState<number>(5);
  const [lociStudyTime, setLociStudyTime] = useState<number>(4000);
  const [readingWpm, setReadingWpm] = useState<number>(280);
  const [readingMode, setReadingMode] = useState<'rsvp' | 'guide' | 'chunk'>('rsvp');

  if (!exercise) {
    router.back();
    return null;
  }

  // Default intensity config per exercise
  const defaultConfig: Record<string, any> = {
    schulte:      { size: 5 },
    reading:      { wpm: 280, mode: 'rsvp' },
    wordspan:     { level: 6, showMs: 1100, distractors: 4 },
    loci:         { count: 5, studyMs: 4000 },
    comprehension:{},
    boss:         {},
    freereading:  {},
  };
  const config = defaultConfig[exerciseId] ?? {};

  const handleFinish = async (raw: RawResult) => {
    const prog = getProgress(exerciseId);
    const built = buildResult(exerciseId, exercise, raw);
    setResult(built);
    incrementSessionCountLocal();

    const score = built.passed ? (raw.comprehension ?? (raw.correct && raw.total ? raw.correct / raw.total : 0.9)) : 0.4;
    const clampedScore = Math.max(0, Math.min(1, score as number));

    const adapt = adaptLevel(exerciseId, clampedScore, prog.current_level);

    await insertSession({
      exercise_id: exerciseId,
      level: prog.current_level,
      started_at: null,
      finished_at: new Date().toISOString(),
      score: clampedScore,
      errors: raw.errors ?? 0,
      time_seconds: raw.time ?? 0,
      wpm: raw.wpm ?? null,
      comprehension: raw.comprehension ?? null,
      xp_earned: built.xpEarned,
    });

    await updateProgress(exerciseId, {
      current_level: adapt.newLevel,
      best_score: Math.max(prog.best_score, clampedScore),
      last_score: clampedScore,
      total_sessions: prog.total_sessions + 1,
      mastery: Math.min(1, Math.max(0, prog.mastery + adapt.masteryDelta)),
    });

    await addXP(built.xpEarned);

    // Mark node complete in the learning path
    if (nodeId && built.passed) {
      await completeNode(nodeId);
    }

    // Update streak server-side (no-op when offline / no session)
    const { data: authData } = await supabase.auth.getSession();
    if (authData.session) {
      await supabase.rpc('update_streak', { p_user_id: authData.session.user.id });
    }

    // Check for newly unlocked achievements
    const profile  = useProfileStore.getState().profile;
    const sessions = useSessionStore.getState().sessions;
    const progress = useProgressStore.getState().all;
    const library  = useLibraryStore.getState().items;
    if (profile) {
      const newly = await checkAll({ profile, sessions, progress, library });
      setNewAchievements(newly);
    }

    setPhase('result');
  };

  if (phase === 'intro') {
    return (
      <>
        <ExerciseIntro
          exercise={exercise}
          onStart={() => {
            if (!canStartSession()) {
              setShowLimitModal(true);
            } else {
              setPhase('playing');
            }
          }}
          onBack={() => router.back()}
          schulteSize={schulteSize}
          setSchulteSize={setSchulteSize}
          wordSpanCount={wordSpanCount}
          setWordSpanCount={setWordSpanCount}
          wordSpanInterval={wordSpanInterval}
          setWordSpanInterval={setWordSpanInterval}
          lociCount={lociCount}
          setLociCount={setLociCount}
          lociStudyTime={lociStudyTime}
          setLociStudyTime={setLociStudyTime}
          readingWpm={readingWpm}
          setReadingWpm={setReadingWpm}
          readingMode={readingMode}
          setReadingMode={setReadingMode}
        />

        {/* Animated Premium/Rest Limit Modal */}
        <Modal
          visible={showLimitModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLimitModal(false)}
        >
          <View style={limitStyles.modalOverlay}>
            <BlurView intensity={70} style={StyleSheet.absoluteFill} tint="dark" />
            <View style={limitStyles.limitCard}>
              <View style={limitStyles.mascotContainer}>
                <MascotChar which="calm" size={105} expression="sleepy" />
              </View>

              <Text style={limitStyles.limitTitle}>¡Mente en Descanso!</Text>

              <Text style={limitStyles.limitText}>
                Has completado tus <Text style={{ fontFamily: FONTS.headingBold, color: COLORS.focus }}>3 sesiones diarias gratuitas</Text> de hoy. Tu cerebro necesita tiempo para asimilar las nuevas conexiones neuronales creadas. ¡Gran trabajo!
              </Text>

              <Text style={limitStyles.limitTip}>
                Espera hasta mañana para seguir gratis o desbloquea el entrenamiento ilimitado ahora mismo.
              </Text>

              <Pressable
                style={limitStyles.upgradeBtn}
                onPress={() => {
                  setShowLimitModal(false);
                  router.push('/(tabs)/tienda');
                }}
              >
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={limitStyles.gradientBtn}
                >
                  <Ionicons name="sparkles" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={limitStyles.upgradeText}>Entrenar sin Límites (PRO)</Text>
                </LinearGradient>
              </Pressable>

              <Pressable style={limitStyles.closeBtn} onPress={() => setShowLimitModal(false)}>
                <Text style={limitStyles.closeText}>Entendido, descansaré mi mente</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  if (phase === 'result' && result) {
    return (
      <ExerciseResult
        exercise={exercise}
        result={result}
        newAchievements={newAchievements}
        onContinue={() => router.back()}
        onRetry={() => { setResult(null); setPhase('playing'); setNewAchievements([]); }}
      />
    );
  }

  // Playing
  const quit = () => router.back();
  const accent = exercise.color;

  switch (exerciseId) {
    case 'schulte': {
      const currentLevel = getProgress('schulte').current_level;
      return (
        <SchulteGrid
          size={schulteSize}
          accent={accent}
          inverse={currentLevel >= 5}
          showQuadrantHint={currentLevel >= 3}
          onFinish={handleFinish}
          onQuit={quit}
        />
      );
    }
    case 'reading':
      return <FocalReadingExercise initialWpm={readingWpm} initialMode={readingMode} accent={accent} onFinish={handleFinish} onQuit={quit} />;
    case 'wordspan':
      return <WordSpanExercise level={wordSpanCount} showMs={wordSpanInterval} distractorCount={config.distractors} accent={accent} onFinish={handleFinish} onQuit={quit} />;
    case 'loci':
      return <LociExercise count={lociCount} studyMs={lociStudyTime} accent={accent} onFinish={handleFinish} onQuit={quit} />;
    case 'comprehension':
      return <ComprehensionExercise accent={accent} onFinish={handleFinish} onQuit={quit} />;
    case 'boss':
      return <BossExercise onFinish={handleFinish} onQuit={quit} />;
    case 'freereading':
      return <FreeReadingExercise accent={accent} onFinish={handleFinish} onQuit={quit} />;
    default:
      return <FocalReadingExercise accent={accent} onFinish={handleFinish} onQuit={quit} />;
  }
}

// ─── Intro screen ─────────────────────────────────────────────────────────────

function SelectPill({ label, selected, onPress, color }: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{ margin: 2 }}
    >
      <Animated.View
        style={[
          introStyles.pill,
          selected
            ? { backgroundColor: color, borderColor: color }
            : { backgroundColor: COLORS.white, borderColor: COLORS.border },
          animatedStyle,
        ]}
      >
        <Text
          style={[
            introStyles.pillText,
            selected ? { color: '#fff', fontWeight: 'bold' } : { color: COLORS.ink },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function ExerciseIntro({
  exercise,
  onStart,
  onBack,
  schulteSize,
  setSchulteSize,
  wordSpanCount,
  setWordSpanCount,
  wordSpanInterval,
  setWordSpanInterval,
  lociCount,
  setLociCount,
  lociStudyTime,
  setLociStudyTime,
  readingWpm,
  setReadingWpm,
  readingMode,
  setReadingMode,
}: {
  exercise: typeof EXERCISES[string];
  onStart: () => void;
  onBack: () => void;
  schulteSize: number;
  setSchulteSize: (val: number) => void;
  wordSpanCount: number;
  setWordSpanCount: (val: number) => void;
  wordSpanInterval: number;
  setWordSpanInterval: (val: number) => void;
  lociCount: number;
  setLociCount: (val: number) => void;
  lociStudyTime: number;
  setLociStudyTime: (val: number) => void;
  readingWpm: number;
  setReadingWpm: (val: number) => void;
  readingMode: 'rsvp' | 'guide' | 'chunk';
  setReadingMode: (val: 'rsvp' | 'guide' | 'chunk') => void;
}) {
  const c = exercise.color;
  const lociPalace = usePrefsStore(s => s.prefs.loci_palace) || 'casa';
  const { update: updatePrefs } = usePrefsStore();
  const startBtnShadow = (color: string) => Platform.select({
    web: { boxShadow: `0 8px 20px ${color}66` } as any,
    default: { shadowColor: color, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 6 },
  }) ?? {};

  const showSettings = ['schulte', 'wordspan', 'loci', 'reading'].includes(exercise.id);

  const renderSettingsPanel = () => {
    if (!showSettings) return null;

    return (
      <View style={[introStyles.settingsCard, { borderColor: COLORS.border }]}>
        <View style={introStyles.settingsHeader}>
          <MaterialCommunityIcons name="tune-variant" size={20} color={c} />
          <Text style={[introStyles.settingsTitle, { color: c }]}>Personaliza tu Sesión</Text>
        </View>

        {exercise.id === 'schulte' && (
          <View style={introStyles.settingSection}>
            <View style={introStyles.settingTextRow}>
              <Text style={introStyles.settingLabel}>Tamaño de la Cuadrícula</Text>
              <Text style={[introStyles.settingValue, { color: c }]}>{schulteSize} × {schulteSize}</Text>
            </View>
            <View style={introStyles.pillRow}>
              {[3, 4, 5, 6].map((size) => (
                <SelectPill
                  key={size}
                  label={`${size}×${size}`}
                  selected={schulteSize === size}
                  onPress={() => setSchulteSize(size)}
                  color={c}
                />
              ))}
            </View>
            <Text style={introStyles.settingDesc}>
              {schulteSize === 3 && "Ideal para entrenar la visión periférica inicial."}
              {schulteSize === 4 && "Intermedio. Aumenta la velocidad ocular."}
              {schulteSize === 5 && "Grilla estándar. Requiere alta concentración."}
              {schulteSize === 6 && "Desafío supremo de visión y agilidad mental."}
            </Text>
          </View>
        )}

        {exercise.id === 'wordspan' && (
          <View style={introStyles.settingSection}>
            <View style={introStyles.settingTextRow}>
              <Text style={introStyles.settingLabel}>Cantidad de Palabras</Text>
              <Text style={[introStyles.settingValue, { color: c }]}>{wordSpanCount} palabras</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={introStyles.pillScrollRow}>
              {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <SelectPill
                  key={num}
                  label={String(num)}
                  selected={wordSpanCount === num}
                  onPress={() => setWordSpanCount(num)}
                  color={c}
                />
              ))}
            </ScrollView>

            <View style={[introStyles.settingTextRow, { marginTop: 14 }]}>
              <Text style={introStyles.settingLabel}>Intervalo de Visualización</Text>
              <Text style={[introStyles.settingValue, { color: c }]}>{(wordSpanInterval / 1000).toFixed(1)}s</Text>
            </View>
            <View style={introStyles.pillRow}>
              {[
                { val: 500, label: '0.5s' },
                { val: 800, label: '0.8s' },
                { val: 1100, label: '1.1s' },
                { val: 1500, label: '1.5s' },
                { val: 2000, label: '2.0s' },
              ].map((item) => (
                <SelectPill
                  key={item.val}
                  label={item.label}
                  selected={wordSpanInterval === item.val}
                  onPress={() => setWordSpanInterval(item.val)}
                  color={c}
                />
              ))}
            </View>
            <Text style={introStyles.settingDesc}>
              A menor intervalo, mayor velocidad de procesamiento cognitivo requerida.
            </Text>
          </View>
        )}

        {exercise.id === 'loci' && (
          <View style={introStyles.settingSection}>
            <View style={introStyles.settingTextRow}>
              <Text style={introStyles.settingLabel}>Tema del Palacio</Text>
              <Text style={[introStyles.settingValue, { color: c, textTransform: 'capitalize' }]}>{lociPalace}</Text>
            </View>
            <View style={introStyles.pillRow}>
              {[
                { val: 'casa', label: '🏠 Casa' },
                { val: 'oficina', label: '💻 Oficina' },
                { val: 'naturaleza', label: '🌲 Naturaleza' },
              ].map((item) => (
                <SelectPill
                  key={item.val}
                  label={item.label}
                  selected={lociPalace === item.val}
                  onPress={() => updatePrefs({ loci_palace: item.val as any })}
                  color={c}
                />
              ))}
            </View>

            <View style={[introStyles.settingTextRow, { marginTop: 14 }]}>
              <Text style={introStyles.settingLabel}>Elementos de Asociación</Text>
              <Text style={[introStyles.settingValue, { color: c }]}>{lociCount} objetos</Text>
            </View>
            <View style={introStyles.pillRow}>
              {[3, 4, 5, 6, 7, 8].map((num) => (
                <SelectPill
                  key={num}
                  label={String(num)}
                  selected={lociCount === num}
                  onPress={() => setLociCount(num)}
                  color={c}
                />
              ))}
            </View>

            <View style={[introStyles.settingTextRow, { marginTop: 14 }]}>
              <Text style={introStyles.settingLabel}>Tiempo de Estudio por Objeto</Text>
              <Text style={[introStyles.settingValue, { color: c }]}>{(lociStudyTime / 1000).toFixed(0)}s</Text>
            </View>
            <View style={introStyles.pillRow}>
              {[
                { val: 2000, label: '2s' },
                { val: 3000, label: '3s' },
                { val: 4000, label: '4s' },
                { val: 5000, label: '5s' },
              ].map((item) => (
                <SelectPill
                  key={item.val}
                  label={item.label}
                  selected={lociStudyTime === item.val}
                  onPress={() => setLociStudyTime(item.val)}
                  color={c}
                />
              ))}
            </View>
            <Text style={introStyles.settingDesc}>
              El Palacio Mental es más efectivo cuando te tomas el tiempo de visualizar vívidamente la asociación.
            </Text>
          </View>
        )}

        {exercise.id === 'reading' && (
          <View style={introStyles.settingSection}>
            <View style={introStyles.settingTextRow}>
              <Text style={introStyles.settingLabel}>Modo de Lectura</Text>
              <Text style={[introStyles.settingValue, { color: c, textTransform: 'uppercase' }]}>{readingMode}</Text>
            </View>
            <View style={introStyles.pillRow}>
              {[
                { val: 'rsvp' as const, label: 'RSVP' },
                { val: 'guide' as const, label: 'Guía' },
                { val: 'chunk' as const, label: 'Chunks' },
              ].map((item) => (
                <SelectPill
                  key={item.val}
                  label={item.label}
                  selected={readingMode === item.val}
                  onPress={() => setReadingMode(item.val)}
                  color={c}
                />
              ))}
            </View>

            <View style={[introStyles.settingTextRow, { marginTop: 14 }]}>
              <Text style={introStyles.settingLabel}>Velocidad de Lectura Inicial</Text>
              <Text style={[introStyles.settingValue, { color: c }]}>{readingWpm} WPM</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={introStyles.pillScrollRow}>
              {[200, 300, 400, 500, 600, 700].map((speed) => (
                <SelectPill
                  key={speed}
                  label={`${speed} WPM`}
                  selected={readingWpm === speed}
                  onPress={() => setReadingWpm(speed)}
                  color={c}
                />
              ))}
            </ScrollView>
            <Text style={introStyles.settingDesc}>
              Ajusta la velocidad base. Podrás modificarla en tiempo real durante la lectura.
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[introStyles.safe, { backgroundColor: COLORS.canvas }]}>
      <View style={introStyles.header}>
        <Pressable onPress={onBack} style={introStyles.backBtn} hitSlop={8}>
          <Text style={introStyles.backIcon}>←</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={[introStyles.xpBadge, { backgroundColor: c + '15', borderColor: c + '30' }]}>
          <Text style={[introStyles.xpText, { color: c }]}>+{exercise.xp} XP</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={introStyles.scroll} showsVerticalScrollIndicator={false}>
        <View style={introStyles.titleBlock}>
          <Text style={[introStyles.category, { color: c }]}>{exercise.category}</Text>
          <Text style={introStyles.title}>{exercise.title}</Text>
        </View>

        <View style={introStyles.demoWrap}>
          <ExerciseDemo kind={exercise.id as ExerciseId} accent={c} height={180} />
        </View>

        <View style={introStyles.metaRow}>
          <MetaChip label="Duración"   value={exercise.duration}   color="#3B82F6" />
          <MetaChip label="Dificultad" value={exercise.difficulty} color="#F97316" />
          <MetaChip label="Mejora"     value={exercise.improves}   color="#8B5CF6" />
        </View>

        {renderSettingsPanel()}

        <View style={[introStyles.whyCard, { borderColor: COLORS.border }]}>
          <View style={[introStyles.whyIcon, { backgroundColor: c + '15' }]}>
            <MaterialCommunityIcons name="brain" size={20} color={c} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[introStyles.whyLabel, { color: c }]}>Por qué es efectivo</Text>
            <Text style={introStyles.whyText}>{exercise.whyEffective ?? exercise.description}</Text>
          </View>
        </View>

        <Text style={introStyles.stepsTitle}>Cómo funciona</Text>
        {exercise.steps.map((step, i) => (
          <View key={i} style={introStyles.step}>
            <View style={[introStyles.stepNum, { backgroundColor: c }]}>
              <Text style={introStyles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={introStyles.stepText}>{step}</Text>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>

      <View style={introStyles.footer}>
        <Pressable onPress={onStart} style={[introStyles.startBtn, { backgroundColor: c }, startBtnShadow(c)]}>
          <Text style={introStyles.startBtnText}>Empezar ejercicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MetaChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={metaStyles.chip}>
      <Text style={[metaStyles.value, { color }]}>{value}</Text>
      <Text style={metaStyles.label}>{label}</Text>
    </View>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ExerciseResult({ exercise, result, newAchievements, onContinue, onRetry }: {
  exercise: typeof EXERCISES[string];
  result: BuiltResult;
  newAchievements: string[];
  onContinue: () => void;
  onRetry: () => void;
}) {
  const c = exercise.color;
  const { owned, consume } = useRewardsStore();
  const { addXP } = useProfileStore();
  const hasDoubleXp = owned.includes('pw-xp2x') && result.passed;
  const [xp2xActivated, setXp2xActivated] = React.useState(false);

  const heroShadow = (color: string) => Platform.select({
    web: { boxShadow: `0 20px 50px ${color}66` } as any,
    default: { shadowColor: color, shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 50, elevation: 8 },
  }) ?? {};
  const continueShadow = (color: string) => Platform.select({
    web: { boxShadow: `0 6px 16px ${color}66` } as any,
    default: { shadowColor: color, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 4 },
  }) ?? {};
  const [showBanner, setShowBanner]           = React.useState(false);
  const [achievementIdx, setAchievementIdx]   = React.useState(0);
  const [showAchievement, setShowAchievement] = React.useState(newAchievements.length > 0);
  const heroOpacity = useSharedValue(0);
  const heroY       = useSharedValue(20);
  const heroScale   = useSharedValue(0.95);

  React.useEffect(() => {
    const t = setTimeout(() => {
      heroOpacity.value = withTiming(1, { duration: 500 });
      heroY.value       = withTiming(0, { duration: 500 });
      heroScale.value   = withTiming(1, { duration: 500 });
    }, 150);
    // Delay banner until hero animation settles
    const b = setTimeout(() => { if (result.passed) setShowBanner(true); }, 800);
    return () => { clearTimeout(t); clearTimeout(b); };
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity:   heroOpacity.value,
    transform: [{ translateY: heroY.value }, { scale: heroScale.value }],
  }));

  return (
    <SafeAreaView style={[resultStyles.safe, { backgroundColor: COLORS.canvas }]}>
      <ScrollView contentContainerStyle={resultStyles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[resultStyles.hero, heroStyle]}>
          <View style={[resultStyles.heroCircle, { backgroundColor: result.passed ? c : '#9CA3AF' }, heroShadow(result.passed ? c : '#9CA3AF')]}>
            <MascotChar which={result.passed ? 'joy' : 'focus'} expression={result.passed ? 'happy' : 'wow'} size={90} breathing={false} blinking={false} />
          </View>
          <Text style={[resultStyles.heroLabel, { color: c }]}>
            {result.passed ? '¡Completado!' : 'Sigue intentando'}
          </Text>
          <Text style={resultStyles.heroTitle}>
            {result.passed ? (result.headline ?? '¡Bien hecho!') : 'Casi, inténtalo de nuevo'}
          </Text>
        </Animated.View>

        <View style={resultStyles.statsGrid}>
          {result.stats.map((s, i) => (
            <StatCard key={i} stat={s} delay={200 + i * 80} />
          ))}
        </View>

        {result.passed && !xp2xActivated && (
          <View style={resultStyles.xpCard}>
            <Ionicons name="flash" size={36} color="#78350F" />
            <View style={{ flex: 1 }}>
              <Text style={resultStyles.xpLabel}>Recompensa</Text>
              <Text style={resultStyles.xpValue}>+{result.xpEarned} XP</Text>
            </View>
          </View>
        )}

        {xp2xActivated && (
          <View style={[resultStyles.xpCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
            <Ionicons name="sparkles" size={36} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={[resultStyles.xpLabel, { color: '#92400E' }]}>Multiplicador Activo</Text>
              <Text style={[resultStyles.xpValue, { color: '#D97706' }]}>+{result.xpEarned * 2} XP (¡Duplicado con éxito!)</Text>
            </View>
          </View>
        )}

        {hasDoubleXp && !xp2xActivated && (
          <Pressable
            onPress={async () => {
              consume('pw-xp2x');
              await addXP(result.xpEarned);
              setXp2xActivated(true);
            }}
            style={resultStyles.doubleXpCard}
          >
            <LinearGradient
              colors={['#FCD34D', '#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={resultStyles.doubleXpGradient}
            >
              <Ionicons name="sparkles" size={24} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={resultStyles.doubleXpTitle}>¡POTENCIADOR XP x2 DISPONIBLE!</Text>
                <Text style={resultStyles.doubleXpDesc}>Toca aquí para consumir tu potenciador y ganar +{result.xpEarned} XP extra (Total: {result.xpEarned * 2} XP).</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {result.insight ? (
          <View style={resultStyles.insightCard}>
            <Ionicons name="bulb" size={36} color="#EAB308" />
            <View style={{ flex: 1 }}>
              <Text style={[resultStyles.insightLabel, { color: c }]}>Tip</Text>
              <Text style={resultStyles.insightText}>{result.insight}</Text>
            </View>
          </View>
        ) : null}

        <View style={{ height: 110 }} />
      </ScrollView>

      {showBanner && (
        <XPBanner amount={result.xpEarned} onDone={() => setShowBanner(false)} />
      )}
      {showAchievement && newAchievements[achievementIdx] && (
        <AchievementToast
          achievementId={newAchievements[achievementIdx]}
          onDone={() => {
            const next = achievementIdx + 1;
            if (next < newAchievements.length) {
              setAchievementIdx(next);
            } else {
              setShowAchievement(false);
            }
          }}
        />
      )}

      <View style={resultStyles.footer}>
        <Pressable onPress={onRetry} style={resultStyles.retryBtn}>
          <Text style={resultStyles.retryBtnText}>Repetir</Text>
        </Pressable>
        <Pressable onPress={onContinue} style={[resultStyles.continueBtn, { backgroundColor: c }, continueShadow(c)]}>
          <Text style={resultStyles.continueBtnText}>Continuar ruta →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CountingText({ value, delay }: { value: string | number; delay: number }) {
  const [displayValue, setDisplayValue] = React.useState('0');

  React.useEffect(() => {
    const stringVal = String(value);
    const numericVal = parseFloat(stringVal);
    if (isNaN(numericVal)) {
      setDisplayValue(stringVal);
      return;
    }

    const isDecimal = stringVal.includes('.');
    const decimalPlaces = isDecimal ? stringVal.split('.')[1].length : 0;
    
    let startTimestamp: number | null = null;
    const duration = 800; // Animation duration in ms

    let animationFrameId: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Quadratic ease-out: f(t) = t * (2 - t)
      const easeProgress = progress * (2 - progress);
      const current = easeProgress * numericVal;
      
      setDisplayValue(current.toFixed(decimalPlaces));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(stringVal);
      }
    };

    const timeout = setTimeout(() => {
      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [value, delay]);

  return <>{displayValue}</>;
}

function StatCard({ stat, delay }: { stat: BuiltResult['stats'][0]; delay: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  React.useEffect(() => {
    const t = setTimeout(() => {
      opacity.value    = withTiming(1, { duration: 400 });
      translateY.value = withTiming(0, { duration: 400 });
    }, delay);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[resultStyles.statCard, style]}>
      <Text style={[resultStyles.statValue, { color: stat.color }]}>
        <CountingText value={stat.value} delay={delay} /><Text style={resultStyles.statUnit}> {stat.unit}</Text>
      </Text>
      <Text style={resultStyles.statLabel}>{stat.label}</Text>
    </Animated.View>
  );
}

// ─── Result builder ───────────────────────────────────────────────────────────

function buildResult(exerciseId: ExerciseId, exercise: typeof EXERCISES[string], raw: RawResult): BuiltResult {
  switch (exerciseId) {
    case 'schulte': {
      const passed = (raw.errors ?? 99) < 3;
      return {
        passed,
        headline: passed ? `${raw.size}×${raw.size} dominado` : null,
        xpEarned: passed ? exercise.xp : Math.floor(exercise.xp / 3),
        stats: [
          { icon: 'clock', value: (raw.time ?? 0).toFixed(1), unit: 's', label: 'Tiempo', color: '#3B82F6' },
          { icon: 'grid', value: (raw.size ?? 5) * (raw.size ?? 5), unit: '', label: 'Celdas', color: exercise.color },
          { icon: 'x', value: raw.errors ?? 0, unit: '', label: 'Errores', color: '#EF4444' },
          { icon: 'gauge', value: (((raw.size ?? 5) ** 2) / (raw.time ?? 1)).toFixed(1), unit: '/s', label: 'Ritmo', color: '#F97316' },
        ],
        insight: passed ? 'Tu visión periférica está ampliándose. Prueba un 6×6 la próxima.' : 'Fija más la vista en el centro. Menos saltos oculares = más velocidad.',
      };
    }
    case 'wordspan': {
      const passed = (raw.correct ?? 0) >= (raw.total ?? 1) - 1;
      return {
        passed,
        headline: passed ? 'Memoria afilada' : null,
        xpEarned: Math.floor(exercise.xp * ((raw.correct ?? 0) / (raw.total ?? 1))),
        stats: [
          { icon: 'check', value: raw.correct ?? 0, unit: `/${raw.total ?? 0}`, label: 'Correctas', color: '#22C55E' },
          { icon: 'clock', value: (raw.time ?? 0).toFixed(1), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Crea una historia que conecte las palabras en orden.' : 'Agrupa las palabras en bloques de 3 — es más fácil retener.',
      };
    }
    case 'loci': {
      const passed = (raw.correct ?? 0) === (raw.total ?? 1);
      return {
        passed,
        headline: passed ? 'Palacio mental activado' : null,
        xpEarned: Math.floor(exercise.xp * ((raw.correct ?? 0) / (raw.total ?? 1))),
        stats: [
          { icon: 'check', value: raw.correct ?? 0, unit: `/${raw.total ?? 0}`, label: 'Aciertos', color: '#22C55E' },
          { icon: 'clock', value: (raw.time ?? 0).toFixed(1), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Practica con tu propia casa — la familiaridad potencia el efecto.' : 'Visualiza con todos los sentidos: forma, color, sonido. Más vívido = más memorable.',
      };
    }
    case 'comprehension': {
      const passed = (raw.correct ?? 0) >= (raw.total ?? 1) - 1;
      return {
        passed,
        headline: passed ? 'Comprensión sólida' : null,
        xpEarned: Math.floor(exercise.xp * ((raw.correct ?? 0) / (raw.total ?? 1))),
        stats: [
          { icon: 'check', value: raw.correct ?? 0, unit: `/${raw.total ?? 0}`, label: 'Correctas', color: '#22C55E' },
          { icon: 'gauge', value: raw.wpm ?? '—', unit: 'WPM', label: 'Lectura', color: '#F97316' },
          { icon: 'clock', value: (raw.time ?? 0).toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
          { icon: 'brain', value: Math.round(((raw.correct ?? 0) / (raw.total ?? 1)) * 100), unit: '%', label: 'Comprensión', color: '#8B5CF6' },
        ],
        insight: passed ? 'Excelente balance entre velocidad y comprensión.' : 'Baja el ritmo un poco y vuelve a leer.',
      };
    }
    case 'reading': {
      const comp = raw.comprehension ?? 0;
      const passed = comp >= 0.7;
      return {
        passed,
        headline: passed ? `${raw.wpm ?? 0} WPM con comprensión` : null,
        xpEarned: Math.floor(exercise.xp * Math.max(0.4, comp)),
        stats: [
          { icon: 'gauge', value: raw.wpm ?? 0, unit: 'WPM', label: 'Velocidad', color: '#F97316' },
          { icon: 'brain', value: Math.round(comp * 100), unit: '%', label: 'Comprensión', color: '#8B5CF6' },
          { icon: 'check', value: raw.correct ?? 0, unit: `/${raw.total ?? 0}`, label: 'Aciertos', color: '#22C55E' },
          { icon: 'clock', value: (raw.time ?? 0).toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Excelente balance velocidad/comprensión. Prueba +30 WPM la próxima.' : 'Baja un poco la velocidad para retener más.',
      };
    }
    case 'boss': {
      const passed = raw.defeated === true;
      return {
        passed,
        headline: passed ? '¡Jefe derrotado!' : null,
        xpEarned: passed ? exercise.xp : Math.floor(exercise.xp / 3),
        stats: [
          { icon: 'trophy', value: Math.round((raw.score ?? 0) * 100), unit: '%', label: 'Puntaje', color: '#EAB308' },
          { icon: 'clock', value: (raw.time ?? 0).toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed ? 'Desbloqueaste la siguiente zona.' : 'Entrena más en esta zona antes de volver a enfrentarlo.',
      };
    }
    case 'freereading': {
      const comp = raw.comprehension ?? 0;
      const passed = comp >= 0.6;
      return {
        passed,
        headline: passed ? `${raw.wpm ?? 0} WPM · comprensión validada` : null,
        xpEarned: Math.floor(exercise.xp * Math.max(0.3, comp)),
        stats: [
          { icon: 'gauge', value: raw.wpm ?? 0, unit: 'WPM', label: 'Velocidad', color: '#22C55E' },
          { icon: 'brain', value: Math.round(comp * 100), unit: '%', label: 'Comprensión', color: '#8B5CF6' },
          { icon: 'check', value: raw.correct ?? 0, unit: `/${raw.total ?? 0}`, label: 'Aciertos', color: '#22C55E' },
          { icon: 'clock', value: (raw.time ?? 0).toFixed(0), unit: 's', label: 'Tiempo', color: '#3B82F6' },
        ],
        insight: passed
          ? 'Buen ritmo de lectura natural. Practica para superar tus propios WPM.'
          : 'Intenta leer activamente buscando ideas clave antes de responder.',
      };
    }
    default:
      return { passed: true, headline: 'Sesión completa', xpEarned: exercise.xp, stats: [], insight: '' };
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const introStyles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  backBtn:    { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  backIcon:   { fontSize: 20, color: COLORS.ink },
  xpBadge:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 4, alignItems: 'center' },
  xpText:     { fontFamily: FONTS.heading, fontSize: 12 },
  scroll:     { padding: 20 },
  titleBlock: { alignItems: 'center', marginBottom: 20 },
  category:   { fontFamily: FONTS.headingSemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5 },
  title:      { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink, marginTop: 4, textAlign: 'center' },
  demoWrap:   { marginBottom: 16, borderRadius: 18, overflow: 'hidden' },
  metaRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  whyCard:    { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 20, flexDirection: 'row', gap: 12 },
  whyIcon:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  whyLabel:   { fontFamily: FONTS.headingSemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  whyText:    { fontFamily: FONTS.body, fontSize: 13, color: '#374151', lineHeight: 20 },
  stepsTitle: { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.ink, marginBottom: 12 },
  step:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 10 },
  stepNum:    { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  stepNumText:{ fontFamily: FONTS.heading, fontSize: 12, color: '#fff' },
  stepText:   { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink, flex: 1, lineHeight: 22 },
  footer:     { padding: 16, paddingBottom: 28, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface },
  startBtn:   { borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  startBtnText:{ fontFamily: FONTS.heading, fontSize: 15, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  settingsCard: { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, marginBottom: 20, borderColor: COLORS.border },
  settingsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  settingsTitle: { fontFamily: FONTS.heading, fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.8 },
  settingSection: { marginBottom: 12 },
  settingTextRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  settingLabel: { fontFamily: FONTS.headingSemi, fontSize: 12, color: COLORS.ink },
  settingValue: { fontFamily: FONTS.heading, fontSize: 13 },
  settingDesc: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 6, lineHeight: 15 },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  pillScrollRow: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  pillText: { fontFamily: FONTS.headingSemi, fontSize: 11 },
});

const metaStyles = StyleSheet.create({
  chip:  { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  value: { fontFamily: FONTS.heading, fontSize: 12, textAlign: 'center' },
  label: { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2, textAlign: 'center' },
});

const resultStyles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.canvas },
  scroll:       { padding: 20, paddingTop: 40 },
  hero:         { alignItems: 'center', marginBottom: 24 },
  heroCircle:   { width: 130, height: 130, borderRadius: 65, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroLabel:    { fontFamily: FONTS.headingSemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  heroTitle:    { fontFamily: FONTS.heading, fontSize: 26, color: COLORS.ink, textAlign: 'center' },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:     { flex: 1, minWidth: '44%', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  statValue:    { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink },
  statUnit:     { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  statLabel:    { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  xpCard:       { backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#FCD34D', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  xpLabel:      { fontFamily: FONTS.headingSemi, fontSize: 10, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1 },
  xpValue:      { fontFamily: FONTS.heading, fontSize: 20, color: '#78350F' },
  insightCard:  { backgroundColor: COLORS.white, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', gap: 12 },
  insightLabel: { fontFamily: FONTS.headingSemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  insightText:  { fontFamily: FONTS.body, fontSize: 13, color: '#374151', lineHeight: 20 },
  footer:       { padding: 16, paddingBottom: 28, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface, flexDirection: 'row', gap: 10 },
  retryBtn:     { paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  retryBtnText: { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 0.5 },
  continueBtn:  { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  continueBtnText:{ fontFamily: FONTS.heading, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  doubleXpCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  doubleXpGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  doubleXpTitle: {
    fontFamily: FONTS.headingBold || 'System',
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.8,
  },
  doubleXpDesc: {
    fontFamily: FONTS.body || 'System',
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
    lineHeight: 16,
  },
});

const limitStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  limitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  mascotContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  limitTitle: {
    fontFamily: FONTS.heading || 'System',
    fontSize: 22,
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 12,
  },
  limitText: {
    fontFamily: FONTS.body || 'System',
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  limitTip: {
    fontFamily: FONTS.bodyLight || 'System',
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  upgradeBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  upgradeText: {
    fontFamily: FONTS.heading || 'System',
    fontSize: 13,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
  },
  closeText: {
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 12,
    color: '#4B5563',
  },
});
