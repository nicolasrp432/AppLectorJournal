import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import { MascotChar } from '../ui/MascotChar';

const BOSS_ACCENT = '#DC2626';

interface Props {
  onFinish: (result: { score: number; defeated: boolean; time: number; rounds: number }) => void;
  onQuit: () => void;
}

type Phase = 'intro' | 'playing' | 'round-end';

const CHALLENGES = [
  { type: 'speed',         label: 'Velocidad' },
  { type: 'memory',        label: 'Memoria' },
  { type: 'comprehension', label: 'Comprensión' },
];

// Spark Particle component for background fire effect
function FireSpark({ size, delay, left }: { size: number; delay: number; left: number }) {
  const y = useSharedValue(150);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withTiming(0, { duration: 3000 }), -1, false));
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.7, { duration: 600 }),
        withTiming(0.7, { duration: 1800 }),
        withTiming(0, { duration: 600 }),
      ),
      -1,
      false
    ));
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.4, { duration: 1500 }),
      ),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left,
    bottom: `${(1 - y.value / 150) * 100}%` as any,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: '#F97316',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  }));

  return <Animated.View style={animatedStyle} />;
}

// Floating Damage label renderer
interface DamageLabelProps {
  text: string;
  color: string;
  x: number;
  y: number;
  onComplete: () => void;
}

function FloatingDamageLabel({ text, color, x, y, onComplete }: DamageLabelProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 1000 }, () => {
      onComplete();
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const t = progress.value;
    const translateY = -180 * t + 80 * t * t; // Wider RPG parabolic arc
    const translateX = 40 * t * (x > 150 ? 1 : -0.5); // float outwards
    const scale = t < 0.15 ? withSpring(1.5, { damping: 6 }) : withTiming(1 - t, { duration: 800 });
    const opacity = 1 - t;

    return {
      position: 'absolute',
      left: x,
      top: y,
      transform: [{ translateX }, { translateY }, { scale }],
      opacity,
      zIndex: 99,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <Text style={[styles.damageLabelText, { color }]}>{text}</Text>
    </Animated.View>
  );
}

