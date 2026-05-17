import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { ExerciseTopBar } from './ExerciseTopBar';
import { pickPassage } from '../../constants/passages';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

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

  const msPerWord = (60 / wpm) * 1000 * (mode === 'chunk' ? chunkSize : 1);

  useEffect(() => {
    if (!playing || phase !== 'reading') return;
    const step = mode === 'chunk' ? chunkSize : 1;
    if (idx >= words.length) {
      setPlaying(false);
      setReadSeconds((Date.now() - startTimeRef.current) / 1000);
      setPhase('quiz');
      return;
    }
    const t = setTimeout(() => setIdx(i => i + step), msPerWord);
    return () => clearTimeout(t);
  }, [idx, playing, msPerWord, mode, chunkSize, words.length, phase]);

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
              {[150, 200, 280, 350, 500].map(v => (
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
        <ExerciseTopBar progress={idx / words.length} accent={accent} onQuit={onQuit} title={`${wpm} WPM`} />
        <View style={{ flex: 1, minHeight: 0 }}>
          <View style={styles.displayArea}>
            {mode === 'rsvp'  && <RSVPDisplay word={words[idx]} accent={accent} />}
            {mode === 'guide' && <GuideDisplay words={words} idx={idx} accent={accent} />}
            {mode === 'chunk' && <ChunkDisplay words={words} idx={idx} chunkSize={chunkSize} accent={accent} />}
          </View>
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <Pressable onPress={() => setIdx(i => Math.max(0, i - 5))} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>−5</Text>
              </Pressable>
              <Pressable onPress={() => setPlaying(p => !p)} style={[styles.controlBtn, { flex: 1, backgroundColor: accent }]}>
                <Text style={[styles.controlBtnText, { color: '#fff' }]}>{playing ? '❚❚ Pausa' : '▶ Reanudar'}</Text>
              </Pressable>
              <Pressable onPress={() => setIdx(i => Math.min(words.length - 1, i + 5))} style={styles.controlBtn}>
                <Text style={styles.controlBtnText}>+5</Text>
              </Pressable>
            </View>
            <View style={styles.wpmStepper}>
              <Pressable onPress={() => setWpm(w => Math.max(150, w - 10))} style={styles.stepBtn}><Text style={styles.stepBtnText}>−10</Text></Pressable>
              <Text style={[styles.wpmDisplayText, { color: accent }]}>{wpm} WPM</Text>
              <Pressable onPress={() => setWpm(w => Math.min(800, w + 10))} style={styles.stepBtn}><Text style={styles.stepBtnText}>+10</Text></Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Quiz phase
  const q = passage.questions[qIdx];
  return (
    <View style={styles.container}>
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
  );
}

function RSVPDisplay({ word, accent }: { word: string; accent: string }) {
  if (!word) return <View />;
  const orpIdx = Math.max(0, Math.min(word.length - 1, Math.floor(word.length * 0.35)));
  return (
    <View style={rsvpStyles.container}>
      <View style={rsvpStyles.crossV} />
      <View style={rsvpStyles.crossVBottom} />
      <Text style={rsvpStyles.word}>
        <Text style={{ color: COLORS.ink }}>{word.slice(0, orpIdx)}</Text>
        <Text style={{ color: accent, fontFamily: FONTS.headingSemi }}>{word[orpIdx]}</Text>
        <Text style={{ color: COLORS.ink }}>{word.slice(orpIdx + 1)}</Text>
      </Text>
      <View style={[rsvpStyles.underline, { backgroundColor: accent }]} />
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
  container:   { alignItems: 'center', justifyContent: 'center', flex: 1 },
  crossV:      { position: 'absolute', top: 0, left: '50%', width: 1, height: '15%', backgroundColor: COLORS.border },
  crossVBottom:{ position: 'absolute', bottom: 0, left: '50%', width: 1, height: '15%', backgroundColor: COLORS.border },
  word:        { fontFamily: FONTS.body, fontSize: 38, color: COLORS.ink, letterSpacing: 1, paddingVertical: 10 },
  underline:   { width: 12, height: 2, borderRadius: 1, marginTop: 2 },
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
  controls:      { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.surface, backgroundColor: COLORS.white, gap: 10 },
  controlRow:    { flexDirection: 'row', gap: 10, alignItems: 'center' },
  controlBtn:    { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: COLORS.surface, borderRadius: 12 },
  controlBtnText:{ fontFamily: FONTS.heading, fontSize: 13, color: COLORS.ink },
  questionText:  { fontFamily: FONTS.heading, fontSize: 19, color: COLORS.ink, lineHeight: 26, marginTop: 8 },
  optionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border },
  optionCorrect: { backgroundColor: '#DCFCE7', borderColor: '#22C55E' },
  optionWrong:   { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
  optionBadge:   { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  optionBadgeText:{ fontFamily: FONTS.heading, fontSize: 11, color: COLORS.muted },
  optionText:    { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink, flex: 1 },
});
