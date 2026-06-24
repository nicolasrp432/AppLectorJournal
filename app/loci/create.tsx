import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  TextInput, ActivityIndicator, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLociStore } from '../../store/useLociStore';
import { MascotChar } from '../../components/ui/MascotChar';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

const THEME_OPTIONS = [
  { id: 'casa' as const, label: '🏠 Hogar Dulce Hogar', desc: 'Entrada, Cocina, Sala, Dormitorio, Oficina (5 loci)' },
  { id: 'oficina' as const, label: '🏢 Oficina Moderna', desc: 'Recepción, Cafetería, Sala Reuniones, Relax, Escritorio (5 loci)' },
  { id: 'naturaleza' as const, label: '🌲 Parque Natural', desc: 'Sendero, Campamento, El Claro, Cabaña, Mirador (5 loci)' },
  { id: 'cuerpo' as const, label: '🧘 Mi Propio Cuerpo', desc: 'Cabeza, Ojos, Boca, Hombros, Pecho, Manos, Rodillas, Pies (8 loci)' },
  { id: 'mano' as const, label: '🖐️ Dedos de la Mano', desc: 'Pulgar, Índice, Medio, Anular, Meñique (5 loci)' },
  { id: 'custom' as const, label: '🛠️ Palacio Personalizado', desc: 'Escribe tus propias habitaciones físicas' },
];

const ROOMS_LIST = {
  casa: ['Entrada', 'Cocina', 'Sala', 'Dormitorio', 'Oficina'],
  oficina: ['Recepción', 'Cafetería', 'Reuniones', 'Relax', 'Escritorio'],
  naturaleza: ['Sendero', 'Campamento', 'El Claro', 'Cabaña', 'Mirador'],
  cuerpo: ['Cabeza', 'Ojos', 'Boca', 'Hombros', 'Pecho', 'Manos', 'Rodillas', 'Pies'],
  mano: ['Pulgar', 'Índice', 'Medio', 'Anular', 'Meñique'],
};

