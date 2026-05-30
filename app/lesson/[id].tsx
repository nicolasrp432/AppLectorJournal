import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, Dimensions, Platform, ScrollView, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence, runOnJS
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { MascotChar } from '../../components/ui/MascotChar';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { COLORS, darken } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { useProfileStore } from '../../store/useProfileStore';
import { useNodeStore } from '../../store/useNodeStore';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const W = Math.min(SCREEN_WIDTH, 520);

type LessonPhase = 'intro' | 'playing' | 'success';

interface LessonData {
  title: string;
  subtitle: string;
  color: string;
  mascot: 'focus' | 'calm' | 'swift' | 'loci';
  introText: string;
  benefits: string[];
}

const LESSON_INFO: Record<string, LessonData> = {
  z1_lesson: {
    title: 'Ampliación Focal',
    subtitle: 'Zona 1: Enfoque',
    color: COLORS.focus,
    mascot: 'focus',
    introText: 'Para leer rápido, debemos dejar de enfocar cada palabra individualmente como una cámara estenopeica y comenzar a usar nuestra visión periférica.',
    benefits: [
      'Duplica el campo visual útil en menos de 2 semanas.',
      'Reduce las regresiones (volver atrás al leer).',
      'Permite capturar palabras completas de un solo vistazo.',
    ],
  },
  z2_lesson: {
    title: 'Palacio Nemotécnico',
    subtitle: 'Zona 2: Memoria',
    color: COLORS.calm,
    mascot: 'calm',
    introText: 'El Método de Loci o Palacio de la Memoria asocia información lógica a coordenadas espaciales familiares, aumentando tu retención en un 300%.',
    benefits: [
      'Almacena conceptos clave a largo plazo.',
      'Asocia reglas de lectura ágil con salas de tu mente.',
      'Facilita recordar estructuras completas de libros.',
    ],
  },
  z3_lesson: {
    title: 'Ritmo Semántico',
    subtitle: 'Zona 3: Velocidad',
    color: COLORS.swift,
    mascot: 'swift',
    introText: 'Aprender a fijar la mirada rítmicamente en "bloques semánticos" o grupos de palabras evita la subvocalización y dispara tus WPM.',
    benefits: [
      'Entrena el salto rítmico ocular (sacadas).',
      'Desactiva la voz interna limitante al leer.',
      'Te ayuda a saltar directamente al sentido del texto.',
    ],
  },
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lessonId = id ?? 'z1_lesson';
  const lesson = LESSON_INFO[lessonId] ?? LESSON_INFO.z1_lesson;

  const [phase, setPhase] = useState<LessonPhase>('intro');

  const { addXP } = useProfileStore();
  const { completeNode } = useNodeStore();

  const handleFinish = async () => {
    // Save completions and grant XP
    await addXP(20);
    await completeNode(lessonId);
    setPhase('success');
  };

  if (phase === 'intro') {
    return <LessonIntro lesson={lesson} lessonId={lessonId} onStart={() => setPhase('playing')} onBack={() => router.back()} />;
  }

  if (phase === 'success') {
    return <LessonSuccess lesson={lesson} onFinish={() => router.replace('/(tabs)/ruta')} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Back Header */}
      <View style={styles.playHeader}>
        <Pressable style={styles.backBtn} onPress={() => setPhase('intro')}>
          <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
          <Text style={styles.backTxt}>Intro</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{lesson.title}</Text>
        <View style={{ width: 60 }} />
      </View>

      {lessonId === 'z1_lesson' && <PeripheralVisionGame onComplete={handleFinish} accent={lesson.color} />}
      {lessonId === 'z2_lesson' && <LociMemoryPalace onComplete={handleFinish} accent={lesson.color} />}
      {lessonId === 'z3_lesson' && <SpeedMetronomeGame onComplete={handleFinish} accent={lesson.color} />}
    </SafeAreaView>
  );
}

