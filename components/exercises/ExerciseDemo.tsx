import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import type { ExerciseId } from '../../types/db';

interface ExerciseDemoProps {
  kind: ExerciseId | 'rsvp';
  accent?: string;
  height?: number;
}

export function ExerciseDemo({ kind, accent = '#22C55E', height = 180 }: ExerciseDemoProps) {
  return (
    <View style={[
      demoStyles.container,
      { height, backgroundColor: accent + '08', borderColor: accent + '20' },
    ]}>
      {kind === 'schulte'                                   && <DemoSchulte accent={accent} />}
      {kind === 'reading_test'                              && <DemoReadingTest accent={accent} />}
      {kind === 'focus_circle'                              && <DemoFocusCircle accent={accent} />}
      {(kind === 'rsvp' || kind === 'reading' || kind === 'freereading') && <DemoRSVP accent={accent} />}
      {kind === 'wordspan'                                  && <DemoWordSpan accent={accent} />}
      {kind === 'loci'                                      && <DemoLoci accent={accent} />}
      {kind === 'comprehension'                             && <DemoComprehension accent={accent} />}
      {kind === 'boss'                                      && <DemoBoss accent={accent} />}
    </View>
  );
}

// ── Schulte: 3×3 grid cycles through cells ────────────────────────────────────

