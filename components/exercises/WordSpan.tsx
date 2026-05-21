import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickWords } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

type Phase = 'show' | 'recall';

interface Props {
  level?: number;
  showMs?: number;
  distractorCount?: number;
  accent?: string;
  onFinish: (result: { correct: number; total: number; time: number }) => void;
  onQuit: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Local Engine for Surreal Spanish Story Generation
function generateSurrealStory(words: string[]): string {
  const templates = [
    "¡Surrealista! Un {W0} flotante cruzó el {W1} devorando un {W2} que brillaba tanto como el {W3}.",
    "En un universo paralelo, el {W0} es adorado en el {W1} por un {W2} mágico bajo el calor del {W3}.",
    "Un astuto {W0} escapó del {W1} y escondió un {W2} dorado dentro del sagrado {W3}.",
    "Cuenta la leyenda que el {W0} cayó del {W1} rebotando contra un {W2} gigante del {W3}.",
    "Un {W0} misterioso se materializó en el {W1} revelando un {W2} oculto bajo el brillo del {W3}.",
  ];
  
  const template = templates[words.length % templates.length];
  return template
    .replace('{W0}', `«${(words[0] || 'objeto').toUpperCase()}»`)
    .replace('{W1}', `«${(words[1] || 'lugar').toUpperCase()}»`)
    .replace('{W2}', `«${(words[2] || 'artículo').toUpperCase()}»`)
    .replace('{W3}', `«${(words[3] || 'planeta').toUpperCase()}»`)
    .replace('{W4}', `«${(words[4] || 'portal').toUpperCase()}»`)
    .replace('{W5}', `«${(words[5] || 'secreto').toUpperCase()}»`);
}

const POSITION_COLORS = [
  '#3B82F6', // Blue (Position 1)
  '#10B981', // Green (Position 2)
  '#F59E0B', // Amber (Position 3)
  '#EF4444', // Red (Position 4)
  '#8B5CF6', // Purple (Position 5)
  '#EC4899', // Pink (Position 6)
  '#06B6D4', // Cyan (Position 7)
  '#F97316', // Orange (Position 8)
  '#84CC16', // Lime (Position 9)
  '#64748B', // Slate (Position 10)
];

export function WordSpanExercise({ level = 6, showMs = 1100, distractorCount = 4, accent = '#3B82F6', onFinish, onQuit }: Props) {
  const allWords = pickWords(level + distractorCount + 4, false);
  const [sequence] = useState(() => allWords.slice(0, level));
  const [phase, setPhase] = useState<Phase>('show');
  const [shownIdx, setShownIdx] = useState(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const startTime = React.useRef(Date.now());

  // Generate the mnemonic visual story connecting all elements
  const [surrealStory] = useState(() => generateSurrealStory(sequence));

  useEffect(() => {
    if (phase !== 'show') return;
    if (shownIdx < sequence.length) {
      const t = setTimeout(() => setShownIdx(i => i + 1), showMs);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        const distractors = allWords.filter(w => !sequence.includes(w)).slice(0, distractorCount);
        setOptions(shuffle([...sequence, ...distractors]));
        setPhase('recall');
      }, 800);
      return () => clearTimeout(t);
    }
  }, [shownIdx, phase]);

  const toggleSelect = (word: string) => {
    if (selection.includes(word)) {
      setSelection(s => s.filter(w => w !== word));
    } else if (selection.length < sequence.length) {
      const newSel = [...selection, word];
      setSelection(newSel);
      if (newSel.length === sequence.length) {
        setTimeout(() => {
          const correct = newSel.filter((w, i) => w === sequence[i]).length;
          onFinish({ correct, total: sequence.length, time: (Date.now() - startTime.current) / 1000 });
        }, 600);
      }
    }
  };