export default function LociCreateScreen() {
  const { createPalace } = useLociStore();
  const [topic, setTopic] = useState('');
  const [theme, setTheme] = useState<'casa' | 'oficina' | 'naturaleza' | 'cuerpo' | 'mano' | 'custom'>('casa');
  const [customRoomsText, setCustomRoomsText] = useState('');
  
  const [step, setStep] = useState<'input' | 'splitting' | 'concepts' | 'generating' | 'success'>('input');
  const [loadingText, setLoadingText] = useState('');
  const [generatedConcepts, setGeneratedConcepts] = useState<{ room: string; concept: string; story: string }[]>([]);
  
  // Generating images progress
  const [currentGenIndex, setCurrentGenIndex] = useState(0);
  const [memoriesWithImages, setMemoriesWithImages] = useState<{ room: string; concept: string; story: string; image_url?: string }[]>([]);

  // Resuelve la lista de habitaciones según la plantilla elegida.
  const resolveRooms = (): string[] | null => {
    if (theme === 'custom') {
      const parsed = customRoomsText.split(',').map(r => r.trim()).filter(Boolean);
      if (parsed.length < 3) {
        alert('Por favor ingresa al menos 3 habitaciones separadas por comas.');
        return null;
      }
      return parsed;
    }
    return ROOMS_LIST[theme];
  };

  // Camino "lo escribo yo": el usuario es el autor de cada asociación. La IA
  // queda como ayuda OPCIONAL dentro del paso de edición (es donde se aprende
  // la técnica). Ver docs/PLAN_MEJORAS_Y_EJERCICIOS.md (B2).
  const handleSelfAuthor = () => {
    if (!topic.trim()) return;
    const rooms = resolveRooms();
    if (!rooms) return;
    setGeneratedConcepts(rooms.map(room => ({ room, concept: '', story: '' })));
    setStep('concepts');
  };

  // Camino "borrador con IA": la IA propone, pero el resultado es EDITABLE por
  // el usuario en el paso siguiente.
  const handleAiDraft = async () => {
    if (!topic.trim()) return;
    const rooms = resolveRooms();
    if (!rooms) return;

    setStep('splitting');
    setLoadingText('Creando un borrador con IA (podrás editarlo)...');

    try {
      const { data, error } = await invokeEdgeFunction<{ concepts: any[] }>('ai-loci-split', {
        topic,
        theme,
        rooms,
      });

      if (error) throw error;
      if (data && data.concepts && data.concepts.length > 0) {
        setGeneratedConcepts(data.concepts);
        setStep('concepts');
      } else {
        throw new Error('No se pudo descomponer el tema. Intenta de nuevo.');
      }
    } catch (err) {
      console.warn(err);
      alert('No se pudo conectar con la IA. Te dejamos las habitaciones para que escribas tú las asociaciones.');
      setGeneratedConcepts(rooms.map(room => ({ room, concept: '', story: '' })));
      setStep('concepts');
    }
  };

  const updateConcept = (idx: number, field: 'concept' | 'story', value: string) => {
    setGeneratedConcepts(cs => cs.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  // Ayuda opcional: rellena con IA solo los campos que el usuario dejó vacíos.
  const [suggesting, setSuggesting] = useState(false);
  const handleSuggestEmpty = async () => {
    const rooms = generatedConcepts.map(c => c.room);
    setSuggesting(true);
    try {
      const { data, error } = await invokeEdgeFunction<{ concepts: any[] }>('ai-loci-split', {
        topic, theme, rooms,
      });
      if (error || !data?.concepts?.length) throw error || new Error('Sin sugerencias');
      setGeneratedConcepts(cs => cs.map((c, i) => ({
        room: c.room,
        concept: c.concept?.trim() ? c.concept : (data.concepts[i]?.concept ?? ''),
        story: c.story?.trim() ? c.story : (data.concepts[i]?.story ?? ''),
      })));
    } catch (err) {
      console.warn(err);
      alert('No se pudieron obtener sugerencias de la IA en este momento.');
    } finally {
      setSuggesting(false);
    }
  };

  const handleConfirmConcepts = async () => {
    // El usuario es el autor: cada locus necesita al menos QUÉ recordar.
    const missing = generatedConcepts.filter(c => !c.concept?.trim()).length;
    if (missing > 0) {
      alert(`Faltan ${missing} ${missing === 1 ? 'habitación' : 'habitaciones'} por completar (escribe qué recordar en cada una).`);
      return;
    }

    setStep('generating');
    setLoadingText('Consolidando tu Palacio Mental...');

    // No generamos las imágenes aquí: hacerlo de golpe (5 a la vez) excede la
    // cuota. Se generan UNA A UNA con Nano Banana al ver cada locus en el visor.
    const finalMemories = generatedConcepts.map(item => ({
      room: item.room,
      concept: item.concept,
      story: item.story,
      image_url: undefined as string | undefined,
    }));

    await createPalace(topic, theme, finalMemories.map(m => ({
      room: m.room,
      item: m.concept,
      story: m.story,
      image_url: m.image_url,
    })));

    setMemoriesWithImages(finalMemories);
    setStep('success');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Nuevo Palacio</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* STEP 1: INPUT */}
      {step === 'input' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotBox}>
            <MascotChar which="swift" expression="happy" size={100} />
            <View style={styles.mascotBalloon}>
              <Text style={styles.balloonText}>
                ¡Hola! Soy Simónides el Sabio. Dime qué tema libre deseas memorizar y yo dividiré la información en ganchos visuales absurdos.
              </Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Tema o Concepto a memorizar</Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="Ej: Las Leyes de Newton, Anatomía del Corazón, Reyes de España…"
            placeholderTextColor={COLORS.subtle}
          />

          <Text style={styles.fieldLabel}>Elige la Plantilla de tu Palacio</Text>
          <View style={styles.themeList}>
            {THEME_OPTIONS.map(opt => {
              const active = theme === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setTheme(opt.id)}
                  style={[styles.themeCard, active && styles.themeCardActive]}
                >
                  <Text style={[styles.themeTitle, active && styles.themeTitleActive]}>{opt.label}</Text>
                  <Text style={[styles.themeDesc, active && styles.themeDescActive]}>{opt.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          {theme === 'custom' && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.fieldLabel}>Tus Habitaciones (separadas por comas)</Text>
              <TextInput
                style={styles.input}
                value={customRoomsText}
                onChangeText={setCustomRoomsText}
                placeholder="Ej: Recibidor, Biblioteca, Pasillo, Terraza, Balcón"
                placeholderTextColor={COLORS.subtle}
              />
              <Text style={{ fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: -12, marginLeft: 4, lineHeight: 16 }}>
                Ingresa tus propios lugares favoritos separados por comas. (Mínimo 3 ubicaciones).
              </Text>
            </View>
          )}

          <View style={{ height: 24 }} />
          <PushButton
            color={COLORS.loci}
            onPress={handleSelfAuthor}
            disabled={!topic.trim() || (theme === 'custom' && !customRoomsText.trim())}
          >
            Escribir yo mis asociaciones
          </PushButton>
          <Pressable
            onPress={handleAiDraft}
            disabled={!topic.trim() || (theme === 'custom' && !customRoomsText.trim())}
            style={[styles.secondaryBtn, (!topic.trim() || (theme === 'custom' && !customRoomsText.trim())) && { opacity: 0.5 }]}
          >
            <Ionicons name="sparkles-outline" size={16} color={COLORS.loci} />
            <Text style={styles.secondaryBtnText}>Empezar con un borrador de IA</Text>
          </Pressable>
          <Text style={styles.authorHint}>
            Crear tú mismo las imágenes mentales es lo que de verdad entrena tu memoria. La IA es solo una ayuda opcional.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* STEP 2: SPLITTING & AI LOADER */}
      {(step === 'splitting' || step === 'generating') && (
        <View style={styles.loadingBox}>
          <MascotChar which="loci" expression="wink" size={120} />
          <ActivityIndicator color={COLORS.loci} size="large" style={{ marginTop: 24 }} />
          <Text style={styles.loadingTitle}>{loadingText}</Text>
          {step === 'generating' && (
            <Text style={styles.progressCounter}>Las imágenes se crearán al visitar cada locus.</Text>
          )}
        </View>
      )}

      {/* STEP 3: AUTHORING (editable) */}
      {step === 'concepts' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Construye tu Palacio</Text>
          <Text style={styles.subtitle}>
            Para cada habitación, escribe QUÉ quieres recordar y una imagen mental vívida y absurda que lo ancle a ese lugar. Cuanto más exagerada, mejor se recuerda.
          </Text>

          <Pressable onPress={handleSuggestEmpty} disabled={suggesting} style={styles.suggestBtn}>
            {suggesting ? (
              <ActivityIndicator size="small" color={COLORS.loci} />
            ) : (
              <Ionicons name="sparkles" size={15} color={COLORS.loci} />
            )}
            <Text style={styles.suggestBtnText}>
              {suggesting ? 'Pensando…' : 'Rellenar lo vacío con sugerencias de IA'}
            </Text>
          </Pressable>

          <View style={styles.conceptList}>
            {generatedConcepts.map((item, idx) => (
              <View key={idx} style={styles.conceptCard}>
                <View style={styles.conceptBadge}>
                  <Text style={styles.conceptBadgeText}>Locus {idx + 1} · {item.room}</Text>
                </View>
                <Text style={styles.authorFieldLabel}>Qué recordar aquí</Text>
                <TextInput
                  style={styles.authorInput}
                  value={item.concept}
                  onChangeText={(v) => updateConcept(idx, 'concept', v)}
                  placeholder="Ej: Mercurio, Leche, el año 1492…"
                  placeholderTextColor={COLORS.subtle}
                />
                <Text style={styles.authorFieldLabel}>Tu imagen mental (asociación)</Text>
                <TextInput
                  style={[styles.authorInput, styles.authorInputMultiline]}
                  value={item.story}
                  onChangeText={(v) => updateConcept(idx, 'story', v)}
                  placeholder="Ej: Un termómetro gigante con patas corre por la entrada chamuscando todo…"
                  placeholderTextColor={COLORS.subtle}
                  multiline
                />
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
          <PushButton color={COLORS.loci} onPress={handleConfirmConcepts}>
            Guardar mi Palacio
          </PushButton>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* STEP 5: SUCCESS */}
      {step === 'success' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            <Text style={styles.successTitle}>¡Palacio Creado con Éxito!</Text>
            <Text style={styles.successSub}>Tu Palacio sobre «{topic}» ha sido guardado de forma permanente local y sincronizado.</Text>
          </View>

          <Text style={styles.sectionTitle}>Recorrido del Palacio</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
            {memoriesWithImages.map((m, idx) => (
              <View key={idx} style={styles.galleryCard}>
                {m.image_url ? (
                  <Image source={{ uri: m.image_url }} style={styles.galleryImg} />
                ) : (
                  <View style={styles.galleryImgPlaceholder}>
                    <Ionicons name="image-outline" size={40} color={COLORS.subtle} />
                  </View>
                )}
                <View style={styles.galleryInfo}>
                  <Text style={styles.galleryRoom}>{m.room}</Text>
                  <Text style={styles.galleryConcept}>{m.concept}</Text>
                  <Text style={styles.galleryStory} numberOfLines={3}>{m.story}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ height: 24 }} />
          <PushButton color={COLORS.loci} onPress={() => router.push('/loci/view' as any)}>
            Ir a mis Palacios
          </PushButton>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// Visual helpers
function ProgressBar({ value, color, height = 6 }: { value: number; color: string; height?: number }) {
  return (
    <View style={{ height, backgroundColor: COLORS.border, borderRadius: 999, overflow: 'hidden' }}>
      <View style={{ width: `${value * 100}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.canvas },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink },
  scroll:           { padding: 24 },
  
  mascotBox:        { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 },
  mascotBalloon:    { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 14 },
  balloonText:      { fontFamily: FONTS.body, fontSize: 13, color: COLORS.ink, lineHeight: 20 },
  
  fieldLabel:       { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 16 },
  input:            { fontFamily: FONTS.body, fontSize: 15, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, color: COLORS.ink, backgroundColor: COLORS.white, marginBottom: 20 },
  
  themeList:        { gap: 12 },
  themeCard:        { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1.5, borderColor: COLORS.border, padding: 16 },
  themeCardActive:  { borderColor: COLORS.loci, backgroundColor: COLORS.loci + '05' },
  themeTitle:       { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.ink },
  themeTitleActive: { color: COLORS.loci },
  themeDesc:        { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 4 },
  themeDescActive:  { color: COLORS.loci + 'bf' },

  loadingBox:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingTitle:     { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, marginTop: 24, textAlign: 'center', lineHeight: 24 },
  progressCounter:  { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: 8 },

  title:            { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, marginBottom: 4 },
  subtitle:         { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, lineHeight: 20, marginBottom: 24 },
  
  conceptList:      { gap: 16 },
  conceptCard:      { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 20 },
  conceptBadge:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: COLORS.loci + '15', marginBottom: 10 },
  conceptBadgeText: { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.loci, textTransform: 'uppercase' },
  conceptTitle:     { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink },
  conceptStory:     { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, marginTop: 6, lineHeight: 20 },

  secondaryBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.loci, backgroundColor: COLORS.loci + '08' },
  secondaryBtnText: { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.loci },
  authorHint:       { fontFamily: FONTS.body, fontSize: 11.5, color: COLORS.muted, textAlign: 'center', lineHeight: 16, marginTop: 12, paddingHorizontal: 8 },

  suggestBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: COLORS.loci + '40', backgroundColor: COLORS.loci + '08' },
  suggestBtnText:   { fontFamily: FONTS.headingSemi, fontSize: 12.5, color: COLORS.loci },
  authorFieldLabel: { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 6 },
  authorInput:      { fontFamily: FONTS.body, fontSize: 14, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, color: COLORS.ink, backgroundColor: COLORS.canvas },
  authorInputMultiline: { minHeight: 72, textAlignVertical: 'top' },

  successBox:       { alignItems: 'center', marginVertical: 32 },
  successTitle:     { fontFamily: FONTS.heading, fontSize: 22, color: COLORS.ink, marginTop: 16 },
  successSub:       { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  sectionTitle:     { fontFamily: FONTS.headingSemi, fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 },

  galleryScroll:    { gap: 16, paddingRight: 40 },
  galleryCard:      { width: 220, backgroundColor: COLORS.white, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
  galleryImg:       { width: '100%', height: 220 },
  galleryImgPlaceholder: { width: '100%', height: 220, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  galleryInfo:      { padding: 14 },
  galleryRoom:      { fontFamily: FONTS.headingSemi, fontSize: 10, color: COLORS.loci, textTransform: 'uppercase' },
  galleryConcept:   { fontFamily: FONTS.heading, fontSize: 14, color: COLORS.ink, marginTop: 2 },
  galleryStory:     { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 4, lineHeight: 16 },
});
