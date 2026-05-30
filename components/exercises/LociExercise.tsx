import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ExerciseTopBar } from './ExerciseTopBar';
import { LOCI_OBJECTS } from '../../constants/passages';
import { getLociPresetStory, LOCI_OBJECT_METAS } from '../../constants/lociPresets';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { useRewardsStore } from '../../store/useRewardsStore';
import { usePrefsStore } from '../../store/usePrefsStore';
import { useLociStore } from '../../store/useLociStore';
import { supabase } from '../../lib/supabase';

const ROOM_THEMES = {
  casa: [
    { id: 'entrance', label: 'Entrada',   x: 18, y: 72, icon: 'log-in-outline' },
    { id: 'kitchen',  label: 'Cocina',    x: 68, y: 72, icon: 'restaurant-outline' },
    { id: 'living',   label: 'Sala',      x: 42, y: 46, icon: 'tv-outline' },
    { id: 'bedroom',  label: 'Dormitorio',x: 18, y: 22, icon: 'bed-outline' },
    { id: 'office',   label: 'Oficina',   x: 68, y: 22, icon: 'desktop-outline' },
    { id: 'bath',     label: 'Baño',      x: 82, y: 46, icon: 'water-outline' },
    { id: 'garden',   label: 'Jardín',    x: 18, y: 46, icon: 'leaf-outline' },
    { id: 'attic',    label: 'Ático',     x: 50, y:  8, icon: 'home-outline' },
  ],
  oficina: [
    { id: 'entrance', label: 'Recepción', x: 18, y: 72, icon: 'briefcase-outline' },
    { id: 'kitchen',  label: 'Cafetería', x: 68, y: 72, icon: 'cafe-outline' },
    { id: 'living',   label: 'Reuniones', x: 42, y: 46, icon: 'people-outline' },
    { id: 'bedroom',  label: 'Relax',     x: 18, y: 22, icon: 'happy-outline' },
    { id: 'office',   label: 'Escritorio',x: 68, y: 22, icon: 'desktop-outline' },
    { id: 'bath',     label: 'Sanitario', x: 82, y: 46, icon: 'water-outline' },
    { id: 'garden',   label: 'Terraza',   x: 18, y: 46, icon: 'trail-sign-outline' },
    { id: 'attic',    label: 'Archivo',   x: 50, y:  8, icon: 'archive-outline' },
  ],
  naturaleza: [
    { id: 'entrance', label: 'Sendero',   x: 18, y: 72, icon: 'walk-outline' },
    { id: 'kitchen',  label: 'Campamento',x: 68, y: 72, icon: 'bonfire-outline' },
    { id: 'living',   label: 'El Claro',  x: 42, y: 46, icon: 'sunny-outline' },
    { id: 'bedroom',  label: 'Cabaña',    x: 18, y: 22, icon: 'home-outline' },
    { id: 'office',   label: 'Mirador',   x: 68, y: 22, icon: 'compass-outline' },
    { id: 'bath',     label: 'Cascada',   x: 82, y: 46, icon: 'water-outline' },
    { id: 'garden',   label: 'El Lago',   x: 18, y: 46, icon: 'boat-outline' },
    { id: 'attic',    label: 'La Cueva',  x: 50, y:  8, icon: 'prism-outline' },
  ],
  cuerpo: [
    { id: 'head',     label: 'Cabeza',    x: 50, y:  8, icon: 'person-outline' },
    { id: 'eyes',     label: 'Ojos',      x: 32, y: 22, icon: 'eye-outline' },
    { id: 'mouth',    label: 'Boca',      x: 68, y: 22, icon: 'happy-outline' },
    { id: 'shoulders',label: 'Hombros',   x: 18, y: 46, icon: 'shield-outline' },
    { id: 'chest',    label: 'Pecho',     x: 50, y: 46, icon: 'heart-outline' },
    { id: 'hands',    label: 'Manos',     x: 82, y: 46, icon: 'hand-left-outline' },
    { id: 'knees',    label: 'Rodillas',  x: 32, y: 72, icon: 'walk-outline' },
    { id: 'feet',     label: 'Pies',      x: 68, y: 72, icon: 'foot-outline' },
  ],
  mano: [
    { id: 'thumb',    label: 'Pulgar',    x: 18, y: 72, icon: 'thumbs-up-outline' },
    { id: 'index',    label: 'Índice',    x: 32, y: 38, icon: 'hand-left-outline' },
    { id: 'middle',   label: 'Medio',     x: 50, y: 16, icon: 'finger-print-outline' },
    { id: 'ring',     label: 'Anular',    x: 68, y: 38, icon: 'star-outline' },
    { id: 'pinky',    label: 'Meñique',   x: 82, y: 72, icon: 'sparkles-outline' },
  ],
};