  if (phase === 'show') {
    const current = sequence[shownIdx];
    return (
      <View style={styles.container}>
        <ExerciseTopBar progress={shownIdx / sequence.length} accent={accent} onQuit={onQuit} title="Memoriza" />
        
        <View style={styles.showCenter}>
          <Text style={styles.counter}>Palabra {shownIdx + 1} de {sequence.length}</Text>
          
          <View style={styles.bubbleArea}>
            {current ? (
              <WordBubble key={shownIdx} word={current} accent={POSITION_COLORS[shownIdx % POSITION_COLORS.length]} />
            ) : (
              <View style={styles.waitBox}>
                <Text style={styles.waitText}>Prepárate…</Text>
              </View>
            )}
          </View>

          {/* AI Story Linker Box to assist user retention */}
          <View style={styles.storyCard}>
            <View style={styles.storyCardHeader}>
              <Ionicons name="sparkles" size={16} color="#8B5CF6" />
              <Text style={styles.storyCardTitle}>CONEXIÓN Mnémica DE IA</Text>
            </View>
            <Text style={styles.storyCardText}>{surrealStory}</Text>
            <Text style={styles.storyCardCaption}>Visualiza esta escena surrealista para retener la secuencia fácilmente.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ExerciseTopBar progress={selection.length / sequence.length} accent={accent} onQuit={onQuit} title="Recuerda" />
      
      <View style={styles.hintRow}>
        <Text style={styles.hint}>Selecciona en orden</Text>
      </View>

      <View style={styles.slotArea}>
        <View style={styles.slotRow}>
          {Array.from({ length: sequence.length }).map((_, i) => {
            const w = selection[i];
            return (
              <RecallSlot key={i} word={w} index={i} accent={accent} />
            );
          })}
        </View>
      </View>

      {/* Story remainder during recall phase */}
      <View style={styles.storyRecallHelper}>
        <Ionicons name="bulb" size={14} color="#6B7280" />
        <Text style={styles.storyRecallHelperText} numberOfLines={2}>{surrealStory}</Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bankCard}>
        <View style={styles.bankGrid}>
          {options.map(w => {
            const selected = selection.includes(w);
            return (
              <WordOption key={w} word={w} selected={selected} accent={accent} onPress={() => toggleSelect(w)} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// Hovering floating Word Bubble in Phase: show
function WordBubble({ word, accent }: { word: string; accent: string }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const rotateY = useSharedValue(180);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 7, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 250 });
    rotateY.value = withSpring(0, { damping: 12, stiffness: 90 });
    
    // Float loop
    translateY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1600 }),
        withTiming(12, { duration: 1600 })
      ),
      -1,
      true
    );

    // Minor rotation float
    rotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1800 }),
        withTiming(3, { duration: 1800 })
      ),
      -1,
      true
    );
  }, [word]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, styles.bubbleContainer, { backgroundColor: accent, shadowColor: accent }]}>
      <Text style={styles.bubbleText}>{word}</Text>
    </Animated.View>
  );
}

// Elastic springs on word recall slots
function RecallSlot({ word, index, accent }: { word: string; index: number; accent: string }) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const slotColor = POSITION_COLORS[index % POSITION_COLORS.length];

  useEffect(() => {
    if (word) {
      translateY.value = 30;
      translateY.value = withSpring(0, { damping: 10, stiffness: 150 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 5, stiffness: 220 }),
        withSpring(1, { damping: 8, stiffness: 160 })
      );
    }
  }, [word]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={[style, styles.slot, word ? { borderColor: slotColor, backgroundColor: slotColor + '12' } : {}]}>
      <Text style={[styles.slotText, word ? { color: slotColor } : { color: COLORS.border }]}>
        {word || (index + 1)}
      </Text>
    </Animated.View>
  );
}

// Animated selectable option words
function WordOption({ word, selected, accent, onPress }: { word: string; selected: boolean; accent: string; onPress: () => void }) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withSpring(1, { damping: 6 })
    );
    onPress();
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[style, styles.wordBtn, selected && styles.wordBtnSelected]}>
        <Text style={[styles.wordBtnText, { color: selected ? COLORS.muted : accent }, selected && { opacity: 0.5 }]}>
          {word}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.canvas },
  showCenter: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: 24 },
  bubbleArea: { height: 180, justifyContent: 'center', alignItems: 'center' },
  bubbleContainer: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontFamily: FONTS.heading,
    fontSize: 34,
    color: '#fff',
    textAlign: 'center',
  },
  counter:    { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 2 },
  waitBox:    { padding: 32, alignItems: 'center' },
  waitText:   { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink },
  storyCard:  {
    backgroundColor: '#FAF5FF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E9D5FF',
    width: '100%',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
    marginTop: 20,
  },
  storyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  storyCardTitle: { fontFamily: FONTS.headingSemi, fontSize: 10, color: '#8B5CF6', letterSpacing: 1.5 },
  storyCardText: { fontFamily: FONTS.headingSemi, fontSize: 13, lineHeight: 19, color: '#5B21B6' },
  storyCardCaption: { fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, marginTop: 8 },
  hintRow:    { paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
  hint:       { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  slotArea:   { paddingHorizontal: 20, paddingTop: 14 },
  slotRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  slot:       { minWidth: 62, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  slotText:   { fontFamily: FONTS.heading, fontSize: 15 },
  storyRecallHelper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 18,
  },
  storyRecallHelperText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    flex: 1,
  },
  bankCard:   { margin: 16, backgroundColor: COLORS.white, borderRadius: 24, padding: 18, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 15, elevation: 1 },
  bankGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  wordBtn:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  wordBtnSelected: { backgroundColor: COLORS.border, borderColor: COLORS.border },
  wordBtnText:{ fontFamily: FONTS.heading, fontSize: 14 },
});
