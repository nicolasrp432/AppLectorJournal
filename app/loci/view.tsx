import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet,
  Image, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLociStore, UserMemoryPalace } from '../../store/useLociStore';
import { MascotChar } from '../../components/ui/MascotChar';
import { PushButton } from '../../components/ui/PushButton';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

const { width } = Dimensions.get('window');

export default function LociViewScreen() {
  const { palaces, fetchPalaces, deletePalace, isLoading } = useLociStore();
  const [selectedPalace, setSelectedPalace] = useState<UserMemoryPalace | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    fetchPalaces();
  }, []);

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
        {selectedPalace ? (
          <Pressable onPress={() => handleDelete(selectedPalace.id)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/loci/create' as any)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Crear</Text>
          </Pressable>
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
        palaces.length === 0 ? (
          <View style={styles.emptyState}>
            <MascotChar which="loci" expression="happy" size={120} />
            <Text style={styles.emptyTitle}>No tienes palacios de memoria creados</Text>
            <Text style={styles.emptySub}>Crea uno sobre cualquier tema libre usando la Inteligencia Artificial.</Text>
            <View style={{ height: 16 }} />
            <PushButton color={COLORS.loci} onPress={() => router.push('/loci/create' as any)}>
              Construir mi primer palacio
            </PushButton>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.mascotRow}>
              <MascotChar which="loci" size={70} />
              <View style={styles.mascotBalloon}>
                <Text style={styles.balloonText}>
                  Aquí se guardan tus palacios construidos. Repásalos deslizando las habitaciones o pon a prueba tu recuerdo con el test.
                </Text>
              </View>
            </View>

            <View style={styles.palacesGrid}>
              {palaces.map(p => (
                <Pressable 
                  key={p.id} 
                  onPress={() => { setSelectedPalace(p); setActiveSlide(0); }}
                  style={styles.palaceCard}
                >
                  <View style={styles.palaceCover}>
                    {p.memories?.[0]?.image_url ? (
                      <Image source={{ uri: p.memories[0].image_url }} style={styles.coverImg} />
                    ) : (
                      <View style={[styles.coverPlaceholder, { backgroundColor: COLORS.loci + '15' }]}>
                        <Ionicons name="home" size={24} color={COLORS.loci} />
                      </View>
                    )}
                  </View>
                  <View style={styles.palaceInfo}>
                    <Text style={styles.palaceTopic} numberOfLines={2}>{p.topic}</Text>
                    <Text style={styles.palaceMeta}>
                      Plantilla: <Text style={{ textTransform: 'capitalize' }}>{p.theme}</Text> · 5 Loci
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.subtle} style={{ marginRight: 4 }} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )
      )}

      {/* SELECTED PALACE SLIDESHOW WALKTHROUGH */}
      {!isLoading && selectedPalace && (
        <View style={{ flex: 1 }}>
          <ScrollView 
            contentContainerStyle={styles.walkthroughScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Slide Carousel Card */}
            <View style={styles.slideCard}>
              <View style={styles.slideImgBox}>
                {selectedPalace.memories[activeSlide]?.image_url ? (
                  <Image 
                    source={{ uri: selectedPalace.memories[activeSlide].image_url }} 
                    style={styles.slideImg} 
                  />
                ) : (
                  <View style={styles.slideImgPlaceholder}>
                    <Ionicons name="image-outline" size={48} color={COLORS.subtle} />
                  </View>
                )}
                <View style={styles.slideRoomBadge}>
                  <Text style={styles.slideRoomText}>Locus {activeSlide + 1}: {selectedPalace.memories[activeSlide]?.room}</Text>
                </View>
              </View>

              <View style={styles.slideInfo}>
                <Text style={styles.slideConcept}>{selectedPalace.memories[activeSlide]?.item}</Text>
                <Text style={styles.slideStory}>{selectedPalace.memories[activeSlide]?.story}</Text>
              </View>
            </View>

            {/* Slide indicators / selectors */}
            <View style={styles.indicatorsRow}>
              {selectedPalace.memories.map((_, idx) => (
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
                onPress={() => setActiveSlide(s => Math.min(selectedPalace.memories.length - 1, s + 1))}
                disabled={activeSlide === selectedPalace.memories.length - 1}
                style={[styles.slideNavBtn, activeSlide === selectedPalace.memories.length - 1 && { opacity: 0.4 }]}
              >
                <Text style={styles.navBtnText}>Siguiente</Text>
                <Ionicons name="chevron-forward" size={24} color={COLORS.ink} />
              </Pressable>
            </View>

            <View style={{ height: 24 }} />
            <PushButton 
              color={COLORS.loci} 
              onPress={() => handleLaunchPalaceRecall(selectedPalace.id)}
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

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: COLORS.canvas },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle:      { fontFamily: FONTS.heading, fontSize: 16, color: COLORS.ink, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  deleteBtn:        { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FED7D7', alignItems: 'center', justifyContent: 'center' },
  addBtn:           { backgroundColor: COLORS.loci, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText:       { fontFamily: FONTS.headingSemi, fontSize: 12, color: '#fff' },

  loadingBox:       { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:      { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },

  emptyState:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle:       { fontFamily: FONTS.heading, fontSize: 18, color: COLORS.ink, textAlign: 'center' },
  emptySub:         { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20, marginBottom: 12 },

  listContainer:    { padding: 24 },
  mascotRow:        { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 24 },
  mascotBalloon:    { flex: 1, backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 14 },
  balloonText:      { fontFamily: FONTS.body, fontSize: 12, color: COLORS.ink, lineHeight: 18 },

  palacesGrid:      { gap: 12 },
  palaceCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.border, padding: 12, gap: 12 },
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
  slideImgPlaceholder: { width: '100%', height: '100%', backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
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