// ─── INTRO SCREEN ────────────────────────────────────────────────────────────
function LessonIntro({ lesson, lessonId, onStart, onBack }: { lesson: LessonData; lessonId: string; onStart: () => void; onBack: () => void }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.introScroll} showsVerticalScrollIndicator={false}>
        {/* Back navigation */}
        <View style={styles.headerRow}>
          <Pressable style={styles.circularBack} onPress={onBack}>
            <Ionicons name="arrow-back" size={22} color={COLORS.ink} />
          </Pressable>
          <Text style={styles.badgeText}>{lesson.subtitle}</Text>
        </View>

        {/* Mascot display */}
        <Animated.View style={[styles.introHeroCard, animatedStyle]}>
          <MascotChar which={lesson.mascot} size={110} expression="happy" />
          <Text style={[styles.introTitle, { color: lesson.color }]}>{lesson.title}</Text>
          <Text style={styles.introSubtitle}>Neuro-Aprendizaje Interactivo</Text>
        </Animated.View>

        {/* Animated Visual Explanation Component */}
        <LessonVisualExplanation lessonId={lessonId} />

        {/* Content detail */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>¿En qué consiste?</Text>
          <Text style={styles.infoBody}>{lesson.introText}</Text>

          <Text style={[styles.infoLabel, { marginTop: 20 }]}>Beneficios Clave</Text>
          {lesson.benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={[styles.bulletDot, { backgroundColor: lesson.color }]} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Start CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.ctaBtn,
            { backgroundColor: lesson.color, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={onStart}
        >
          <Text style={styles.ctaBtnText}>Comenzar Práctica Interactiva</Text>
          <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 8 }} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── GAME 1: PERIPHERAL VISION (AMPLIACIÓN FOCAL) ─────────────────────────────
const PERIPHERAL_WORDS = [
  'FOCO', 'LENTE', 'Luz', 'HABITO', 'CAMPO',
  'PENSAR', 'MENTE', 'RITMO', 'CAPTURAR', 'BLOQUE',
  'AGIL', 'LECTOR', 'NEURONA', 'VELOZ', 'VISUAL'
];
function PeripheralVisionGame({ onComplete, accent }: { onComplete: () => void; accent: string }) {
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [focusMode, setFocusMode] = useState<'free' | '30s' | '60s' | '120s'>('free');
  const [playing, setPlaying] = useState(false);
  const [count, setCount] = useState(0);
  const [flashWord, setFlashWord] = useState('');
  const [flashPos, setFlashPos] = useState<'left' | 'right' | 'top' | 'bottom'>('left');
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(30);
  const [duration, setDuration] = useState(30);

  const flashOpacity = useSharedValue(0);
  const flashScale = useSharedValue(0.8);
  const pulseScale = useSharedValue(1);

  // Initialize timer limit based on mode
  useEffect(() => {
    if (focusMode === '30s') {
      setTimeLeft(30);
      setDuration(30);
    } else if (focusMode === '60s') {
      setTimeLeft(60);
      setDuration(60);
    } else if (focusMode === '120s') {
      setTimeLeft(120);
      setDuration(120);
    }
  }, [focusMode]);

  // Handle countdown timer when pressed
  useEffect(() => {
    if (isConfiguring || focusMode === 'free' || !playing) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConfiguring, focusMode, playing]);

  // Center button pulse when active
  useEffect(() => {
    if (playing) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      flashOpacity.value = withTiming(0, { duration: 150 });
      setFlashWord('');
    }
  }, [playing]);

  // Flash peripheral words periodically when pressed
  useEffect(() => {
    if (isConfiguring || !playing) return;

    let timer: any;
    const flash = () => {
      // For free mode, check total count of 15
      if (focusMode === 'free' && count >= 15) {
        onComplete();
        return;
      }

      // Choose random position and word
      const positions: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];
      const nextPos = positions[Math.floor(Math.random() * positions.length)];
      const nextWord = PERIPHERAL_WORDS[Math.floor(Math.random() * PERIPHERAL_WORDS.length)];

      setFlashPos(nextPos);
      setFlashWord(nextWord);

      // Trigger reanimated flash entrance
      flashScale.value = 0.8;
      flashOpacity.value = 0;
      flashScale.value = withSpring(1.05, { damping: 12 });
      flashOpacity.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1, { duration: 600 }), // Hold visible
        withTiming(0, { duration: 150 }, (finished) => {
          if (finished) {
            runOnJS(setCount)(count + 1);
          }
        })
      );

      timer = setTimeout(flash, 1400);
    };

    // First delay before flash
    timer = setTimeout(flash, 600);

    return () => clearTimeout(timer);
  }, [isConfiguring, playing, count, focusMode]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    shadowOpacity: playing ? 0.35 : 0.1,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: flashScale.value }],
  }));

  const getPositionCoords = (): any => {
    switch (flashPos) {
      case 'left':   return { left: 10, top: '48%', transform: [{ translateY: -12 }] };
      case 'right':  return { right: 10, top: '48%', transform: [{ translateY: -12 }] };
      case 'top':    return { top: 10, left: '50%', transform: [{ translateX: -40 }] };
      case 'bottom': return { bottom: 10, left: '50%', transform: [{ translateX: -40 }] };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (isConfiguring) {
    return (
      <ScrollView contentContainerStyle={styles.configContainer}>
        <Ionicons name="eye-outline" size={54} color={accent} style={{ marginBottom: 12, marginTop: 24 }} />
        <Text style={styles.configTitle}>Entrenamiento Periférico</Text>
        <Text style={styles.configSubtitle}>
          Entrena tu visión de reojo enfocándote en el centro mientras capturas palabras periféricas.
        </Text>

        <Text style={styles.sectionLabel}>Tiempo de Enfoque</Text>
        <View style={styles.optionsRow}>
          <Pressable
            style={[styles.optionBtn, focusMode === 'free' && { borderColor: accent, backgroundColor: `${accent}15` }]}
            onPress={() => setFocusMode('free')}
          >
            <Text style={[styles.optionText, focusMode === 'free' && { color: accent }]}>Libre</Text>
            <Text style={styles.optionSubText}>15 palabras</Text>
          </Pressable>

          <Pressable
            style={[styles.optionBtn, focusMode === '30s' && { borderColor: accent, backgroundColor: `${accent}15` }]}
            onPress={() => setFocusMode('30s')}
          >
            <Text style={[styles.optionText, focusMode === '30s' && { color: accent }]}>30s</Text>
            <Text style={styles.optionSubText}>Rápido</Text>
          </Pressable>

          <Pressable
            style={[styles.optionBtn, focusMode === '60s' && { borderColor: accent, backgroundColor: `${accent}15` }]}
            onPress={() => setFocusMode('60s')}
          >
            <Text style={[styles.optionText, focusMode === '60s' && { color: accent }]}>1 min</Text>
            <Text style={styles.optionSubText}>Estándar</Text>
          </Pressable>

          <Pressable
            style={[styles.optionBtn, focusMode === '120s' && { borderColor: accent, backgroundColor: `${accent}15` }]}
            onPress={() => setFocusMode('120s')}
          >
            <Text style={[styles.optionText, focusMode === '120s' && { color: accent }]}>2 min</Text>
            <Text style={styles.optionSubText}>Intenso</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed: btnAct }) => [
            styles.startBtn,
            { backgroundColor: accent, opacity: btnAct ? 0.8 : 1 }
          ]}
          onPress={() => setIsConfiguring(false)}
        >
          <Text style={styles.startBtnText}>Iniciar práctica</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.gameContainer}>
      {/* Sleek top status panel */}
      <View style={styles.sleekStatusPanel}>
        {focusMode === 'free' ? (
          <View style={{ width: '100%' }}>
            <ProgressBar value={count / 15} color={accent} height={6} />
            <Text style={styles.sleekStatusText}>{count} / 15 palabras completadas</Text>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            <ProgressBar value={(duration - timeLeft) / duration} color={accent} height={6} />
            <Text style={styles.sleekStatusText}>Tiempo restante: {formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Visual ring area */}
      <View style={styles.playboard}>
        {/* Ring guides */}
        <View style={[styles.ring, { width: 130, height: 130 }]} />
        <View style={[styles.ring, { width: 230, height: 230 }]} />

        {/* Flashing Peripheral Word */}
        {flashWord !== '' && (
          <Animated.View style={[styles.peripheralWordContainer, getPositionCoords(), flashStyle]}>
            <Text style={[styles.peripheralWordText, { color: accent }]}>{flashWord}</Text>
          </Animated.View>
        )}

        {/* Circular timer ring around the eye */}
        {(() => {
          const RING_SIZE = 100;
          const RING_R = 44;
          const circumference = 2 * Math.PI * RING_R;
          const timerProgress = focusMode === 'free'
            ? count / 15
            : (duration - timeLeft) / duration;
          return (
            <View style={styles.timerRingSvg} pointerEvents="none">
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <SvgCircle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                  stroke="rgba(255,255,255,0.12)" strokeWidth={4} fill="none"
                />
                <SvgCircle
                  cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
                  stroke={accent} strokeWidth={4} fill="none"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={`${circumference * (1 - timerProgress)}`}
                  strokeLinecap="round"
                  rotation={-90} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              </Svg>
            </View>
          );
        })()}

        {/* Central target of focus — tap to toggle */}
        <Pressable
          onPress={() => setPlaying(prev => !prev)}
          style={({ pressed: active }) => [
            styles.focalCenterWrapper,
            { transform: [{ scale: active ? 0.95 : 1 }] }
          ]}
        >
          <Animated.View style={[styles.focalCenter, { backgroundColor: accent, shadowColor: accent }, pulseStyle]}>
            <Ionicons name={playing ? 'eye' : 'eye-outline'} size={32} color="#fff" />
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.tipsSection}>
        <Ionicons name={playing ? 'happy-outline' : 'hand-left-outline'} size={20} color={accent} />
        <Text style={[styles.tipsText, { color: accent }]}>
          {playing 
            ? 'Mira fijamente al ojo central y lee de reojo.' 
            : 'Toca el ojo central para iniciar / pausar el ejercicio.'}
        </Text>
      </View>
    </View>
  );
}

