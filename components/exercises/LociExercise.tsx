import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { ExerciseTopBar } from './ExerciseTopBar';
import { LOCI_OBJECTS } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

const ALL_ROOMS = [
  { id: 'entrance', label: 'Entrada',   x: 15, y: 70 },
  { id: 'kitchen',  label: 'Cocina',    x: 70, y: 70 },
  { id: 'living',   label: 'Sala',      x: 40, y: 45 },
  { id: 'bedroom',  label: 'Dormitorio',x: 15, y: 20 },
  { id: 'office',   label: 'Oficina',   x: 70, y: 20 },
  { id: 'bath',     label: 'Baño',      x: 85, y: 45 },
  { id: 'garden',   label: 'Jardín',    x: 15, y: 45 },
  { id: 'attic',    label: 'Ático',     x: 50, y:  8 },
];

interface Props {
  count?: number;
  studyMs?: number;
  accent?: string;
  onFinish: (result: { correct: number; total: number; time: number }) => void;
  onQuit: () => void;
}

export function LociExercise({ count = 5, studyMs = 4000, accent = '#8B5CF6', onFinish, onQuit }: Props) {
  const wantCount = Math.min(8, Math.max(3, count));
  const rooms = ALL_ROOMS.slice(0, wantCount);
  const words = LOCI_OBJECTS.slice(0, wantCount);
  const [assoc] = useState(() => rooms.map((r, i) => ({ ...r, word: words[i] })));

  const [phase, setPhase] = useState<'learn' | 'recall'>('learn');
  const [learnIdx, setLearnIdx] = useState(0);
  const [recallIdx, setRecallIdx] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<{ room: string; correct: boolean } | null>(null);
  const startTime = React.useRef(Date.now());

  useEffect(() => {
    if (phase !== 'learn') return;
    const t = setTimeout(() => {
      if (learnIdx + 1 >= assoc.length) setPhase('recall');
      else setLearnIdx(i => i + 1);
    }, studyMs);
    return () => clearTimeout(t);
  }, [learnIdx, phase, studyMs]);

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
          <>
            <Text style={styles.hint}>Asocia objeto con habitación ({learnIdx + 1}/{assoc.length})</Text>
            <View style={styles.assocRow}>
              <View style={[styles.wordBubble, { backgroundColor: accent }]}>
                <Text style={styles.wordBubbleText}>{current.word}</Text>
              </View>
              <Text style={[styles.arrow, { color: accent }]}>→</Text>
              <View style={[styles.roomBubble, { borderColor: accent }]}>
                <Text style={[styles.roomBubbleText, { color: accent }]}>{current.label}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.hint}>¿Dónde pusiste este objeto?</Text>
            <View style={[styles.wordBubble, { backgroundColor: accent, alignSelf: 'center' }]}>
              <Text style={styles.wordBubbleText}>{current.word}</Text>
            </View>
          </>
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

type AssocRoom = { id: string; label: string; x: number; y: number; word: string };

function HouseMap({ assoc, phase, highlightId, badgeUpTo, feedback, accent, onRoomPress }: {
  assoc: AssocRoom[];
  phase: 'learn' | 'recall';
  highlightId?: string;
  badgeUpTo?: number;
  feedback: { room: string; correct: boolean } | null;
  accent: string;
  onRoomPress: (id: string) => void;
}) {
  const { width } = Dimensions.get('window');
  const mapW = Math.min(width, 520) - 40;
  const mapH = mapW * 0.75;

  return (
    <View style={[styles.houseContainer, { width: mapW, height: mapH }]}>
      <Svg width={mapW} height={mapH} style={{ position: 'absolute' }}>
        <Rect x="5%" y="5%" width="90%" height="88%" fill="none" stroke={`${accent}30`} strokeWidth="1" rx="4" />
        <Line x1="50%" y1="5%" x2="50%" y2="40%" stroke={`${accent}20`} strokeWidth="0.8" />
        <Line x1="5%" y1="40%" x2="95%" y2="40%" stroke={`${accent}20`} strokeWidth="0.8" />
        <Line x1="50%" y1="56%" x2="50%" y2="93%" stroke={`${accent}20`} strokeWidth="0.8" />
      </Svg>

      {assoc.map((r, idx) => {
        const isHighlight = r.id === highlightId;
        const hasBadge = badgeUpTo !== undefined && idx < badgeUpTo;
        const feedbackOk  = isHighlight && feedback?.correct === true;
        const feedbackErr = isHighlight && feedback?.correct === false;

        const btnBg    = feedbackOk ? '#DCFCE7' : feedbackErr ? '#FEE2E2' : isHighlight ? `${accent}25` : '#fff';
        const btnBorder = feedbackOk ? '#22C55E' : feedbackErr ? '#EF4444' : isHighlight ? accent : `${accent}30`;
        const txtColor  = feedbackOk ? '#16A34A' : feedbackErr ? '#EF4444' : isHighlight ? accent : COLORS.ink;

        return (
          <Pressable
            key={r.id}
            disabled={phase !== 'recall' || !!feedback}
            onPress={() => onRoomPress(r.id)}
            style={[
              styles.roomBtn,
              {
                left: `${r.x}%` as any,
                top: `${r.y}%` as any,
                backgroundColor: btnBg,
                borderColor: btnBorder,
                shadowColor: isHighlight ? accent : 'transparent',
              },
            ]}
          >
            <Text style={[styles.roomLabel, { color: txtColor }]}>{r.label}</Text>
            {hasBadge && (
              <View style={[styles.badge, { backgroundColor: accent }]}>
                <Text style={styles.badgeText}>{r.word}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.canvas },
  infoRow:      { padding: 16, alignItems: 'center', gap: 12 },
  hint:         { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1.5 },
  assocRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wordBubble:   { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 18, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 },
  wordBubbleText:{ fontFamily: FONTS.heading, fontSize: 20, color: '#fff' },
  arrow:        { fontSize: 24 },
  roomBubble:   { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, borderWidth: 2, backgroundColor: COLORS.white },
  roomBubbleText:{ fontFamily: FONTS.heading, fontSize: 15 },
  houseContainer:{ position: 'relative', alignSelf: 'center', backgroundColor: '#FAF5FF', borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD6FE', margin: 20, overflow: 'hidden' },
  roomBtn:      { position: 'absolute', transform: [{ translateX: -42 }, { translateY: -20 }], paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 2 },
  roomLabel:    { fontFamily: FONTS.heading, fontSize: 11 },
  badge:        { position: 'absolute', top: -10, right: -10, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 8 },
  badgeText:    { fontFamily: FONTS.headingSemi, fontSize: 9, color: '#fff' },
  footer:       { padding: 16, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.surface },
  nextBtn:      { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  nextBtnText:  { fontFamily: FONTS.heading, fontSize: 14, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
});