export function BossExercise({ onFinish, onQuit }: Props) {
  const [cIdx, setCIdx] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [bossHP, setBossHP] = useState(100);
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundResult, setRoundResult] = useState<{ score: number; damage: number } | null>(null);
  const startTime = useRef(Date.now());

  // Shared Animation Values
  const hp = useSharedValue(100);
  const bossShake = useSharedValue(0);
  const bossFlashRed = useSharedValue(0);
  const playerJump = useSharedValue(0);
  const slashScale = useSharedValue(0);
  const slashOpacity = useSharedValue(0);
  const shieldScale = useSharedValue(0);
  const shieldOpacity = useSharedValue(0);
  const screenFlash = useSharedValue(0);

  const [damages, setDamages] = useState<{ id: number; text: string; color: string; x: number; y: number }[]>([]);

  useEffect(() => {
    hp.value = withTiming(bossHP, { duration: 500 });
  }, [bossHP]);

  const triggerDamage = (text: string, color: string = '#EF4444', onPlayerSide = false) => {
    const id = Math.random();
    const startX = onPlayerSide ? 70 : 220;
    const startY = 80;
    setDamages(prev => [...prev, { id, text, color, x: startX, y: startY }]);
  };

  const handleAction = (correct: boolean, val?: number) => {
    if (correct && val) {
      // 1. Reduce HP
      setBossHP(prev => Math.max(0, prev - val));

      // 2. Player jump attack
      playerJump.value = withSequence(
        withTiming(15, { duration: 120 }),
        withSpring(0, { damping: 10 })
      );

      // 3. Sword slash visual
      slashScale.value = 0.5;
      slashOpacity.value = 0.9;
      slashScale.value = withSequence(withTiming(1.1, { duration: 150 }), withTiming(1.3, { duration: 100 }));
      slashOpacity.value = withSequence(withTiming(0.9, { duration: 150 }), withTiming(0, { duration: 100 }));

      // 4. Boss rapid shake & Flash red
      bossShake.value = withSequence(
        withTiming(-18, { duration: 40 }),
        withTiming(16, { duration: 40 }),
        withTiming(-12, { duration: 40 }),
        withTiming(8, { duration: 40 }),
        withTiming(-4, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
      bossFlashRed.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 250 })
      );

      // 5. Floating text & Screen Flash for Critical hits (>= 8 damage)
      const crit = val >= 8;
      triggerDamage(crit ? `¡CRÍTICO! -${val} HP` : `-${val} HP`, crit ? '#F59E0B' : '#EF4444');

      if (crit) {
        screenFlash.value = 0.8;
        screenFlash.value = withTiming(0, { duration: 400 });
      }
    } else {
      // Mistake! Boss counterattacks
      shieldScale.value = 0.6;
      shieldOpacity.value = 0.8;
      shieldScale.value = withSpring(1.1, { damping: 5 });
      shieldOpacity.value = withTiming(0, { duration: 500 });

      // Floating miss/block label
      triggerDamage('¡BLOQUEADO!', '#3B82F6', true);
    }
  };

  const handleRoundFinish = (score: number) => {
    // Ensure accurate final score representation
    const damage = Math.floor(score * 35);
    const newHP = Math.max(0, bossHP - damage);
    setBossHP(newHP);

    const newScores = [...scores, score];
    setScores(newScores);
    setRoundResult({ score, damage });
    setPhase('round-end');
  };

  const handleNext = () => {
    if (cIdx + 1 >= CHALLENGES.length) {
      const totalScore = scores.reduce((a, b) => a + b, 0) / CHALLENGES.length;
      onFinish({ score: totalScore, defeated: bossHP === 0, time: (Date.now() - startTime.current) / 1000, rounds: scores.length });
    } else {
      setCIdx(i => i + 1);
      setPhase('playing');
      setRoundResult(null);
    }
  };

  const hpStyle = useAnimatedStyle(() => ({
    width: `${hp.value}%` as any,
  }));

  const bossAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bossShake.value }],
  }));

  const bossTintStyle = useAnimatedStyle(() => ({
    opacity: bossFlashRed.value,
  }));

  const playerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: playerJump.value }],
  }));

  const slashAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: slashScale.value }],
    opacity: slashOpacity.value,
  }));

  const shieldAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shieldScale.value }],
    opacity: shieldOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: screenFlash.value,
  }));

  const CombatArena = () => {
    return (
      <View style={styles.arenaContainer}>
        {/* Fire sparks rising backdrop */}
        <LinearGradient colors={['#3F0712', '#111827']} style={StyleSheet.absoluteFillObject} />
        <FireSpark size={6} delay={0} left={30} />
        <FireSpark size={8} delay={400} left={80} />
        <FireSpark size={5} delay={900} left={150} />
        <FireSpark size={10} delay={1500} left={220} />
        <FireSpark size={7} delay={2000} left={290} />

        {/* Flash White screen overlay when critical damage */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: '#FFFFFF', zIndex: 999 },
            flashStyle,
          ]}
        />

        {/* Boss top-bar header HUD */}
        <View style={styles.arenaHUD}>
          <Pressable onPress={onQuit} style={styles.quitBtn}>
            <Text style={styles.quitIcon}>✕</Text>
          </Pressable>
          <View style={{ flex: 1, paddingLeft: 8 }}>
            <Text style={styles.roundLabel}>JEFE · Ronda {cIdx + 1}/{CHALLENGES.length}</Text>
            <Text style={styles.bossName}>Guardián de la Comprensión</Text>
          </View>
        </View>

        {/* Combat Scene */}
        <View style={styles.battleground}>
          {/* Active Player Mascot on Left */}
          <View style={styles.playerSide}>
            <Animated.View style={playerAnimatedStyle}>
              <MascotChar which="focus" size={75} expression={bossHP === 0 ? 'happy' : 'calm'} />
            </Animated.View>
            <Text style={styles.sideLabel}>Tú (Lector)</Text>

            {/* Holographic glowing Shield Bubble overlay */}
            <Animated.View pointerEvents="none" style={[styles.shieldBubble, shieldAnimatedStyle]} />
          </View>

          {/* Versus Center Badge */}
          <View style={styles.vsBadgeContainer}>
            <Text style={styles.vsBadgeText}>VS</Text>
          </View>

          {/* Red Boss Mascot on Right */}
          <View style={styles.bossSide}>
            <Animated.View style={bossAnimatedStyle}>
              <MascotChar
                which="boss"
                size={82}
                expression={bossHP === 0 ? 'defeated' : bossHP < 40 ? 'angry' : 'serious'}
              />
            </Animated.View>
            <Text style={styles.sideLabel}>Guardián 👹</Text>

            {/* Flash Red overlay when damaged */}
            <Animated.View pointerEvents="none" style={[styles.redFlashOverlay, bossTintStyle]} />
          </View>

          {/* Sword Slash slash arc overlays */}
          <Animated.View pointerEvents="none" style={[styles.slashArc, slashAnimatedStyle]}>
            <LinearGradient
              colors={['transparent', '#F59E0B', '#FFF', '#F59E0B', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.slashLine}
            />
          </Animated.View>
        </View>

        {/* Real-time floating damage texts */}
        {damages.map(d => (
          <FloatingDamageLabel
            key={d.id}
            text={d.text}
            color={d.color}
            x={d.x}
            y={d.y}
            onComplete={() => setDamages(prev => prev.filter(item => item.id !== d.id))}
          />
        ))}

        {/* Boss HP Bar HUD */}
        <View style={styles.hpHUD}>
          <View style={styles.hpTrack}>
            <Animated.View style={[styles.hpFill, hpStyle]} />
          </View>
          <View style={styles.hpTextRow}>
            <Ionicons name="flame" size={14} color="#EF4444" />
            <Text style={styles.hpLabel}>PUNTOS DE VIDA DEL JEFE: {bossHP}/100</Text>
          </View>
        </View>
      </View>
    );
  };

  if (phase === 'intro') {
    return (
      <View style={[styles.container, { backgroundColor: '#111827' }]}>
        <CombatArena />
        <View style={styles.introCenter}>
          <Text style={styles.introSubtitle}>Reto final de la zona</Text>
          <Text style={styles.introTitle}>3 rondas.{'\n'}Un jefe.</Text>
          <Text style={styles.introDesc}>Supera las pruebas de velocidad, memoria y comprensión. Cada acierto debilita al jefe.</Text>
          <View style={styles.challengeRow}>
            {CHALLENGES.map((c, i) => (
              <View key={i} style={styles.challengePill}>
                <Text style={styles.challengePillText}>{i + 1}. {c.label}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={() => setPhase('playing')} style={styles.battleBtn}>
            <Text style={styles.battleBtnText}>¡A LA BATALLA!</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === 'round-end') {
    const emoji = roundResult!.score > 0.66 ? '⚔️' : roundResult!.score > 0.33 ? '💥' : '🛡️';
    return (
      <View style={[styles.container, { backgroundColor: '#111827' }]}>
        <CombatArena />
        <View style={styles.roundEndCenter}>
          <Text style={{ fontSize: 72 }}>{emoji}</Text>
          <Text style={styles.roundDoneLabel}>Ronda completada</Text>
          <Text style={styles.damageText}>-{roundResult!.damage} HP Totales</Text>
          <Text style={styles.roundDesc}>
            {bossHP === 0 ? '¡El jefe está vencido!' : cIdx + 1 >= CHALLENGES.length ? 'Última ronda terminada' : 'Prepárate para la siguiente'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={handleNext} style={[styles.battleBtn, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.battleBtnText}>{cIdx + 1 >= CHALLENGES.length ? 'Ver resultado final' : 'Siguiente ronda'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const current = CHALLENGES[cIdx];
  return (
    <View style={styles.container}>
      <CombatArena />
      <View style={{ flex: 1 }}>
        {current.type === 'speed' && (
          <BossSpeedRound onFinish={handleRoundFinish} onAction={handleAction} />
        )}
        {current.type === 'memory' && (
          <BossMemoryRound onFinish={handleRoundFinish} onAction={handleAction} />
        )}
        {current.type === 'comprehension' && (
          <BossComprehensionRound onFinish={handleRoundFinish} onAction={handleAction} />
        )}
      </View>
    </View>
  );
}

// ─── Speed Challenge Sub-round ───────────────────────────────────────────────
function BossSpeedRound({
  onFinish,
  onAction,
}: {
  onFinish: (score: number) => void;
  onAction: (correct: boolean, damage?: number) => void;
}) {
  const words = ['rápido', 'leer', 'foco', 'mente', 'atento', 'claro', 'ágil', 'despierto'];
  const [idx, setIdx] = useState(0);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const timerProgress = useSharedValue(1);
  
  const start = useRef(Date.now());
  const wordStart = useRef(Date.now());

  const containerW = 280;
  const containerH = 180;
  const targetW = 100;
  const targetH = 45;

  const nextWord = () => {
    if (idx >= words.length - 1) {
      const time = (Date.now() - start.current) / 1000;
      const score = Math.max(0, Math.min(1, 1 - (time - 6) / 10));
      onFinish(score);
    } else {
      setIdx(i => i + 1);
    }
  };

  const handleTimeout = () => {
    onAction(false); // Missed! Shield blocks
    nextWord();
  };

  useEffect(() => {
    const newX = Math.random() * (containerW - targetW - 20) + 10;
    const newY = Math.random() * (containerH - targetH - 20) + 10;
    setPos({ x: newX, y: newY });
    wordStart.current = Date.now();

    timerProgress.value = 1;
    timerProgress.value = withTiming(0, { duration: 1500 }, (finished) => {
      if (finished) {
        runOnJS(handleTimeout)();
      }
    });
  }, [idx]);

  const handleTap = () => {
    timerProgress.value = 0;
    const duration = (Date.now() - wordStart.current) / 1000;
    const isCrit = duration < 0.75;
    const damage = isCrit ? 8 : 5; // Crit Deals 8 dmg (taps < 0.75s), normal 5
    onAction(true, damage);
    nextWord();
  };

  const timerStyle = useAnimatedStyle(() => ({
    width: `${timerProgress.value * 100}%` as any,
  }));

  if (idx >= words.length) return null;

  return (
    <View style={[bossStyles.roundContainer, { backgroundColor: '#0B0F19' }]}>
      <Text style={bossStyles.roundHint}>REACTION TAP: TOCA EL TARGET ANTES DE 1.5S · {idx + 1}/{words.length}</Text>
      <View style={[bossStyles.arenaBox, { width: containerW, height: containerH }]}>
        <Pressable
          onPress={handleTap}
          style={[
            bossStyles.targetBtn,
            {
              left: pos.x,
              top: pos.y,
              width: targetW,
              height: targetH,
            }
          ]}
        >
          <Text style={bossStyles.targetText}>{words[idx]}</Text>
          <Animated.View style={[bossStyles.targetTimerBar, timerStyle]} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Memory Challenge Sub-round ───────────────────────────────────────────────
function BossMemoryRound({
  onFinish,
  onAction,
}: {
  onFinish: (score: number) => void;
  onAction: (correct: boolean, damage?: number) => void;
}) {
  const [digits] = useState(() => Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [input, setInput] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (phase === 'show') {
      const t = setTimeout(() => setPhase('input'), 3500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const tap = (n: number) => {
    const nextIdx = input.length;
    const isCorrect = n === digits[nextIdx];

    let damage = 6;
    let nextStreak = 0;
    if (isCorrect) {
      nextStreak = streak + 1;
      setStreak(nextStreak);
      if (nextStreak >= 3) {
        damage = 10; // Critical Hit!
      }
    } else {
      setStreak(0);
    }

    onAction(isCorrect, isCorrect ? damage : undefined);

    const newIn = [...input, n];
    setInput(newIn);
    if (newIn.length === digits.length) {
      const correct = newIn.filter((d, i) => d === digits[i]).length;
      setTimeout(() => onFinish(correct / digits.length), 600);
    }
  };

  if (phase === 'show') {
    return (
      <View style={[bossStyles.roundContainer, { backgroundColor: '#0B0F19' }]}>
        <Text style={bossStyles.roundHint}>Memoriza estos números</Text>
        <View style={bossStyles.digitsRow}>
          {digits.map((d, i) => (
            <View key={i} style={bossStyles.digitCard}>
              <Text style={bossStyles.digitText}>{d}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[bossStyles.roundContainer, { backgroundColor: '#0B0F19', justifyContent: 'flex-start', paddingTop: 20 }]}>
      <Text style={bossStyles.roundHint}>Escribe los números en orden {streak >= 3 ? '🔥 Streak x' + streak : ''}</Text>
      <View style={bossStyles.inputRow}>
        {digits.map((_, i) => (
          <View key={i} style={[bossStyles.inputSlot, input[i] != null && { borderColor: BOSS_ACCENT, backgroundColor: `${BOSS_ACCENT}30` }]}>
            <Text style={bossStyles.inputText}>{input[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <View style={bossStyles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(n => (
          <Pressable key={n} onPress={() => tap(n)} style={bossStyles.numKey}>
            <Text style={bossStyles.numKeyText}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Comprehension Challenge Sub-round ───────────────────────────────────────
function BossComprehensionRound({
  onFinish,
  onAction,
}: {
  onFinish: (score: number) => void;
  onAction: (correct: boolean, damage?: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const q = {
    text: 'La práctica espaciada mejora la memoria a largo plazo más que estudiar todo de una vez.',
    q: '¿Qué afirma el texto?',
    opts: [
      'Estudiar intensivo es igual de eficaz',
      'Espaciar la práctica mejora el recuerdo duradero',
      'La memoria no se puede entrenar',
    ],
    correct: 1,
  };

  const handle = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === q.correct;
    onAction(isCorrect, isCorrect ? 54 : undefined); // Deal 54 mega critical damage!

    setTimeout(() => onFinish(isCorrect ? 1 : 0), 1200);
  };

  return (
    <View style={[bossStyles.roundContainer, { backgroundColor: '#0B0F19', justifyContent: 'center', gap: 16 }]}>
      <Text style={bossStyles.roundHint}>Lee y responde</Text>
      <View style={bossStyles.textCard}>
        <Text style={bossStyles.textCardContent}>{q.text}</Text>
      </View>
      <Text style={bossStyles.qText}>{q.q}</Text>
      <View style={{ gap: 8, width: '100%' }}>
        {q.opts.map((opt, i) => {
          const isCorrectAnswer = i === q.correct;
          const wasPicked = picked === i;
          
          let btnColor = 'rgba(255,255,255,0.06)';
          if (picked !== null) {
            if (isCorrectAnswer) btnColor = '#16A34A';
            else if (wasPicked) btnColor = '#DC2626';
          }

          return (
            <Pressable
              key={i}
              onPress={() => handle(i)}
              disabled={picked !== null}
              style={[bossStyles.optBtn, { backgroundColor: btnColor }]}
            >
              <Text style={bossStyles.optText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  arenaContainer: {
    height: 250,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderColor: '#3F0712',
  },
  arenaHUD: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 28,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  quitBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quitIcon: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  roundLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  bossName: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#fff',
    marginTop: 2,
  },
  battleground: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  playerSide: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bossSide: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sideLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  vsBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EF444430',
    borderWidth: 1,
    borderColor: '#EF444450',
  },
  vsBadgeText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: '#FCA5A5',
  },
  shieldBubble: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F618',
    top: -10,
    left: -10,
  },
  redFlashOverlay: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    top: -10,
    left: -6,
  },
  slashArc: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    top: '40%',
    height: 20,
    justifyContent: 'center',
    zIndex: 20,
  },
  slashLine: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
  },
  damageLabelText: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    fontWeight: '900',
    textShadowColor: 'black',
    textShadowRadius: 6,
    textShadowOffset: { width: 1.5, height: 1.5 },
  },
  hpHUD: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  hpTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
  hpTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  hpLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 9,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  introCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  introSubtitle: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  introTitle: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: '#fff',
    textAlign: 'center',
  },
  introDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#D1D5DB',
    textAlign: 'center',
    maxWidth: 300,
  },
  challengeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  challengePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  challengePillText: {
    fontFamily: FONTS.heading,
    fontSize: 11,
    color: '#fff',
  },
  footer: {
    padding: 16,
    paddingBottom: 28,
  },
  battleBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(239,68,68,0.5)' } as any,
      default: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 6,
      },
    }),
  },
  battleBtnText: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  roundEndCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  roundDoneLabel: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#FCA5A5',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  damageText: {
    fontFamily: FONTS.heading,
    fontSize: 32,
    color: '#EF4444',
  },
  roundDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#D1D5DB',
  },
});

const bossStyles = StyleSheet.create({
  roundContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    gap: 24,
    justifyContent: 'center',
  },
  roundHint: {
    fontFamily: FONTS.headingSemi,
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  arenaBox: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 10,
  },
  targetBtn: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    ...Platform.select({
      web: { boxShadow: '0 4px 15px rgba(220,38,38,0.5)' } as any,
      default: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 5,
      },
    }),
  },
  targetText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: '#fff',
    textTransform: 'uppercase',
  },
  targetTimerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#F59E0B',
  },
  wordCard: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 24,
    ...Platform.select({
      web: { boxShadow: '0 20px 50px rgba(220,38,38,0.4)' } as any,
      default: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
        elevation: 8,
      },
    }),
  },
  wordText: {
    fontFamily: FONTS.heading,
    fontSize: 44,
    color: '#fff',
  },
  nextBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
  },
  nextBtnText: {
    fontFamily: FONTS.heading,
    fontSize: 14,
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  digitsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  digitCard: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: BOSS_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(220,38,38,0.4)' } as any,
      default: {
        shadowColor: BOSS_ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 4,
      },
    }),
  },
  digitText: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: '#fff',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 16,
  },
  inputSlot: {
    width: 38,
    height: 48,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: FONTS.heading,
    fontSize: 22,
    color: '#fff',
  },
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    width: '100%',
  },
  numKey: {
    width: '18%',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  numKeyText: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: '#fff',
  },
  textCard: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    width: '100%',
  },
  textCardContent: {
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 22,
    color: '#F3F4F6',
  },
  qText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  optBtn: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    width: '100%',
  },
  optText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#fff',
  },
});
