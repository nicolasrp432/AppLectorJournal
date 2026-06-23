import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLociStore, UserMemoryPalace } from '../../store/useLociStore';
import { STARTER_PALACES, isStarterPalaceId } from '../../constants/lociStarterPalaces';
import { invokeEdgeFunction } from '../../lib/supabase';
import { MascotChar } from '../../components/ui/MascotChar';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

const { width } = Dimensions.get('window');

export default function LociViewScreen() {
  const { palaces, fetchPalaces, deletePalace, updateMemoryImage, getDuePalaces, isLoading } = useLociStore();
  const [selectedPalace, setSelectedPalace] = useState<UserMemoryPalace | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [generatingImg, setGeneratingImg] = useState(false);
  const attemptedRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchPalaces();
  }, []);

  // El palacio en estado actual (re-derivado del store para ver imágenes nuevas).
  const livePalace = selectedPalace ? palaces.find(p => p.id === selectedPalace.id) ?? selectedPalace : null;

  // Palacios cuyo repaso espaciado (SM-2) ya vence: "a repasar hoy".
  const duePalaces = getDuePalaces();
  const dueIds = React.useMemo(() => new Set(duePalaces.map(p => p.id)), [duePalaces]);

  // Genera la imagen del locus que se está viendo, UNA A UNA (bajo demanda) con
  // Nano Banana, para no exceder la cuota. La persiste al terminar.
  useEffect(() => {
    const mem = livePalace?.memories[activeSlide];
    if (!livePalace || !mem || mem.image_url) return;
    // Los palacios de ejemplo funcionan offline (con emoji); no gastamos IA en ellos.
    if (isStarterPalaceId(livePalace.id)) return;
    if (attemptedRef.current.has(mem.id)) return;
    attemptedRef.current.add(mem.id);

    let active = true;
    (async () => {
      setGeneratingImg(true);
      try {
        const { data } = await invokeEdgeFunction<{ imageBase64?: string; mimeType?: string }>('ai-loci-images', {
          room: mem.room,
          items: [mem.item],
          hook: mem.story,
        });
        if (active && data?.imageBase64) {
          const uri = `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`;
          await updateMemoryImage(livePalace.id, mem.id, uri);
        }
      } catch (e) {
        console.warn('Loci image gen failed:', e);
      } finally {
        if (active) setGeneratingImg(false);
      }
    })();
    return () => { active = false; };
  }, [livePalace?.id, activeSlide]);

  const handleLaunchPalaceRecall = (palaceId: string) => {
    router.push({
      pathname: '/exercise/loci' as any,
      params: { palaceId }
    });
  };

  const handleDelete = async (palaceId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este palacio de memoria?')) {
      await deletePalace(palaceId);
      if (selectedPalace?.id === palaceId) {
        setSelectedPalace(null);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => selectedPalace ? setSelectedPalace(null) : router.back()} 
          style={styles.backBtn} 
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>
          {selectedPalace ? selectedPalace.topic : 'Mis Palacios de Memoria'}
        </Text>
        {selectedPalace && !isStarterPalaceId(selectedPalace.id) ? (
          <Pressable onPress={() => handleDelete(selectedPalace.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        ) : !selectedPalace ? (
          <Pressable onPress={() => router.push('/loci/create' as any)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Crear</Text>
          </Pressable>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* LOADING */}
      {isLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={COLORS.loci} size="large" />
          <Text style={styles.loadingText}>Cargando palacios desde la nube...</Text>
        </View>
      )}

      {/* PALACES LIST VIEW */}
      {!isLoading && !selectedPalace && (
        <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.mascotRow}>
            <MascotChar which="loci" size={70} />
            <View style={styles.mascotBalloon}>
              <Text style={styles.balloonText}>
                Practica con un palacio de ejemplo o construye el tuyo sobre cualquier tema. Repásalos deslizando y pon a prueba tu recuerdo.
              </Text>
            </View>
          </View>

          <Pressable onPress={() => router.push('/loci/tutorial' as any)} style={styles.howToBtn}>
            <Ionicons name="school-outline" size={16} color={COLORS.loci} />
            <Text style={styles.howToText}>¿Cómo funciona? Aprende la técnica en 1 minuto</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.loci} />
          </Pressable>

          {/* Repaso espaciado: palacios a repasar hoy */}
          {duePalaces.length > 0 && (
            <>
              <View style={styles.dueHeaderRow}>
                <Ionicons name="alarm-outline" size={16} color={COLORS.loci} />
                <Text style={styles.sectionTitle}>Repasar hoy</Text>
                <View style={styles.dueCountPill}>
                  <Text style={styles.dueCountText}>{duePalaces.length}</Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>El repaso espaciado refuerza estos palacios justo antes de olvidarlos.</Text>
              <View style={styles.palacesGrid}>
                {duePalaces.map(p => (
                  <PalaceRow
                    key={`due_${p.id}`}
                    topic={p.topic}
                    theme={p.theme}
                    count={p.memories.length}
                    coverUri={p.memories?.[0]?.image_url}
                    due
                    onPress={() => handleLaunchPalaceRecall(p.id)}
                  />
                ))}
              </View>
              <View style={{ height: 24 }} />
            </>
          )}

          {/* Palacios propios */}
          {palaces.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Mis palacios</Text>
              <View style={styles.palacesGrid}>
                {palaces.map(p => (
                  <PalaceRow
                    key={p.id}
                    topic={p.topic}
                    theme={p.theme}
                    count={p.memories.length}
                    coverUri={p.memories?.[0]?.image_url}
                    due={dueIds.has(p.id)}
                    onPress={() => { setSelectedPalace(p); setActiveSlide(0); }}
                  />
                ))}
              </View>
            </>
          ) : (
            <View style={styles.emptyInline}>
              <Text style={styles.emptyTitle}>Aún no tienes palacios propios</Text>
              <Text style={styles.emptySub}>Empieza practicando con un ejemplo de abajo, o crea uno sobre cualquier tema.</Text>
              <View style={{ height: 12 }} />
              <PushButton color={COLORS.loci} onPress={() => router.push('/loci/create' as any)}>
                Construir mi primer palacio
              </PushButton>
            </View>
          )}

          {/* Palacios de ejemplo (pre-construidos) */}
          <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Palacios de ejemplo</Text>
          <Text style={styles.sectionSub}>Listos para practicar ahora mismo, sin crear nada.</Text>
          <View style={styles.palacesGrid}>
            {STARTER_PALACES.map(p => (
              <PalaceRow
                key={p.id}
                topic={p.topic}
                theme={p.theme}
                count={p.memories.length}
                starter
                onPress={() => { setSelectedPalace(p); setActiveSlide(0); }}
              />
            ))}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* SELECTED PALACE SLIDESHOW WALKTHROUGH */}
      {!isLoading && livePalace && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.walkthroughScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Slide Carousel Card */}
            <View style={styles.slideCard}>
              <View style={styles.slideImgBox}>
                {livePalace.memories[activeSlide]?.image_url ? (
                  <Image
                    source={{ uri: livePalace.memories[activeSlide].image_url }}
                    style={styles.slideImg}
                  />
                ) : (
                  <View style={styles.slideImgPlaceholder}>
                    {generatingImg ? (
                      <>
                        <ActivityIndicator color={COLORS.loci} size="large" />
                        <Text style={styles.genImgText}>Creando imagen con IA…</Text>
                      </>
                    ) : (
                      <Ionicons name="image-outline" size={48} color={COLORS.subtle} />
                    )}
                  </View>
                )}
                <View style={styles.slideRoomBadge}>
                  <Text style={styles.slideRoomText}>Locus {activeSlide + 1}: {livePalace.memories[activeSlide]?.room}</Text>
                </View>
              </View>

              <View style={styles.slideInfo}>
                <Text style={styles.slideConcept}>{livePalace.memories[activeSlide]?.item}</Text>
                <Text style={styles.slideStory}>{livePalace.memories[activeSlide]?.story}</Text>
              </View>
            </View>

            {/* Slide indicators / selectors */}
            <View style={styles.indicatorsRow}>
              {livePalace.memories.map((_, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => setActiveSlide(idx)}
                  style={[styles.indicatorDot, activeSlide === idx && { backgroundColor: COLORS.loci, width: 24 }]}
                />
              ))}
            </View>

            {/* Slide Navigation Buttons */}
            <View style={styles.slideNavButtons}>
              <Pressable
                onPress={() => setActiveSlide(s => Math.max(0, s - 1))}
                disabled={activeSlide === 0}
                style={[styles.slideNavBtn, activeSlide === 0 && { opacity: 0.4 }]}
              >
                <Ionicons name="chevron-back" size={24} color={COLORS.ink} />
                <Text style={styles.navBtnText}>Anterior</Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveSlide(s => Math.min(livePalace.memories.length - 1, s + 1))}
                disabled={activeSlide === livePalace.memories.length - 1}
                style={[styles.slideNavBtn, activeSlide === livePalace.memories.length - 1 && { opacity: 0.4 }]}
              >
                <Text style={styles.navBtnText}>Siguiente</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.ink} />
              </Pressable>
            </View>

            <View style={{ height: 24 }} />
            <PushButton
              color={COLORS.loci}
              onPress={() => handleLaunchPalaceRecall(livePalace.id)}
            >
              Comenzar Test de Recuerdo
            </PushButton>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

