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
import { supabase } from '../../lib/supabase';

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

  const handleStartDecomposition = async () => {
    if (!topic.trim()) return;
    
    let rooms: string[] = [];
    if (theme === 'custom') {
      const parsed = customRoomsText.split(',').map(r => r.trim()).filter(Boolean);
      if (parsed.length < 3) {
        alert('Por favor ingresa al menos 3 habitaciones separadas por comas.');
        return;
      }
      rooms = parsed;
    } else {
      rooms = ROOMS_LIST[theme];
    }

    setStep('splitting');
    setLoadingText('Decomponiendo tu tema con Inteligencia Artificial...');
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-loci-split', {
        body: { topic, theme, rooms }
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
      alert('Error al conectar con la Inteligencia Artificial. Usando desglose básico.');
      // Local fallback
      const fallback = rooms.map((room, idx) => ({
        room,
        concept: `${topic} - Parte ${idx + 1}`,
        story: `Una escena surrealista y divertida sobre ${topic} que ocurre en: ${room}.`,
      }));
      setGeneratedConcepts(fallback);
      setStep('concepts');
    }
  };

  const handleConfirmConcepts = async () => {
    setStep('generating');
    setCurrentGenIndex(0);
    const finalMemories: typeof memoriesWithImages = [];

    for (let i = 0; i < generatedConcepts.length; i++) {
      const item = generatedConcepts[i];
      setCurrentGenIndex(i);
      setLoadingText(`Pintando con Google Imagen 3:\nHabitación ${i + 1} de ${generatedConcepts.length} (${item.room})`);

      let base64Image: string | undefined = undefined;

      try {
        const { data, error } = await supabase.functions.invoke('ai-loci-images', {
          body: {
            room: item.room,
            items: [item.concept],
            hook: item.story
          }
        });

        if (!error && data && data.imageBase64) {
          base64Image = `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`;
        }
      } catch (err) {
        console.warn(`Imagen generation failed for ${item.room}:`, err);
      }

      // Fallback robusto con imágenes espectaculares de Unsplash si falla la IA o CORS
      if (!base64Image) {
        const randomUnsplashSeed = (item.room.length + item.concept.length) % 10;
        const premiumFallbacks = [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1618005198143-d3667cd6f29e?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1533827436517-5782748b430b?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1527489377706-5bf97e608852?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=600&auto=format&fit=crop&q=80'
        ];
        base64Image = premiumFallbacks[randomUnsplashSeed];
      }

      finalMemories.push({
        room: item.room,
        concept: item.concept,
        story: item.story,
        image_url: base64Image
      });
    }

    // Save locally and in Supabase
    setLoadingText('Consolidando tu Palacio Mental...');
    const palace = await createPalace(topic, theme, finalMemories.map(m => ({
      room: m.room,
      item: m.concept,
      story: m.story,
      image_url: m.image_url
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
            onPress={handleStartDecomposition}
            disabled={!topic.trim() || (theme === 'custom' && !customRoomsText.trim())}
          >
            Comenzar construcción
          </PushButton>
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
            <View style={{ width: '80%', marginTop: 20 }}>
              <ProgressBar value={(currentGenIndex + 1) / generatedConcepts.length} color={COLORS.loci} height={8} />
              <Text style={styles.progressCounter}>Habitación {currentGenIndex + 1} de {generatedConcepts.length}</Text>
            </View>
          )}
        </View>
      )}

      {/* STEP 3: CONCEPTS PREVIEW */}
      {step === 'concepts' && (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Plan de Memorización</Text>
          <Text style={styles.subtitle}>Hemos dividido "{topic}" en 5 sub-conceptos para colocarlos en tu Palacio.</Text>

          <View style={styles.conceptList}>
            {generatedConcepts.map((item, idx) => (
              <View key={idx} style={styles.conceptCard}>
                <View style={styles.conceptBadge}>
                  <Text style={styles.conceptBadgeText}>{item.room}</Text>
                </View>
                <Text style={styles.conceptTitle}>{item.concept}</Text>
                <Text style={styles.conceptStory}>{item.story}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
          <PushButton color={COLORS.loci} onPress={handleConfirmConcepts}>
            Confirmar y pintar Palacio (Google Imagen 3)
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
            <Text style={styles.successSub}>Tu Palacio sobre "{topic}" ha sido guardado de forma permanente local y sincronizado.</Text>
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
