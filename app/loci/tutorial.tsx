import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { MascotChar } from '../../components/ui/MascotChar';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { matchesRecall } from '../../lib/loci';

const PRINCIPLES = [
  { icon: 'map-outline', title: 'Una ruta familiar', text: 'Usa un lugar que conoces de memoria (tu casa) y recórrelo siempre en el mismo orden.' },
  { icon: 'location-outline', title: 'Un lugar, una cosa', text: 'Ancla cada dato que quieras recordar a una ubicación concreta del recorrido.' },
  { icon: 'sparkles-outline', title: 'Una imagen absurda', text: 'Imagínalo exagerado, en movimiento, gigante o ridículo. Lo extraño se recuerda; lo normal se olvida.' },
  { icon: 'walk-outline', title: 'Recorre para recordar', text: 'Para recuperar la información, "camina" mentalmente la ruta en orden y reencuentra cada imagen.' },
];

// Mini-ejemplo activo de 3 loci en una cocina imaginaria.
const EXAMPLE = [
  { room: 'La puerta', item: 'Plátano' },
  { room: 'La nevera', item: 'Paraguas' },
  { room: 'La mesa', item: 'Vela' },
];

export default function LociTutorialScreen() {
  const [phase, setPhase] = useState<'intro' | 'place' | 'recall' | 'done'>('intro');
  const [placeIdx, setPlaceIdx] = useState(0);
  const [associations, setAssociations] = useState<string[]>(['', '', '']);
  const [guesses, setGuesses] = useState<string[]>(['', '', '']);

  const score = EXAMPLE.reduce((acc, e, i) => acc + (matchesRecall(guesses[i], e.item) ? 1 : 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Cómo crear un Palacio</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* INTRO: principios */}
      {phase === 'intro' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotBox}>
            <MascotChar which="loci" expression="happy" size={96} />
            <View style={styles.balloon}>
              <Text style={styles.balloonText}>
                Un Palacio de Memoria convierte cualquier lista en un paseo por un lugar que ya conoces. Tu cerebro recuerda lugares mucho mejor que listas. Estos son los 4 principios:
              </Text>
            </View>
          </View>

          <View style={styles.principleList}>
            {PRINCIPLES.map((p, i) => (
              <View key={i} style={styles.principleCard}>
                <View style={styles.principleIcon}>
                  <Ionicons name={p.icon as any} size={20} color={COLORS.loci} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.principleTitle}>{i + 1}. {p.title}</Text>
                  <Text style={styles.principleText}>{p.text}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 20 }} />
          <PushButton color={COLORS.loci} onPress={() => { setPhase('place'); setPlaceIdx(0); }}>
            Probarlo con un mini-ejemplo
          </PushButton>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* PLACE: el usuario crea su propia imagen para cada locus (autoguiado) */}
      {phase === 'place' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTag}>Colocar · {placeIdx + 1}/{EXAMPLE.length}</Text>
          <Text style={styles.title}>
            Coloca <Text style={{ color: COLORS.loci }}>{EXAMPLE[placeIdx].item}</Text> en {EXAMPLE[placeIdx].room.toLowerCase()}
          </Text>
          <Text style={styles.subtitle}>
            Cierra los ojos un segundo e imagina la escena más absurda posible. Luego descríbela con tus palabras (no hay prisa).
          </Text>

          <TextInput
            style={styles.input}
            value={associations[placeIdx]}
            onChangeText={(v) => setAssociations(a => a.map((x, i) => (i === placeIdx ? v : x)))}
            placeholder={`Ej: Un ${EXAMPLE[placeIdx].item.toLowerCase()} gigante bloquea ${EXAMPLE[placeIdx].room.toLowerCase()}…`}
            placeholderTextColor={COLORS.subtle}
            multiline
          />

          <View style={{ height: 20 }} />
          <PushButton
            color={COLORS.loci}
            onPress={() => {
              if (placeIdx + 1 >= EXAMPLE.length) { setPhase('recall'); setGuesses(['', '', '']); }
              else setPlaceIdx(i => i + 1);
            }}
            disabled={!associations[placeIdx].trim()}
          >
            {placeIdx + 1 >= EXAMPLE.length ? 'Ahora a recordar' : 'Siguiente lugar'}
          </PushButton>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* RECALL: recorre la ruta y recuerda qué puso en cada sitio */}
      {phase === 'recall' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.stepTag}>Recordar</Text>
          <Text style={styles.title}>Recorre tu cocina mental</Text>
          <Text style={styles.subtitle}>¿Qué colocaste en cada sitio? Escríbelo recorriendo la ruta en orden.</Text>

          {EXAMPLE.map((e, i) => (
            <View key={i} style={{ marginTop: 16 }}>
              <Text style={styles.recallRoom}>{i + 1}. {e.room}</Text>
              <TextInput
                style={styles.input}
                value={guesses[i]}
                onChangeText={(v) => setGuesses(g => g.map((x, j) => (j === i ? v : x)))}
                placeholder="¿Qué objeto pusiste aquí?"
                placeholderTextColor={COLORS.subtle}
              />
            </View>
          ))}

          <View style={{ height: 20 }} />
          <PushButton
            color={COLORS.loci}
            onPress={() => setPhase('done')}
            disabled={guesses.some(g => !g.trim())}
          >
            Ver resultado
          </PushButton>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.resultBox}>
            <Ionicons
              name={score === EXAMPLE.length ? 'trophy' : 'ribbon'}
              size={72}
              color={score === EXAMPLE.length ? '#F59E0B' : COLORS.loci}
            />
            <Text style={styles.resultTitle}>Recordaste {score} de {EXAMPLE.length}</Text>
            <Text style={styles.resultSub}>
              {score === EXAMPLE.length
                ? '¡Acabas de usar un palacio de memoria! Cuanto más absurda fue tu imagen, más fácil fue recordar.'
                : 'Buen comienzo. El truco está en hacer las imágenes más exageradas y absurdas: así se fijan solas.'}
            </Text>
          </View>

          <View style={styles.reviewList}>
            {EXAMPLE.map((e, i) => {
              const ok = matchesRecall(guesses[i], e.item);
              return (
                <View key={i} style={styles.reviewRow}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={18} color={ok ? '#22C55E' : '#EF4444'} />
                  <Text style={styles.reviewText}>
                    {e.room}: <Text style={{ fontFamily: FONTS.headingSemi }}>{e.item}</Text>
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={{ height: 24 }} />
          <PushButton color={COLORS.loci} onPress={() => router.replace('/loci/create' as any)}>
            Crear mi propio palacio
          </PushButton>
          <Pressable onPress={() => router.replace('/loci/view' as any)} style={styles.linkBtn}>
            <Text style={styles.linkBtnText}>O practicar con un palacio de ejemplo</Text>
          </Pressable>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: COLORS.canvas },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn:         { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink },
  scroll:          { padding: 24 },

  mascotBox:       { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 20 },
  balloon:         { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 14 },
  balloonText:     { fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink, lineHeight: 20 },

  principleList:   { gap: 12 },
  principleCard:   { flexDirection: 'row', gap: 14, backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, padding: 16 },
  principleIcon:   { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.loci + '12', alignItems: 'center', justifyContent: 'center' },
  principleTitle:  { fontFamily: FONTS.heading, fontSize: 15, color: COLORS.ink },
  principleText:   { fontFamily: FONTS.body, fontSize: 12.5, color: COLORS.muted, marginTop: 4, lineHeight: 18 },

  stepTag:         { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.loci, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  title: { fontFamily: FONTS.heading, fontSize: 22, letterSpacing: -0.5, color: COLORS.ink, lineHeight: 30 },
  subtitle:        { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, lineHeight: 20, marginTop: 8 },
  input:           { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, color: COLORS.ink, backgroundColor: COLORS.white, marginTop: 16, minHeight: 56, textAlignVertical: 'top' },

  recallRoom:      { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.ink },

  resultBox:       { alignItems: 'center', marginVertical: 24, gap: 8 },
  resultTitle: { fontFamily: FONTS.heading, fontSize: 22, lineHeight: 28, letterSpacing: -0.5, color: COLORS.ink, marginTop: 8 },
  resultSub:       { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 },
  reviewList:      { gap: 10, marginTop: 8 },
  reviewRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewText:      { fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink },
  linkBtn:         { alignItems: 'center', paddingVertical: 14 },
  linkBtnText:     { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.loci },
});