function PalaceRow({ topic, theme, count, coverUri, starter, due, onPress }: {
  topic: string;
  theme: string;
  count: number;
  coverUri?: string;
  starter?: boolean;
  due?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.palaceCard, due && styles.palaceCardDue]}>
      <View style={styles.palaceCover}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.coverImg} />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: COLORS.loci + '15' }]}>
            <Ionicons name={starter ? 'sparkles' : 'home'} size={22} color={COLORS.loci} />
          </View>
        )}
      </View>
      <View style={styles.palaceInfo}>
        <View style={styles.palaceTopicRow}>
          <Text style={styles.palaceTopic} numberOfLines={2}>{topic}</Text>
          {starter && (
            <View style={styles.starterBadge}>
              <Text style={styles.starterBadgeText}>Ejemplo</Text>
            </View>
          )}
          {due && (
            <View style={styles.dueBadge}>
              <Ionicons name="alarm-outline" size={10} color="#fff" />
              <Text style={styles.dueBadgeText}>Toca repasar</Text>
            </View>
          )}
        </View>
        <Text style={styles.palaceMeta}>
          Plantilla: <Text style={{ textTransform: 'capitalize' }}>{theme}</Text> · {count} Loci
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} style={{ marginRight: 4 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.canvas },
  sectionTitle:     { fontFamily: FONTS.headingSemi, fontSize: 12, color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  sectionSub:       { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: -6, marginBottom: 12 },
  howToBtn:         { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.loci + '0D', borderRadius: 14, borderWidth: 1, borderColor: COLORS.loci + '33', paddingVertical: 12, paddingHorizontal: 14, marginBottom: 20 },
  howToText:        { flex: 1, fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.loci },
  emptyInline:      { backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 20, alignItems: 'center' },
  palaceTopicRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  starterBadge:     { backgroundColor: COLORS.loci + '15', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  starterBadgeText: { fontFamily: FONTS.headingSemi, fontSize: 9, color: COLORS.loci, textTransform: 'uppercase', letterSpacing: 0.5 },
  dueBadge:         { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.loci, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  dueBadgeText:     { fontFamily: FONTS.headingSemi, fontSize: 9, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  dueHeaderRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  dueCountPill:     { backgroundColor: COLORS.loci, borderRadius: 999, minWidth: 20, height: 20, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  dueCountText:     { fontFamily: FONTS.headingSemi, fontSize: 11, color: '#fff' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  deleteBtn:        { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FED7D7', alignItems: 'center', justifyContent: 'center' },
  addBtn:           { backgroundColor: COLORS.loci, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:       { fontFamily: FONTS.headingSemi, fontSize: 12, color: '#fff' },

  loadingBox:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:      { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },

  emptyTitle:       { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink, textAlign: 'center' },
  emptySub:         { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginBottom: 12 },

  listContainer:    { padding: 24 },
  mascotRow:        { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 },
  mascotBalloon:    { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 14 },
  balloonText:      { fontFamily: FONTS.body, fontSize: 12, color: COLORS.ink, lineHeight: 18 },

  palacesGrid:      { gap: 12 },
  palaceCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, gap: 12 },
  palaceCardDue:    { borderColor: COLORS.loci, backgroundColor: COLORS.loci + '08' },
  palaceCover:      { width: 50, height: 50, borderRadius: 10, overflow: 'hidden' },
  coverImg:         { width: '100%', height: '100%' },
  coverPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  palaceInfo:       { flex: 1 },
  palaceTopic:      { fontFamily: FONTS.headingSemi, fontSize: 14, color: COLORS.ink },
  palaceMeta:       { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted, marginTop: 2 },

  // Walkthrough Slideshow
  walkthroughScroll: { padding: 24 },
  slideCard:        { backgroundColor: COLORS.white, borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
  slideImgBox:      { width: '100%', height: width - 48, position: 'relative' },
  slideImg:         { width: '100%', height: '100%' },
  slideImgPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', gap: 12 },
  genImgText:       { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  slideRoomBadge:   { position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  slideRoomText:    { fontFamily: FONTS.headingSemi, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8 },
  
  slideInfo:        { padding: 20 },
  slideConcept:     { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink },
  slideStory:       { fontFamily: FONTS.body, fontSize: 14, color: COLORS.muted, marginTop: 8, lineHeight: 22 },

  indicatorsRow:    { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 20 },
  indicatorDot:     { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  
  slideNavButtons:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  slideNavBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  navBtnText:       { fontFamily: FONTS.headingSemi, fontSize: 13, color: COLORS.ink },
});