// ─── GAME 2: METHOD OF LOCI (PALACIO DE LA MEMORIA) ───────────────────────────
interface LociRoom {
  id: string;
  name: string;
  rule: string;
  hook: string;
  x: number;
  y: number;
  imageUri?: string;
}
const LOCI_ROOMS: LociRoom[] = [
  {
    id: 'entrance',
    name: '1. Recibidor de la Entrada',
    rule: 'Regla: No Subvocalizar',
    hook: 'Imaginas un gran Reloj de Arena de oro desbordando palabras flotantes que entran a tu mente sin emitir sonido.',
    x: 60, y: 30
  },
  {
    id: 'hall',
    name: '2. Gran Salón de Espejos',
    rule: 'Regla: Leer en Bloques Semánticos',
    hook: 'Candelabros suspendidos que iluminan racimos de 3 palabras en lugar de letras individuales.',
    x: 230, y: 70
  },
  {
    id: 'library',
    name: '3. Biblioteca del Tiempo',
    rule: 'Regla: Utilizar Marcador Visual',
    hook: 'Hojas que vuelan a gran velocidad guiadas por un Rayo Láser brillante de color púrpura.',
    x: 100, y: 160
  },
  {
    id: 'balcony',
    name: '4. Balcón del Cosmos',
    rule: 'Regla: Expandir el Campo Visual',
    hook: 'Un gran Telescopio que en lugar de estrellas enfoca galaxias de ideas con un solo guiño periférico.',
    x: 250, y: 220
  },
  {
    id: 'dome',
    name: '5. Cúpula de Cristal Lumínica',
    rule: 'Regla: Confiar en tu Comprensión',
    hook: 'Un chorro de Luz Cristalina que vierte el sentido completo de un párrafo directamente en tu lóbulo frontal.',
    x: 150, y: 310
  }
];