function DemoSchulte({ accent }: { accent: string }) {
  const TOTAL = 9;
  const [active, setActive] = useState(0);
  const ORDER = [4, 0, 8, 2, 6, 1, 5, 3, 7];

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % TOTAL), 550);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={demoStyles.center}>
      <View style={schulteStyles.eyeHint}>
        <View style={[schulteStyles.eyeDot, { backgroundColor: accent }]} />
        <Text style={schulteStyles.eyeLabel}>Ojo fijo aquí</Text>
      </View>
      <View style={schulteStyles.grid}>
        {ORDER.map((num, i) => {
          const isActive = i === active;
          return (
            <View
              key={i}
              style={[
                schulteStyles.cell,
                isActive && { backgroundColor: accent, borderColor: accent },
              ]}
            >
              <Text style={[schulteStyles.cellText, isActive && { color: '#fff' }]}>
                {num + 1}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const schulteStyles = StyleSheet.create({
  eyeHint:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  eyeDot:   { width: 10, height: 10, borderRadius: 5 },
  eyeLabel: { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 1 },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', width: 108, gap: 3 },
  cell:     { width: 33, height: 33, borderRadius: 8, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
});

// ── RSVP: words flash one by one ──────────────────────────────────────────────

const RSVP_WORDS = ['leer', 'más', 'rápido', 'sin', 'mover', 'los', 'ojos'];

function DemoRSVP({ accent }: { accent: string }) {
  const [idx, setIdx] = useState(0);
  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => {
      scale.value = 0.7;
      opacity.value = 0;
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 120 });
      setIdx(i => (i + 1) % RSVP_WORDS.length);
    }, 450);
    return () => clearInterval(id);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={demoStyles.center}>
      <View style={[rsvpStyles.box, { borderColor: accent + '40' }]}>
        <View style={[rsvpStyles.line, { backgroundColor: accent }]} />
        <Animated.Text style={[rsvpStyles.word, { color: COLORS.ink }, animStyle]}>
          {RSVP_WORDS[idx]}
        </Animated.Text>
        <View style={[rsvpStyles.line, { backgroundColor: accent }]} />
      </View>
      <View style={rsvpStyles.progressDots}>
        {RSVP_WORDS.map((_, i) => (
          <View
            key={i}
            style={[
              rsvpStyles.dot,
              i === idx && { backgroundColor: accent, width: 14 },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const rsvpStyles = StyleSheet.create({
  box:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderRadius: 14, backgroundColor: COLORS.white, marginBottom: 10 },
  line:         { width: 2, height: 28, borderRadius: 1, opacity: 0.7 },
  word:         { fontFamily: FONTS.heading, fontSize: 24, minWidth: 120, textAlign: 'center' },
  progressDots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
});

// ── WordSpan: show cards → recall slots ───────────────────────────────────────

const SPAN_WORDS = ['libro', 'cielo', 'árbol', 'luz'];

function DemoWordSpan({ accent }: { accent: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % (SPAN_WORDS.length * 2 + 2)), 600);
    return () => clearInterval(id);
  }, []);

  const showPhase = step < SPAN_WORDS.length + 1;
  const showIdx = showPhase ? step - 1 : -1;
  const recallIdx = !showPhase ? step - SPAN_WORDS.length - 1 : -1;

  return (
    <View style={demoStyles.center}>
      <Text style={[demoStyles.phaseLabel, { color: accent }]}>
        {showPhase ? 'Memoriza' : 'Recuerda'}
      </Text>
      <View style={spanStyles.row}>
        {SPAN_WORDS.map((w, i) => {
          const isShowActive = showIdx === i;
          const isRecallFilled = !showPhase && i <= recallIdx;
          return (
            <View
              key={i}
              style={[
                spanStyles.card,
                isShowActive && { backgroundColor: accent, borderColor: accent },
                !showPhase && !isRecallFilled && spanStyles.slot,
              ]}
            >
              <Text style={[
                spanStyles.cardText,
                isShowActive && { color: '#fff' },
                !showPhase && !isRecallFilled && { color: 'transparent' },
              ]}>
                {isRecallFilled ? w : isShowActive ? w : showPhase ? '' : '?'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const spanStyles = StyleSheet.create({
  row:      { flexDirection: 'row', gap: 6 },
  card:     { width: 52, height: 40, borderRadius: 10, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  slot:     { borderStyle: 'dashed', backgroundColor: COLORS.surface },
  cardText: { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.ink, textAlign: 'center' },
});

// ── Loci: rooms with objects ──────────────────────────────────────────────────

const LOCI_ROOMS = [
  { label: 'Entrada', emoji: '🚪' },
  { label: 'Cocina',  emoji: '🍳' },
  { label: 'Sala',    emoji: '🛋' },
  { label: 'Oficina', emoji: '💻' },
];
const LOCI_OBJS = ['📖', '🎸', '🎩', '⌚'];

function DemoLoci({ accent }: { accent: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive(a => (a + 1) % LOCI_ROOMS.length), 800);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={demoStyles.center}>
      <Text style={[demoStyles.phaseLabel, { color: accent }]}>Palacio mental</Text>
      <View style={lociStyles.grid}>
        {LOCI_ROOMS.map((room, i) => {
          const isActive = i === active;
          return (
            <View
              key={i}
              style={[lociStyles.room, isActive && { borderColor: accent, backgroundColor: accent + '12' }]}
            >
              <Text style={lociStyles.roomEmoji}>{room.emoji}</Text>
              <Text style={lociStyles.roomLabel}>{room.label}</Text>
              {isActive && (
                <View style={[lociStyles.objBubble, { backgroundColor: accent }]}>
                  <Text style={{ fontSize: 12 }}>{LOCI_OBJS[i]}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const lociStyles = StyleSheet.create({
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: 180 },
  room:      { width: 84, height: 60, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', gap: 2 },
  roomEmoji: { fontSize: 18 },
  roomLabel: { fontFamily: FONTS.headingSemi, fontSize: 7, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  objBubble: { position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});

// ── Comprehension: scan lines + answer cycling ────────────────────────────────

function DemoComprehension({ accent }: { accent: string }) {
  const [step, setStep] = useState(0);
  const STEPS = 6;

  useEffect(() => {
    const id = setInterval(() => setStep(s => (s + 1) % STEPS), 700);
    return () => clearInterval(id);
  }, []);

  const scanLine = step < 3 ? step : -1;
  const answerStep = step >= 3 ? step - 3 : -1;

  return (
    <View style={demoStyles.center}>
      <View style={compStyles.passage}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              compStyles.textLine,
              { width: i === 2 ? '60%' : '100%' },
              scanLine === i && { backgroundColor: accent + '30', borderRadius: 3 },
            ]}
          />
        ))}
      </View>
      <View style={compStyles.question}>
        <Text style={[compStyles.qLabel, { color: accent }]}>¿Cuál es la idea principal?</Text>
        {['La memoria', 'El flujo', 'El sueño'].map((opt, i) => (
          <View
            key={i}
            style={[
              compStyles.opt,
              answerStep === i && { backgroundColor: accent, borderColor: accent },
            ]}
          >
            <Text style={[compStyles.optText, answerStep === i && { color: '#fff' }]}>{opt}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const compStyles = StyleSheet.create({
  passage:   { gap: 5, marginBottom: 10, width: 180 },
  textLine:  { height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  question:  { gap: 4, width: 180 },
  qLabel:    { fontFamily: FONTS.headingSemi, fontSize: 9, marginBottom: 2 },
  opt:       { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.white },
  optText:   { fontFamily: FONTS.body, fontSize: 10, color: COLORS.ink },
});

// ── Boss: 3 skill icons + draining progress bar ───────────────────────────────

const BOSS_SKILLS = ['👁', '🧠', '⚡'];

function DemoBoss({ accent }: { accent: string }) {
  const [round, setRound] = useState(0);
  const barWidth = useSharedValue(1);

  useEffect(() => {
    barWidth.value = withTiming(0, { duration: 900 });
    const id = setInterval(() => {
      setRound(r => (r + 1) % 3);
      barWidth.value = 1;
      barWidth.value = withTiming(0, { duration: 900 });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const barFillStyle = useAnimatedStyle(() => ({ width: `${barWidth.value * 100}%` as any }));

  return (
    <View style={demoStyles.center}>
      <Text style={[demoStyles.phaseLabel, { color: accent }]}>Ronda {round + 1}/3</Text>
      <View style={bossStyles.skills}>
        {BOSS_SKILLS.map((sk, i) => (
          <View
            key={i}
            style={[bossStyles.skill, i === round && { borderColor: accent, backgroundColor: accent + '15' }]}
          >
            <Text style={{ fontSize: 20 }}>{sk}</Text>
          </View>
        ))}
      </View>
      <View style={bossStyles.barTrack}>
        <Animated.View style={[bossStyles.barFill, { backgroundColor: accent }, barFillStyle]} />
      </View>
    </View>
  );
}


// ── Reading Test: document being scanned with a speedometer / WPM counter ──────────────────────────

function DemoReadingTest({ accent }: { accent: string }) {
  const [wpm, setWpm] = useState(150);
  const scanY = useSharedValue(0);

  useEffect(() => {
    const wpmInterval = setInterval(() => {
      setWpm(w => {
        const next = w + Math.floor(Math.random() * 30) - 13;
        return Math.max(120, Math.min(320, next));
      });
    }, 400);

    scanY.value = withTiming(1, { duration: 1800 }, () => {
      scanY.value = 0;
      scanY.value = withTiming(1, { duration: 1800 });
    });

    const scanInterval = setInterval(() => {
      scanY.value = 0;
      scanY.value = withTiming(1, { duration: 1800 });
    }, 2000);

    return () => {
      clearInterval(wpmInterval);
      clearInterval(scanInterval);
    };
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanY.value * 90}%` as any,
  }));

  return (
    <View style={demoStyles.center}>
      <Text style={[demoStyles.phaseLabel, { color: accent }]}>Calibrando Velocidad</Text>
      <View style={readingTestStyles.container}>
        {/* Document lines */}
        <View style={readingTestStyles.document}>
          {[0, 1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                readingTestStyles.docLine,
                { width: i === 3 ? '50%' : i === 1 ? '85%' : '100%' },
              ]}
            />
          ))}
          <Animated.View style={[readingTestStyles.scanner, { backgroundColor: accent }, scanStyle]} />
        </View>
        
        {/* Speedometer panel */}
        <View style={[readingTestStyles.speedo, { borderColor: accent + '30' }]}>
          <Text style={[readingTestStyles.speedoVal, { color: accent }]}>{wpm}</Text>
          <Text style={readingTestStyles.speedoLabel}>WPM</Text>
        </View>
      </View>
    </View>
  );
}

const readingTestStyles = StyleSheet.create({
  container:    { flexDirection: 'row', gap: 12, alignItems: 'center', width: 220, justifyContent: 'center' },
  document:     { width: 100, height: 75, padding: 8, backgroundColor: COLORS.white, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, position: 'relative', overflow: 'hidden', gap: 5, justifyContent: 'center' },
  docLine:      { height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  scanner:      { position: 'absolute', left: 0, right: 0, height: 3, opacity: 0.8 },
  speedo:       { width: 75, height: 75, borderRadius: 38, borderWidth: 2, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  speedoVal:    { fontFamily: FONTS.heading, fontSize: 20, lineHeight: 22 },
  speedoLabel:  { fontFamily: FONTS.headingSemi, fontSize: 8, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
});

// ── Focus Circle: breathing/scaling circle around a center dot ───────────────────────────────

function DemoFocusCircle({ accent }: { accent: string }) {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withTiming(1.2, { duration: 2000 }, () => {
      scale.value = withTiming(0.4, { duration: 2000 });
    });
    opacity.value = withTiming(0.8, { duration: 2000 }, () => {
      opacity.value = withTiming(0.3, { duration: 2000 });
    });

    const interval = setInterval(() => {
      scale.value = 0.4;
      scale.value = withTiming(1.2, { duration: 2000 }, () => {
        scale.value = withTiming(0.4, { duration: 2000 });
      });
      opacity.value = 0.3;
      opacity.value = withTiming(0.8, { duration: 2000 }, () => {
        opacity.value = withTiming(0.3, { duration: 2000 });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={demoStyles.center}>
      <Text style={[demoStyles.phaseLabel, { color: accent }]}>Expande Visión</Text>
      <View style={focusCircleStyles.wrap}>
        <Animated.View style={[focusCircleStyles.pulseCircle, { borderColor: accent }, circleStyle]} />
        <View style={[focusCircleStyles.centerDot, { backgroundColor: accent }]} />
      </View>
    </View>
  );
}

const focusCircleStyles = StyleSheet.create({
  wrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pulseCircle: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderStyle: 'solid' },
  centerDot: { width: 12, height: 12, borderRadius: 6 },
});

const bossStyles = StyleSheet.create({
  skills:   { flexDirection: 'row', gap: 10, marginBottom: 12 },
  skill:    { width: 48, height: 48, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  barTrack: { width: 160, height: 10, borderRadius: 5, backgroundColor: COLORS.surface, overflow: 'hidden' },
  barFill:  { height: 10, borderRadius: 5 },
});

// ── Shared styles ─────────────────────────────────────────────────────────────

const demoStyles = StyleSheet.create({
  container:  { borderRadius: 16, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center:     { alignItems: 'center', justifyContent: 'center', flex: 1, padding: 16 },
  phaseLabel: { fontFamily: FONTS.headingSemi, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
});
