import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFlashcardStore } from '../../store/useFlashcardStore';
import DeckCard from '../../components/flashcards/DeckCard';
import { FONTS, FONT_SIZE } from '../../constants/typography';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

export default function FlashcardsIndex() {
  const fetchDecks = useFlashcardStore((s) => s.fetchDecks);
  const fetchCards = useFlashcardStore((s) => s.fetchCards);
  const decks = useFlashcardStore((s) => s.decks);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const isLoading = useFlashcardStore((s) => s.isLoading);

  useEffect(() => {
    const loadDecksAndCards = async () => {
      await fetchDecks();
    };
    loadDecksAndCards();
  }, []);

  // Fetch cards whenever decks are loaded or changed
  useEffect(() => {
    if (decks.length > 0) {
      decks.forEach((deck) => {
        fetchCards(deck.id);
      });
    }
  }, [decks]);

  // Calculate cards due today across all decks
  const getDueCount = (deckId: string) => {
    const cards = flashcards[deckId] || [];
    const now = new Date();
    return cards.filter((c) => new Date(c.next_due) <= now).length;
  };

  const totalDueToday = decks.reduce((acc, deck) => acc + getDueCount(deck.id), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Repetición Espaciada</Text>
        
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/flashcards/create' as any)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Práctica Diaria Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={['#8B5CF6', '#EC4899'] as [string, string]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerInfo}>
              <Text style={styles.bannerTitle}>Práctica Diaria</Text>
              <Text style={styles.bannerSubtitle}>
                {totalDueToday > 0
                  ? `Tienes ${totalDueToday} cartas pendientes para hoy.`
                  : '¡Buen trabajo! Estás al día con tus flashcards.'}
              </Text>
              
              {totalDueToday > 0 && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.studyAllButton}
                  onPress={() => {
                    // Find first deck with due cards and study it, or general study mode
                    const deckWithDue = decks.find((d) => getDueCount(d.id) > 0);
                    if (deckWithDue) {
                      router.push(`/flashcards/${deckWithDue.id}/review` as any);
                    }
                  }}
                >
                  <Text style={styles.studyAllText}>Estudiar Ahora</Text>
                  <Ionicons name="flash" size={16} color="#8B5CF6" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.bannerIconContainer}>
              <Ionicons 
                name={totalDueToday > 0 ? "hourglass-outline" : "checkmark-circle"} 
                size={70} 
                color="rgba(255, 255, 255, 0.25)" 
              />
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>Tus Mazos</Text>

        {isLoading && decks.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Cargando tus mazos...</Text>
          </View>
        ) : decks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="copy-outline" size={60} color={COLORS.subtle} />
            <Text style={styles.emptyTitle}>Sin Mazos de Aprendizaje</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primer mazo para empezar a memorizar conceptos usando repetición espaciada.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/flashcards/create' as any)}
              style={styles.emptyCreateButton}
            >
              <Text style={styles.emptyCreateButtonText}>Crear Mazo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              cards={flashcards[deck.id] || []}
              dueCount={getDueCount(deck.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  headerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.ink,
  },
  addButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    width: width * 0.9,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerGradient: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerInfo: {
    flex: 1,
    paddingRight: 10,
  },
  bannerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.white,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    lineHeight: 20,
  },
  studyAllButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  studyAllText: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.sm,
    color: '#8B5CF6',
  },
  bannerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.ink,
    marginLeft: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.md,
    color: COLORS.muted,
    marginTop: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: width * 0.9,
    alignSelf: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  emptyCreateButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 50,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyCreateButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base,
  },
});