const ROOM_ASPECTS: Record<string, { emoji: string; colors: [string, string]; border: string; textColor: string }> = {
  entrance: { emoji: '🚪', colors: ['#ECFDF5', '#D1FAE5'], border: '#A7F3D0', textColor: '#065F46' },
  kitchen:  { emoji: '🍳', colors: ['#FFF7ED', '#FFEDD5'], border: '#FED7AA', textColor: '#9A3412' },
  living:   { emoji: '🛋️', colors: ['#FEF2F2', '#FEE2E2'], border: '#FECACA', textColor: '#991B1B' },
  bedroom:  { emoji: '🛏️', colors: ['#EFF6FF', '#DBEAFE'], border: '#BFDBFE', textColor: '#1E40AF' },
  office:   { emoji: '💻', colors: ['#F5F3FF', '#EDE9FE'], border: '#DDD6FE', textColor: '#5B21B6' },
  bath:     { emoji: '🛁', colors: ['#F0FDFA', '#CCFBF1'], border: '#99F6E4', textColor: '#0F766E' },
  garden:   { emoji: '🏡', colors: ['#F0FDF4', '#DCFCE7'], border: '#BBF7D0', textColor: '#166534' },
  attic:    { emoji: '📦', colors: ['#FAFAF9', '#F5F5F4'], border: '#E7E5E4', textColor: '#44403C' },
  head:      { emoji: '🧘', colors: ['#FFF5F5', '#FEE2E2'], border: '#FEBACA', textColor: '#991B1B' },
  eyes:      { emoji: '👁️', colors: ['#EFF6FF', '#DBEAFE'], border: '#BFDBFE', textColor: '#1E40AF' },
  mouth:     { emoji: '👄', colors: ['#FFF7ED', '#FFEDD5'], border: '#FED7AA', textColor: '#9A3412' },
  shoulders: { emoji: '💪', colors: ['#F5F3FF', '#EDE9FE'], border: '#DDD6FE', textColor: '#5B21B6' },
  chest:     { emoji: '💖', colors: ['#FDF2F8', '#FCE7F3'], border: '#FBCFE8', textColor: '#9D174D' },
  hands:     { emoji: '👐', colors: ['#ECFDF5', '#D1FAE5'], border: '#A7F3D0', textColor: '#065F46' },
  knees:     { emoji: '🦵', colors: ['#F0FDF4', '#DCFCE7'], border: '#BBF7D0', textColor: '#166534' },
  feet:      { emoji: '👣', colors: ['#FAFAF9', '#F5F5F4'], border: '#E7E5E4', textColor: '#44403C' },
  thumb:     { emoji: '👍', colors: ['#ECFDF5', '#D1FAE5'], border: '#A7F3D0', textColor: '#065F46' },
  index:     { emoji: '☝️', colors: ['#EFF6FF', '#DBEAFE'], border: '#BFDBFE', textColor: '#1E40AF' },
  middle:    { emoji: '🖕', colors: ['#F5F3FF', '#EDE9FE'], border: '#DDD6FE', textColor: '#5B21B6' },
  ring:      { emoji: '💍', colors: ['#FDF2F8', '#FCE7F3'], border: '#FBCFE8', textColor: '#9D174D' },
  pinky:     { emoji: '🤙', colors: ['#FFF7ED', '#FFEDD5'], border: '#FED7AA', textColor: '#9A3412' },
};

interface Props {
  count?: number;
  studyMs?: number;
  accent?: string;
  palaceId?: string; // New palaceId prop
  onFinish: (result: { correct: number; total: number; time: number }) => void;
  onQuit: () => void;
}