function LociMemoryPalace({ onComplete, accent }: { onComplete: () => void; accent: string }) {
  const [visited, setVisited] = useState<string[]>([]);
  const [activeRoom, setActiveRoom] = useState<LociRoom | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState<string | null>(null);
  const [roomImages, setRoomImages] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});

  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (activeRoom || quizActive) {
      cardScale.value = 0.9;
      cardOpacity.value = 0;
      cardScale.value = withSpring(1, { damping: 14 });
      cardOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [activeRoom, quizActive]);

  const selectRoom = async (room: LociRoom) => {
    setActiveRoom(room);
    if (!visited.includes(room.id)) {
      setVisited([...visited, room.id]);
    }

    if (!roomImages[room.id] && !loadingImages[room.id]) {
      setLoadingImages(prev => ({ ...prev, [room.id]: true }));
      try {
        const { data, error } = await invokeEdgeFunction<{ imageBase64: string; mimeType?: string }>('ai-loci-images', {
          room: room.name,
          hook: room.hook,
        });
        if (!error && data) {
          const imageUri = data.imageBase64
            ? `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`
            : undefined;
          if (imageUri) {
            setRoomImages(prev => ({ ...prev, [room.id]: imageUri }));
          }
        }
      } catch (err) {
        console.warn('Failed to prefetch Loci illustration:', room.name, err);
      } finally {
        setLoadingImages(prev => ({ ...prev, [room.id]: false }));
      }
    }
  };

  const animatedCard = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleAnswer = (ans: string) => {
    setQuizAnswered(ans);
    if (ans === 'B') {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.lociScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.gameInstructions}>
        Construye tu primer Palacio Mental. Toca las 5 ubicaciones del palacio azul para memorizar las reglas clave de lectura veloz vinculadas a imágenes absurdas.
      </Text>

      {/* Blueprint Visual Map */}
      <View style={styles.blueprintContainer}>
        {/* Connection dashed line */}
        <View style={styles.blueprintGridPattern} />

        {/* Hotspots */}
        {LOCI_ROOMS.map((room, idx) => {
          const isVisited = visited.includes(room.id);
          const isActive = activeRoom?.id === room.id;
          return (
            <Pressable
              key={room.id}
              style={[styles.blueprintNode, { left: room.x, top: room.y }]}
              onPress={() => selectRoom(room)}
            >
              <View
                style={[
                  styles.blueprintRing,
                  {
                    borderColor: isActive ? COLORS.loci : isVisited ? COLORS.focus : '#9CA3AF',
                    backgroundColor: isActive ? COLORS.loci + '24' : isVisited ? COLORS.focus + '12' : '#F3F4F6'
                  }
                ]}
              >
                <Text style={[styles.blueprintNodeNum, { color: isActive ? '#fff' : isVisited ? COLORS.focus : '#4B5563' }]}>
                  {idx + 1}
                </Text>
              </View>
              {isVisited && !isActive && (
                <View style={styles.blueprintCheckedDot}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Room detail description */}
      {activeRoom && !quizActive && (
        <Animated.View style={[styles.lociDetailCard, animatedCard]}>
          <View style={styles.lociDetailHeader}>
            <Text style={styles.lociDetailTitle}>{activeRoom.name}</Text>
            <Pressable onPress={() => setActiveRoom(null)}>
              <Ionicons name="close-circle" size={24} color={COLORS.muted} />
            </Pressable>
          </View>
          <Text style={styles.lociDetailRule}>{activeRoom.rule}</Text>
          
          {loadingImages[activeRoom.id] ? (
            <View style={styles.lociDetailImagePlaceholder}>
              <ActivityIndicator size="small" color={COLORS.loci} />
              <Text style={styles.lociDetailImagePlaceholderText}>Diseñando escena con Imagen 3...</Text>
            </View>
          ) : roomImages[activeRoom.id] ? (
            <Image
              source={{ uri: roomImages[activeRoom.id] }}
              style={styles.lociDetailImage}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.lociHookBox}>
            <Text style={styles.lociHookText}>{activeRoom.hook}</Text>
          </View>
        </Animated.View>
      )}

      {/* Unlock quiz CTA */}
      {visited.length === 5 && !quizActive && (
        <Pressable
          style={({ pressed }) => [
            styles.quizTriggerBtn,
            { transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={() => {
            setActiveRoom(null);
            setQuizActive(true);
          }}
        >
          <Text style={styles.quizTriggerText}>Iniciar Desafío de Retención</Text>
          <Ionicons name="school" size={18} color="#fff" />
        </Pressable>
      )}

      {/* Quiz Modal Panel */}
      {quizActive && (
        <Animated.View style={[styles.lociDetailCard, animatedCard, { borderColor: COLORS.loci, borderWidth: 1.5 }]}>
          <Text style={styles.quizQuestionLabel}>Desafío de Retención Nemotécnica</Text>
          <Text style={styles.quizQuestion}>
            En la sala de la "Biblioteca del Tiempo" (Ubicación 3), ¿qué elemento guiaba a las páginas voladoras para entrenar tu marcador visual?
          </Text>

          <View style={styles.optionsCol}>
            {[
              { key: 'A', text: 'Un gran dragón plateado silbando palabras.' },
              { key: 'B', text: 'Un rayo láser brillante de color púrpura.' },
              { key: 'C', text: 'Candelabros de diamantes y cristales gigantes.' },
              { key: 'D', text: 'Un telescopio que apunta a galaxias lejanas.' }
            ].map((opt) => {
              const isSelected = quizAnswered === opt.key;
              const isCorrect = opt.key === 'B';
              let optBg: string = '#fff';
              let optBorder: string = COLORS.border;

              if (quizAnswered) {
                if (isCorrect) {
                  optBg = COLORS.focus + '16';
                  optBorder = COLORS.focus;
                } else if (isSelected) {
                  optBg = '#FEE2E2';
                  optBorder = '#EF4444';
                }
              }

              return (
                <Pressable
                  key={opt.key}
                  disabled={quizAnswered !== null}
                  style={[styles.quizOptionBtn, { backgroundColor: optBg, borderColor: optBorder }]}
                  onPress={() => handleAnswer(opt.key)}
                >
                  <Text style={[styles.quizOptionLetter, { color: isCorrect && quizAnswered ? COLORS.focus : COLORS.ink }]}>
                    {opt.key})
                  </Text>
                  <Text style={styles.quizOptionText}>{opt.text}</Text>
                  {quizAnswered && isCorrect && <Ionicons name="checkmark-circle" size={18} color={COLORS.focus} />}
                  {quizAnswered && isSelected && !isCorrect && <Ionicons name="close-circle" size={18} color="#EF4444" />}
                </Pressable>
              );
            })}
          </View>

          {quizAnswered === 'B' && (
            <Text style={styles.quizSuccessFeedback}>
              ¡Espectacular! Tu mente ha enganchado perfectamente el concepto en tu palacio de Loci. ¡Lección superada!
            </Text>
          )}
          {quizAnswered !== null && quizAnswered !== 'B' && (
            <Pressable
              style={styles.retryQuizBtn}
              onPress={() => setQuizAnswered(null)}
            >
              <Text style={styles.retryQuizBtnText}>Intentar de nuevo</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </ScrollView>
  );
}

// ─── GAME 3: SPEED METRONOME (RITMO SEMÁNTICO) ────────────────────────────────
const SEMANTIC_CHUNKS = [
  'La plasticidad', 'cerebral nos permite', 'reconfigurar nuestra mente',
  'para asimilar información', 'a velocidades sorprendentes.', 'Al fijar la mirada',
  'en bloques semánticos', 'en lugar de letras sueltas,', 'evitamos la subvocalización',
  'y liberamos el potencial', 'del cerebro lector.', 'Entrenar el ritmo',
  'con una guía visual', 'acostumbra a los ojos', 'a dar saltos precisos',
  'y procesar ideas completas', 'con un solo impacto focal.', 'Práctica constantemente',
  'para expandir tu visión', 'y alcanzar la maestría.'
];
function SpeedMetronomeGame({ onComplete, accent }: { onComplete: () => void; accent: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [chunkIndex, setChunkIndex] = useState(0);

  const cursorScale = useSharedValue(1);

  // Metronome interval effect
  useEffect(() => {
    if (!isPlaying) return;

    // Calculate delay per chunk: (60 / WPM) * 1000 * average words per chunk (e.g. 2.2 words)
    const delay = (60 / wpm) * 1000 * 2.2;

    const interval = setInterval(() => {
      setChunkIndex((prev) => {
        if (prev >= SEMANTIC_CHUNKS.length - 1) {
          setIsPlaying(false);
          runOnJS(onComplete)();
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isPlaying, wpm]);

  return (
    <View style={styles.gameContainer}>
      <Text style={styles.gameInstructions}>
        Ajusta el metrónomo a tu velocidad deseada y presiona PLAY. Sigue con tus ojos el bloque resaltado de manera silenciosa (sin pronunciar).
      </Text>

      {/* Controls Container */}
      <View style={styles.metronomeControls}>
        <View style={styles.speedConfigRow}>
          <Text style={styles.speedConfigLabel}>Velocidad de Lectura:</Text>
          <View style={styles.wpmAdjuster}>
            <Pressable
              onPress={() => setWpm(prev => Math.max(200, prev - 50))}
              style={styles.adjusterBtn}
            >
              <Ionicons name="remove" size={16} color={COLORS.ink} />
            </Pressable>
            <Text style={[styles.speedConfigValue, { color: accent }]}>{wpm} WPM</Text>
            <Pressable
              onPress={() => setWpm(prev => Math.min(800, prev + 50))}
              style={styles.adjusterBtn}
            >
              <Ionicons name="add" size={16} color={COLORS.ink} />
            </Pressable>
          </View>
        </View>

        {/* Speed Presets Horizontal Row */}
        <View style={styles.presetsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsScroll}>
            {[200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800].map((speed) => {
              const isSelected = speed === wpm;
              return (
                <Pressable
                  key={speed}
                  onPress={() => setWpm(speed)}
                  style={[
                    styles.presetCapsule,
                    isSelected && { backgroundColor: accent, borderColor: accent }
                  ]}
                >
                  <Text style={[styles.presetText, isSelected && { color: '#fff' }]}>
                    {speed}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Play/Pause control button */}
        <Pressable
          style={({ pressed }) => [
            styles.metronomePlayBtn,
            { backgroundColor: isPlaying ? COLORS.ink : accent, transform: [{ scale: pressed ? 0.95 : 1 }] }
          ]}
          onPress={() => setIsPlaying(!isPlaying)}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
          <Text style={styles.metronomePlayBtnText}>
            {isPlaying ? 'Pausar Metrónomo' : 'Iniciar Metrónomo'}
          </Text>
        </Pressable>
      </View>

      {/* Text Passage Display Container */}
      <View style={styles.passageDisplay}>
        <ScrollView contentContainerStyle={styles.passageGrid} showsVerticalScrollIndicator={false}>
          {SEMANTIC_CHUNKS.map((chunk, idx) => {
            const isActive = idx === chunkIndex;
            return (
              <Pressable
                key={idx}
                style={[
                  styles.semanticChunkWrapper,
                  isActive && { backgroundColor: accent + '1E', borderColor: accent }
                ]}
                onPress={() => setChunkIndex(idx)}
              >
                <Text
                  style={[
                    styles.semanticChunkText,
                    {
                      color: isActive ? accent : COLORS.ink,
                      fontFamily: isActive ? FONTS.bodyBold : FONTS.body
                    }
                  ]}
                >
                  {chunk}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

// ─── LESSON SUCCESS CELEBRATION ──────────────────────────────────────────────
function LessonSuccess({ lesson, onFinish }: { lesson: LessonData; onFinish: () => void }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 80 });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: '#F8FAFC' }]}>
      <View style={styles.successContainer}>
        {/* Floating background spark effects */}
        <View style={styles.sparkBackground} />

        <Animated.View style={[styles.successCard, animatedStyle]}>
          <MascotChar which={lesson.mascot} size={130} expression="happy" />

          <Text style={styles.successHeadline}>¡LECCIÓN SUPERADA!</Text>
          <Text style={styles.successDescription}>
            Has completado la práctica interactiva de {lesson.title} y asimilado una nueva destreza neuronal.
          </Text>

          {/* XP Reward card */}
          <View style={styles.rewardXPCard}>
            <View style={styles.goldBadge}>
              <Ionicons name="flash" size={26} color="#FBBF24" />
            </View>
            <View>
              <Text style={styles.rewardXPAmount}>+20 XP</Text>
              <Text style={styles.rewardXPLabel}>Incremento Cognitivo</Text>
            </View>
          </View>

          {/* Continue CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.successCtaBtn,
              { backgroundColor: lesson.color, transform: [{ scale: pressed ? 0.97 : 1 }] }
            ]}
            onPress={onFinish}
          >
            <Text style={styles.successCtaText}>Volver a la Ruta</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// ─── VISUAL ANIMATION EXPLANATIONS FOR LESSONS ───────────────────────────────
function LessonVisualExplanation({ lessonId }: { lessonId: string }) {
  if (lessonId === 'z1_lesson') return <FocalVisionIntroAnimation />;
  if (lessonId === 'z2_lesson') return <LociPalaceIntroAnimation />;
  if (lessonId === 'z3_lesson') return <MetronomeIntroAnimation />;
  return null;
}

function FocalVisionIntroAnimation() {
  const pulse = useSharedValue(1);
  const wordsOpacity = useSharedValue(0.2);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.2, { duration: 1200 }), withTiming(1, { duration: 1200 })), -1, true);
    wordsOpacity.value = withRepeat(withSequence(withTiming(1, { duration: 1200 }), withTiming(0.2, { duration: 1200 })), -1, true);
  }, []);
  const outerFrameStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], borderColor: COLORS.focus }));
  const textStyle = useAnimatedStyle(() => ({ opacity: wordsOpacity.value }));
  return (
    <View style={styles.expCard}>
      <Text style={styles.expLabel}>DEMOSTRACIÓN VISUAL: AMPLIACIÓN FOCAL</Text>
      <View style={styles.focalDemoContainer}>
        <Animated.View style={[styles.focalDemoFrame, outerFrameStyle]} />
        <Animated.Text style={[styles.focalDemoWord, { top: 12, left: 16 }, textStyle]}>RÁPIDO</Animated.Text>
        <Animated.Text style={[styles.focalDemoWord, { top: 12, right: 16 }, textStyle]}>AGIL</Animated.Text>
        <Animated.Text style={[styles.focalDemoWord, { bottom: 12, left: 16 }, textStyle]}>LECTOR</Animated.Text>
        <Animated.Text style={[styles.focalDemoWord, { bottom: 12, right: 16 }, textStyle]}>CEREBRO</Animated.Text>
        <View style={[styles.focalDemoCenter, { backgroundColor: COLORS.focus }]}>
          <Ionicons name="eye" size={24} color="#fff" />
          <Text style={styles.focalDemoCenterText}>Mira Fijo</Text>
        </View>
      </View>
      <Text style={styles.expCaption}>Tus ojos se quedan en el centro, mientras tu mente captura las palabras de las esquinas.</Text>
    </View>
  );
}

function LociPalaceIntroAnimation() {
  const activeRoomIdx = useSharedValue(0);
  useEffect(() => {
    activeRoomIdx.value = withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 1500 }), withTiming(2, { duration: 1500 }), withTiming(2, { duration: 1000 })), -1, false);
  }, []);
  const spark1Style = useAnimatedStyle(() => ({ opacity: activeRoomIdx.value >= 0 && activeRoomIdx.value < 1 ? 1 : 0.3, transform: [{ scale: activeRoomIdx.value >= 0 && activeRoomIdx.value < 1 ? 1.05 : 1 }] }));
  const spark2Style = useAnimatedStyle(() => ({ opacity: activeRoomIdx.value >= 1 && activeRoomIdx.value < 2 ? 1 : 0.3, transform: [{ scale: activeRoomIdx.value >= 1 && activeRoomIdx.value < 2 ? 1.05 : 1 }] }));
  const spark3Style = useAnimatedStyle(() => ({ opacity: activeRoomIdx.value >= 2 ? 1 : 0.3, transform: [{ scale: activeRoomIdx.value >= 2 ? 1.05 : 1 }] }));
  return (
    <View style={styles.expCard}>
      <Text style={styles.expLabel}>DEMOSTRACIÓN VISUAL: PALACIO DE LOCI</Text>
      <View style={styles.lociDemoContainer}>
        <View style={styles.lociDemoRooms}>
          <Animated.View style={[styles.lociDemoRoom, spark1Style]}><Ionicons name="home" size={20} color={COLORS.calm} /><Text style={styles.lociDemoRoomName}>1. Entrada</Text><Text style={styles.lociDemoRoomRule}>No hablar interno</Text></Animated.View>
          <Animated.View style={[styles.lociDemoRoom, spark2Style]}><Ionicons name="images" size={20} color={COLORS.loci} /><Text style={styles.lociDemoRoomName}>2. Salón</Text><Text style={styles.lociDemoRoomRule}>Bloques de texto</Text></Animated.View>
          <Animated.View style={[styles.lociDemoRoom, spark3Style]}><Ionicons name="book" size={20} color={COLORS.focus} /><Text style={styles.lociDemoRoomName}>3. Librero</Text><Text style={styles.lociDemoRoomRule}>Marcador visual</Text></Animated.View>
        </View>
        <View style={styles.lociDemoLine} />
      </View>
      <Text style={styles.expCaption}>Un rayo luminoso de memoria viaja asociando reglas con habitaciones conocidas.</Text>
    </View>
  );
}

function MetronomeIntroAnimation() {
  const angle = useSharedValue(-25);
  const activeChunk = useSharedValue(0);
  useEffect(() => {
    angle.value = withRepeat(withSequence(withTiming(25, { duration: 900 }), withTiming(-25, { duration: 900 })), -1, true);
    activeChunk.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(2, { duration: 900 })), -1, true);
  }, []);
  const pendStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  const chunk1Style = useAnimatedStyle(() => ({ backgroundColor: activeChunk.value < 1.5 ? COLORS.swift + '22' : 'transparent', borderColor: activeChunk.value < 1.5 ? COLORS.swift : 'transparent' }));
  const chunk2Style = useAnimatedStyle(() => ({ backgroundColor: activeChunk.value >= 1.5 ? COLORS.swift + '22' : 'transparent', borderColor: activeChunk.value >= 1.5 ? COLORS.swift : 'transparent' }));
  return (
    <View style={styles.expCard}>
      <Text style={styles.expLabel}>DEMOSTRACIÓN VISUAL: RITMO SEMÁNTICO</Text>
      <View style={styles.swiftDemoContainer}>
        <View style={styles.metronomeDemoBase}>
          <Animated.View style={[styles.metronomeDemoPendulum, pendStyle]}><View style={styles.metronomeDemoWeight} /></Animated.View>
          <View style={styles.metronomeDemoDot} />
        </View>
        <View style={styles.swiftDemoChunks}>
          <Animated.View style={[styles.swiftDemoChunk, chunk1Style]}><Text style={styles.swiftDemoText}>Tus ojos dan</Text></Animated.View>
          <Animated.View style={[styles.swiftDemoChunk, chunk2Style]}><Text style={styles.swiftDemoText}>saltos rítmicos</Text></Animated.View>
        </View>
      </View>
      <Text style={styles.expCaption}>El metrónomo guía tu mirada en saltos rítmicos uniformes saltando palabras inútiles.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  introScroll: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  circularBack: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.muted,
  },
  introHeroCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  introTitle: {
    fontFamily: FONTS.heading,
    fontSize: 26,
    marginTop: 16,
    textAlign: 'center',
  },
  introSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 30,
  },
  infoLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.ink,
    marginBottom: 8,
  },
  infoBody: {
    fontFamily: FONTS.bodyLight,
    fontSize: 14,
    color: COLORS.inkLight,
    lineHeight: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  benefitText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.inkLight,
    flex: 1,
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#fff',
  },

  // PLAY GAME GENERAL
  playHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1.2,
    borderBottomColor: COLORS.border,
    backgroundColor: '#fff',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backTxt: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
  },
  headerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: COLORS.ink,
  },
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  configContainer: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
    alignSelf: 'center',
    flexGrow: 1,
  },
  configTitle: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: COLORS.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  configSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.inkLight,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: 12,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 32,
  },
  optionBtn: {
    width: '46%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  optionText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.ink,
  },
  optionSubText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 2,
  },
  startBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  startBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#fff',
  },
  sleekStatusPanel: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  sleekStatusText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: COLORS.inkLight,
    textAlign: 'center',
    marginTop: 8,
  },
  tipsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 36,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxWidth: 320,
  },
  tipsText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
  },
  gameInstructions: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.inkLight,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },

  // GAME 1: PERIPHERAL TARGET
  progressContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 24,
  },
  progressText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  playboard: {
    width: '100%',
    maxWidth: 290,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  peripheralWordContainer: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FAFAF9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peripheralWordText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  timerRingSvg: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
  focalCenterWrapper: {
    zIndex: 10,
  },
  focalCenter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 5,
  },
  pressedTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 30,
  },
  pressedTipText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
  },

  // GAME 2: METHOD OF LOCI
  lociScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  blueprintContainer: {
    width: 320,
    height: 380,
    borderRadius: 24,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  blueprintGridPattern: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: '#fff',
  },
  blueprintNode: {
    position: 'absolute',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  blueprintRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blueprintNodeNum: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
  },
  blueprintCheckedDot: {
    position: 'absolute',
    top: -4, right: -4,
    width: 16, height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.focus,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  lociDetailCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  lociDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lociDetailTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: COLORS.ink,
  },
  lociDetailRule: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: COLORS.loci,
    marginBottom: 10,
  },
  lociHookBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  lociHookText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: '#5B21B6',
    lineHeight: 18,
  },
  lociDetailImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  lociDetailImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  lociDetailImagePlaceholderText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  },
  quizTriggerBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.loci,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    shadowColor: COLORS.loci,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  quizTriggerText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#fff',
  },
  quizQuestionLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: COLORS.loci,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quizQuestion: {
    fontFamily: FONTS.headingSemi,
    fontSize: 14,
    color: COLORS.ink,
    lineHeight: 20,
    marginBottom: 16,
  },
  optionsCol: {
    gap: 10,
  },
  quizOptionBtn: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quizOptionLetter: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
  },
  quizOptionText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.inkLight,
    flex: 1,
  },
  quizSuccessFeedback: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: COLORS.focus,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  retryQuizBtn: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  retryQuizBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 13,
    color: COLORS.loci,
  },

  // GAME 3: SPEED METRONOME
  metronomeControls: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  speedConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  speedConfigLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 13,
    color: COLORS.muted,
  },
  speedConfigValue: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
  },
  wpmAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adjusterBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetsWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  presetsScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  presetCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: '#fff',
    minWidth: 54,
    alignItems: 'center',
  },
  presetText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: COLORS.ink,
  },
  metronomePlayBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  metronomePlayBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: '#fff',
  },
  passageDisplay: {
    flex: 1,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
  },
  passageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 20,
  },
  semanticChunkWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  semanticChunkText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // SUCCESS STATE CELEBRATION
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sparkBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  successHeadline: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    color: COLORS.focus,
    marginTop: 20,
    letterSpacing: 1,
  },
  successDescription: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  rewardXPCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 28,
    gap: 12,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  goldBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardXPAmount: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    color: '#D97706',
  },
  rewardXPLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#92400E',
  },
  successCtaBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  successCtaText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#fff',
  },
  expCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  expLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: 11,
    color: COLORS.inkLight,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  expCaption: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 16,
    marginTop: 12,
  },
  focalDemoContainer: {
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  focalDemoFrame: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  focalDemoCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  focalDemoCenterText: {
    fontFamily: FONTS.headingBold,
    fontSize: 9,
    color: '#fff',
    marginTop: 2,
  },
  focalDemoWord: {
    position: 'absolute',
    fontFamily: FONTS.headingBold,
    fontSize: 10,
    color: COLORS.inkLight,
  },
  lociDemoContainer: {
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  lociDemoRooms: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  lociDemoRoom: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  lociDemoRoomName: {
    fontFamily: FONTS.headingBold,
    fontSize: 9,
    color: COLORS.ink,
    marginTop: 4,
  },
  lociDemoRoomRule: {
    fontFamily: FONTS.body,
    fontSize: 8,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  lociDemoLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: COLORS.loci + '33',
    top: '50%',
    zIndex: 1,
  },
  swiftDemoContainer: {
    height: 120,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  metronomeDemoBase: {
    width: 60,
    height: 80,
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
  },
  metronomeDemoPendulum: {
    width: 3,
    height: 50,
    backgroundColor: COLORS.ink,
    position: 'absolute',
    top: 10,
    alignItems: 'center',
  },
  metronomeDemoWeight: {
    width: 10,
    height: 10,
    backgroundColor: COLORS.swift,
    borderRadius: 5,
    position: 'absolute',
    top: 15,
  },
  metronomeDemoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ink,
  },
  swiftDemoChunks: {
    flex: 1,
    gap: 10,
  },
  swiftDemoChunk: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  swiftDemoText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: COLORS.ink,
  },
});