// Bizarre Surreal Associations Generator in Spanish
function getSurrealLociAssociation(roomLabel: string, objectWord: string): string {
  const templates = [
    "¡Qué locura! Un(a) {OBJ} gigante de chocolate derretido flota tapando la salida de la {ROOM}.",
    "¡Bizarro! Un ejército de {OBJ} vestidas de gala bailan salsa sobre el techo de la {ROOM}.",
    "¡Surrealista! Un(a) {OBJ} dorado con alas lanza fuegos artificiales de colores en la {ROOM}.",
    "¡Mágico! Un pulpo espacial usa un(a) {OBJ} de almohada mientras ronca plácidamente en la {ROOM}.",
    "¡Insólito! Un(a) {OBJ} transparente levita y canta ópera multiplicándose por toda la {ROOM}.",
  ];
  const idx = (roomLabel.length + objectWord.length) % templates.length;
  return templates[idx]
    .replace('{OBJ}', objectWord.toUpperCase())
    .replace('{ROOM}', roomLabel.toLowerCase());
}

export function LociExercise({ count = 5, studyMs = 4000, accent = '#8B5CF6', palaceId, onFinish, onQuit }: Props) {
  const { getPalace } = useLociStore();
  const customPalace = palaceId ? getPalace(palaceId) : undefined;

  const [assoc] = useState(() => {
    if (customPalace && customPalace.memories) {
      const themeName = customPalace.theme || 'casa';
      const ALL_ROOMS = themeName !== 'custom' ? (ROOM_THEMES[themeName as keyof typeof ROOM_THEMES] || ROOM_THEMES.casa) : ROOM_THEMES.casa;
      return customPalace.memories.map((m, i) => {
        const templateRoom = ALL_ROOMS.find((r: { id: string; label: string; x: number; y: number; icon: string }) => r.label.toLowerCase() === m.room.toLowerCase()) || ALL_ROOMS[i % ALL_ROOMS.length];
        return {
          id: templateRoom?.id || `room_${i}`,
          label: m.room,
          word: m.item,
          story: m.story,
          image_url: m.image_url,
          x: templateRoom?.x ?? 50,
          y: templateRoom?.y ?? 50,
          icon: templateRoom?.icon ?? 'home-outline',
        };
      });
    } else {
      const palaceTheme = usePrefsStore.getState().prefs.loci_palace || 'casa';
      const ALL_ROOMS = palaceTheme !== 'custom' ? (ROOM_THEMES[palaceTheme as keyof typeof ROOM_THEMES] || ROOM_THEMES.casa) : ROOM_THEMES.casa;
      const wantCount = Math.min(8, Math.max(3, count));
      const rooms = ALL_ROOMS.slice(0, wantCount);
      const words = LOCI_OBJECTS.slice(0, wantCount);
      return rooms.map((r, i) => {
        const word = words[i];
        const story = getLociPresetStory(palaceTheme, r.label, word);
        const meta = LOCI_OBJECT_METAS[word.toLowerCase()] || LOCI_OBJECT_METAS.llave;
        const image_url = meta.imageUrl;
        return {
          ...r,
          word,
          story,
          image_url,
        };
      });
    }
  });

  const [aiStories, setAiStories] = useState<Record<string, string>>({});
  const [aiImages, setAiImages] = useState<Record<string, string>>({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const [phase, setPhase] = useState<'learn' | 'recall'>('learn');
  const [learnIdx, setLearnIdx] = useState(0);
  const [recallIdx, setRecallIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ room: string; correct: boolean } | null>(null);
  const startTime = React.useRef(Date.now());

  useEffect(() => {
    // Presets are loaded statically, no edge function needed for default exercises.
    // Custom palaces are loaded in creation phase.
    return;
  }, [assoc, customPalace]);

  // Loci Hint state
  const { owned, consume } = useRewardsStore();
  const hasHint = owned.includes('pw-hint');
  const [hintActive, setHintActive] = useState(false);

  useEffect(() => {
    if (phase !== 'learn') return;
    const t = setTimeout(() => {
      if (learnIdx + 1 >= assoc.length) setPhase('recall');
      else setLearnIdx(i => i + 1);
    }, studyMs);
    return () => clearTimeout(t);
  }, [learnIdx, phase, studyMs]);

  useEffect(() => {
    setHintActive(false);
  }, [recallIdx]);

  const handleRoomPick = (roomId: string) => {
    if (feedback) return;
    const target = assoc[recallIdx];
    const correct = roomId === target.id;
    setFeedback({ room: roomId, correct });
    setTimeout(() => {
      const newAnswers = [...answers, correct];
      setAnswers(newAnswers);
      setFeedback(null);
      if (recallIdx + 1 >= assoc.length) {
        onFinish({ correct: newAnswers.filter(Boolean).length, total: assoc.length, time: (Date.now() - startTime.current) / 1000 });
      } else {
        setRecallIdx(i => i + 1);
      }
    }, 1000);
  };

  const current = phase === 'learn' ? assoc[learnIdx] : assoc[recallIdx];
  
  // Get dynamic surreal mnemonic text
  const bizarreText = current.story || getSurrealLociAssociation(current.label, current.word);
  
  const imageUri = current.image_url || aiImages[current.id];

  const isStoryLoading = false;

  return (
    <View style={styles.container}>
      <ExerciseTopBar
        progress={phase === 'learn' ? (learnIdx + 1) / assoc.length : recallIdx / assoc.length}
        accent={accent}
        onQuit={onQuit}
        title={phase === 'learn' ? 'Aprende' : 'Recuerda'}
      />

      <View style={styles.infoRow}>
        {phase === 'learn' ? (
          <View style={styles.learnHeader}>
            <Text style={styles.hint}>Asocia objeto con habitación ({learnIdx + 1}/{assoc.length})</Text>
            
            <View style={styles.assocRow}>
              <View style={[styles.wordBubble, { backgroundColor: accent, shadowColor: accent }]}>
                <Text style={styles.wordBubbleText}>{current.word}</Text>
              </View>
              <Text style={[styles.arrow, { color: accent }]}>→</Text>
              <View style={[styles.roomBubble, { borderColor: accent }]}>
                <Text style={[styles.roomBubbleText, { color: accent }]}>{current.label}</Text>
              </View>
            </View>

            {/* AI Bizarre Association Card */}
            <LociStoryCard
              text={bizarreText}
              roomId={current.id}
              imageUri={imageUri}
              isLoading={isStoryLoading}
              key={learnIdx}
            />
          </View>
        ) : (
          <View style={styles.recallHeader}>
            <Text style={styles.hint}>¿Dónde pusiste este objeto?</Text>
            <View style={[styles.wordBubble, { backgroundColor: accent, alignSelf: 'center', shadowColor: accent }]}>
              <Text style={styles.wordBubbleText}>{current.word}</Text>
            </View>

            {/* Glowing Loci Hint Button */}
            {hasHint && !hintActive && !feedback && (
              <Pressable
                onPress={() => {
                  consume('pw-hint');
                  setHintActive(true);
                }}
                style={styles.lociHintBtn}
              >
                <Ionicons name="bulb" size={16} color="#fff" />
                <Text style={styles.lociHintBtnText}>Revelar habitación (Usar pista)</Text>
              </Pressable>
            )}

            {hintActive && (
              <View style={styles.lociHintActiveBanner}>
                <Ionicons name="sparkles" size={14} color="#8B5CF6" />
                <Text style={styles.lociHintActiveText}>Pista activa: ¡Búscalo en la habitación destacada!</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <HouseMap
        assoc={assoc}
        phase={phase}
        highlightId={phase === 'learn' ? current.id : feedback?.room}
        badgeUpTo={phase === 'learn' ? learnIdx + 1 : undefined}
        feedback={feedback}
        accent={accent}
        onRoomPress={handleRoomPick}
        hintActive={hintActive}
        targetRoomId={current.id}
      />

      {phase === 'learn' && (
        <View style={styles.footer}>
          <Pressable
            onPress={() => learnIdx + 1 >= assoc.length ? setPhase('recall') : setLearnIdx(i => i + 1)}
            style={[styles.nextBtn, { backgroundColor: accent }]}
          >
            <Text style={styles.nextBtnText}>
              {learnIdx + 1 >= assoc.length ? 'Empezar recuerdo' : 'Siguiente'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

type AssocRoom = { id: string; label: string; x: number; y: number; word: string; icon: string };

// Elegant Glassmorphic Isometric House Map Layout
function HouseMap({ assoc, phase, highlightId, badgeUpTo, feedback, accent, onRoomPress, hintActive, targetRoomId }: {
  assoc: AssocRoom[];
  phase: 'learn' | 'recall';
  highlightId?: string;
  badgeUpTo?: number;
  feedback: { room: string; correct: boolean } | null;
  accent: string;
  onRoomPress: (id: string) => void;
  hintActive: boolean;
  targetRoomId: string;
}) {
  const { width } = Dimensions.get('window');
  const mapW = Math.min(width, 520) - 32;
  const mapH = mapW * 0.75;

  return (
    <View style={[styles.houseContainer, { width: mapW, height: mapH }]}>
      {/* Dynamic pseudo 3D grid layout overlay */}
      <View style={styles.isometricGridBackdrop} pointerEvents="none" />

      {assoc.map((r, idx) => {
        const isHintTarget = hintActive && r.id === targetRoomId;
        const isHighlight = r.id === highlightId || isHintTarget;
        const hasBadge = badgeUpTo !== undefined && idx < badgeUpTo;
        
        const feedbackOk  = isHighlight && feedback?.correct === true;
        const feedbackErr = isHighlight && feedback?.correct === false;

        return (
          <HouseRoomCard
            key={r.id}
            room={r}
            idx={idx}
            phase={phase}
            accent={accent}
            isHighlight={isHighlight}
            hasBadge={hasBadge}
            isHintTarget={isHintTarget}
            feedbackOk={feedbackOk}
            feedbackErr={feedbackErr}
            feedback={feedback}
            onRoomPress={onRoomPress}
          />
        );
      })}
    </View>
  );
}

// 3D Rotational animation card for Room Items
function HouseRoomCard({ room, idx, phase, accent, isHighlight, hasBadge, isHintTarget, feedbackOk, feedbackErr, feedback, onRoomPress }: {
  room: AssocRoom;
  idx: number;
  phase: 'learn' | 'recall';
  accent: string;
  isHighlight: boolean;
  hasBadge: boolean;
  isHintTarget: boolean;
  feedbackOk: boolean;
  feedbackErr: boolean;
  feedback: any;
  onRoomPress: (id: string) => void;
}) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (isHighlight) {
      scale.value = withSpring(1.08, { damping: 8 });
      glow.value = withRepeat(
        withTiming(1, { duration: 700 }),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1, { damping: 10 });
      glow.value = withTiming(0, { duration: 200 });
    }
  }, [isHighlight]);

  const animatedStyle = useAnimatedStyle(() => {
    // Pulsating border and background glows
    const shadowOpacity = isHighlight ? 0.35 + glow.value * 0.15 : 0.05;
    const shadowRadius = isHighlight ? 12 + glow.value * 6 : 4;
    const rotateXValue = isHighlight ? withTiming('12deg', { duration: 300 }) : withTiming('0deg', { duration: 200 });
    
    return {
      transform: [
        { perspective: 800 },
        { scale: scale.value },
        { rotateX: rotateXValue }
      ],
      shadowOpacity,
      shadowRadius,
    };
  });

  const btnBg = feedbackOk
    ? '#DCFCE7' 
    : feedbackErr 
      ? '#FEE2E2' 
      : isHintTarget 
        ? '#F5F3FF' 
        : isHighlight 
          ? `${accent}18` 
          : COLORS.white;

  const btnBorder = feedbackOk 
    ? '#22C55E' 
    : feedbackErr 
      ? '#EF4444' 
      : isHintTarget 
        ? '#8B5CF6' 
        : isHighlight 
          ? accent 
          : '#E5E7EB';

  const txtColor = feedbackOk 
    ? '#16A34A' 
    : feedbackErr 
      ? '#EF4444' 
      : isHintTarget 
        ? '#8B5CF6' 
        : isHighlight 
          ? accent 
          : COLORS.ink;

  return (
    <Animated.View
      style={[
        styles.roomCardWrapper,
        {
          left: `${room.x}%` as any,
          top: `${room.y}%` as any,
        },
        animatedStyle,
      ]}
    >
      <Pressable
        disabled={phase !== 'recall' || !!feedback}
        onPress={() => {
          scale.value = withSequence(
            withTiming(0.9, { duration: 60 }),
            withSpring(1.1, { damping: 5 })
          );
          onRoomPress(room.id);
        }}
        style={[
          styles.roomBtn,
          {
            backgroundColor: btnBg,
            borderColor: btnBorder,
            shadowColor: isHighlight ? accent : '#000',
          },
        ]}
      >
        <View style={styles.roomContent}>
          <Ionicons name={room.icon as any} size={15} color={txtColor} />
          <Text style={[styles.roomLabel, { color: txtColor }]}>{room.label}</Text>
        </View>

        {hasBadge && (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{room.word}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Bizarre Loci Association Card with scale pop
function LociStoryCard({ text, roomId, imageUri, isLoading }: { text: string; roomId: string; imageUri?: string; isLoading?: boolean }) {
  const aspect = ROOM_ASPECTS[roomId] || ROOM_ASPECTS.entrance;
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 250 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[animatedStyle, styles.storyCard, { borderColor: aspect.border }]}>
      <LinearGradient
        colors={aspect.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.storyCardGradient}
      >
        <View style={styles.storyCardHeader}>
          <Ionicons name="sparkles" size={15} color={aspect.textColor} />
          <Text style={[styles.storyCardTitle, { color: aspect.textColor }]}>ASOCIACIÓN IMAGINARIA (IA)</Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 10 }}>
            <ActivityIndicator size="small" color={aspect.textColor} />
            <Text style={[styles.storyCardText, { color: aspect.textColor, fontSize: 12 }]}>Diseñando escena memorable con Gemini...</Text>
          </View>
        ) : (
          <View style={styles.storyCardContent}>
            {imageUri && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.storyCardImage}
                  resizeMode="cover"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                />
                {imageLoading && (
                  <View style={[StyleSheet.absoluteFillObject, styles.imageLoaderContainer]}>
                    <ActivityIndicator size="small" color={aspect.textColor} />
                  </View>
                )}
              </View>
            )}

            <View style={styles.storyCardContentRow}>
              {!imageUri && <Text style={styles.storyCardEmoji}>{aspect.emoji}</Text>}
              <View style={styles.storyCardTextCol}>
                <Text style={[styles.storyCardText, { color: aspect.textColor }]}>{text}</Text>
                <Text style={styles.storyCardCaption}>Consolida esta absurda escena en tu mente antes de que termine el tiempo.</Text>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.canvas },
  infoRow:      { padding: 16, alignItems: 'center', gap: 12 },
  learnHeader:  { width: '100%', alignItems: 'center', gap: 10 },
  recallHeader: { width: '100%', alignItems: 'center', gap: 8 },
  hint:         { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  assocRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  wordBubble:   {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 4,
  },
  wordBubbleText:{ fontFamily: FONTS.heading, fontSize: 18, color: '#fff' },
  arrow:        { fontSize: 22 },
  roomBubble:   { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, borderWidth: 2, backgroundColor: COLORS.white },
  roomBubbleText:{ fontFamily: FONTS.heading, fontSize: 14 },
  storyCard:  {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    width: '100%',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  storyCardGradient: {
    padding: 16,
  },
  storyCardContent: {
    marginTop: 8,
    gap: 10,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    position: 'relative',
  },
  storyCardImage: {
    width: '100%',
    height: '100%',
  },
  imageLoaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  storyCardContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  storyCardEmoji: {
    fontSize: 42,
  },
  storyCardTextCol: {
    flex: 1,
    gap: 2,
  },
  storyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  storyCardTitle: { fontFamily: FONTS.headingSemi, fontSize: 10, letterSpacing: 1.5 },
  storyCardText: { fontFamily: FONTS.headingSemi, fontSize: 13, lineHeight: 18 },
  storyCardCaption: { fontFamily: FONTS.body, fontSize: 9.5, color: COLORS.muted, marginTop: 4 },
  
  // Layered 2.5D pseudo-isometric house container
  houseContainer:{
    position: 'relative',
    alignSelf: 'center',
    backgroundColor: '#FAF8FF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E4DFFA',
    marginVertical: 14,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 25,
    elevation: 1,
  },
  isometricGridBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(139,92,246,0.02)',
    // Elegant floor mesh pattern
  },
  roomCardWrapper: {
    position: 'absolute',
    transform: [{ translateX: -48 }, { translateY: -22 }],
    zIndex: 10,
  },
  roomBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 96,
  },
  roomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  roomLabel:    { fontFamily: FONTS.heading, fontSize: 10.5 },
  badge:        {
    position: 'absolute',
    top: -12,
    right: -10,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText:    { fontFamily: FONTS.headingSemi, fontSize: 8.5, color: '#fff' },
  footer:       { padding: 16, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface },
  nextBtn:      { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextBtnText:  { fontFamily: FONTS.heading, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  lociHintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  lociHintBtnText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 12,
    color: '#fff',
  },
  lociHintActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginTop: 8,
  },
  lociHintActiveText: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#6D28D9',
  },
});
