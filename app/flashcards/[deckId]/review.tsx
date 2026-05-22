import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn, SlideInDown } from 'react-native-reanimated';
import { useFlashcardStore } from '../../../store/useFlashcardStore';
import FlashCard from '../../../components/flashcards/FlashCard';
import QualityButtons from '../../../components/flashcards/QualityButtons';
import { FONTS, FONT_SIZE } from '../../../constants/typography';
import { COLORS, darken } from '../../../constants/colors';
import { MascotChar } from '../../../components/ui/MascotChar';

const { width } = Dimensions.get('window');

export default function DeckReview() {
  const { deckId, free } = useLocalSearchParams<{ deckId: string; free?: string }>();
  
  const decks = useFlashcardStore((s) => s.decks);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const fetchDecks = useFlashcardStore((s) => s.fetchDecks);
  const fetchCards = useFlashcardStore((s) => s.fetchCards);
  const updateCardReview = useFlashcardStore((s) => s.updateFlashcardReview);
  const finishSession = useFlashcardStore((s) => s.finishSession);
  const isLoading = useFlashcardStore((s) => s.isLoading);

  const deck = decks.find((d) => d.id === deckId);
  const allCards = flashcards[deckId] || [];
  const deckColor = deck?.color || '#3B82F6';

  const [cardsToStudy, setCardsToStudy] = useState<typeof allCards>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (decks.length === 0) {
      fetchDecks();
    }
  }, [decks.length]);

  useEffect(() => {
    if (deckId) {
      fetchCards(deckId);
    }
  }, [deckId]);

  useEffect(() => {
    if (allCards.length > 0) {
      if (free === 'true') {
        // Free Practice: study all cards, shuffle them
        setCardsToStudy([...allCards].sort(() => Math.random() - 0.5));
      } else {
        // Due cards only
        const now = new Date();
        const due = allCards.filter((c) => new Date(c.next_due) <= now);
        if (due.length > 0) {
          setCardsToStudy(due.sort(() => Math.random() - 0.5));
        } else {
          // Fallback to all if somehow reached here
          setCardsToStudy([...allCards].sort(() => Math.random() - 0.5));
        }
      }
    }
  }, [allCards.length, free]);

  if (!deck) {
    if (isLoading || decks.length === 0) {
      return (
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Buscando mazo...</Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <MascotChar which="memo" size={120} expression="concerned" />
          <Text style={[styles.loadingText, { fontFamily: FONTS.headingBold, fontSize: FONT_SIZE.lg, marginTop: 20 }]}>
            Mazo no encontrado
          </Text>
          <Text style={{ fontFamily: FONTS.body, color: COLORS.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 }}>
            El mazo que intentas repasar no existe o fue eliminado.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: '#8B5CF6',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 50,
              marginTop: 24,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => router.replace('/flashcards' as any)}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, fontFamily: FONTS.headingBold, fontSize: FONT_SIZE.sm }}>Volver a Flashcards</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasFetched = flashcards[deckId] !== undefined;

  if (!hasFetched || (isLoading && allCards.length === 0)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Preparando tu sesión de estudio...</Text>
      </SafeAreaView>
    );
  }

  if (allCards.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <MascotChar which="memo" size={120} expression="concerned" />
          <Text style={[styles.loadingText, { fontFamily: FONTS.headingBold, fontSize: FONT_SIZE.lg, marginTop: 20 }]}>
            Este mazo está vacío
          </Text>
          <Text style={{ fontFamily: FONTS.body, color: COLORS.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 40, lineHeight: 20 }}>
            Necesitas agregar al menos una tarjeta antes de comenzar a estudiar.
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: deckColor,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 50,
              marginTop: 24,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: deckColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 4,
            }}
            onPress={() => router.replace(`/flashcards/${deck.id}` as any)}
          >
            <Ionicons name="arrow-back" size={16} color={COLORS.white} style={{ marginRight: 8 }} />
            <Text style={{ color: COLORS.white, fontFamily: FONTS.headingBold, fontSize: FONT_SIZE.sm }}>Volver al Mazo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (cardsToStudy.length === 0) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Preparando sesión...</Text>
      </SafeAreaView>
    );
  }

  const currentCard = cardsToStudy[currentIndex];
  const progress = cardsToStudy.length > 0 ? (currentIndex / cardsToStudy.length) * 100 : 0;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSelectQuality = async (quality: number) => {
    setIsFlipped(false);
    
    // Update review data using SM-2
    await updateCardReview(deck.id, currentCard.id, quality);

    // Short timeout to let the card flip back before changing index
    setTimeout(async () => {
      if (currentIndex < cardsToStudy.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Finished!
        setIsSubmitting(true);
        const earned = await finishSession(deck.id, cardsToStudy.length);
        setXpEarned(earned);
        setIsSubmitting(false);
        setIsFinished(true);
      }
    }, 200);
  };


  if (isFinished) {
    return (
      <SafeAreaView style={styles.victoryContainer}>
        <Animated.View entering={ZoomIn.duration(500)} style={styles.victoryCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC'] as [string, string]}
            style={styles.victoryGradient}
          >
            <View style={styles.mascotWrapper}>
              <MascotChar which="memo" size={140} expression="happy" />
            </View>

            <Text style={styles.victoryTitle}>¡Mazo Completado!</Text>
            <Text style={styles.victorySubtitle}>
              Excelente práctica. Has repasado todas las tarjetas programadas de repetición espaciada.
            </Text>

            <View style={styles.xpBox}>
              <LinearGradient
                colors={['#EAB308', '#F97316'] as [string, string]}
                style={styles.xpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="flash" size={24} color={COLORS.white} />
                <Text style={styles.xpText}>+{xpEarned} XP</Text>
              </LinearGradient>
            </View>

            <View style={styles.statsSummary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>{cardsToStudy.length}</Text>
                <Text style={styles.summaryLbl}>Revisadas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryVal}>100%</Text>
                <Text style={styles.summaryLbl}>Precisión</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.finishBtn, { backgroundColor: deckColor }]}
              onPress={() => router.replace(`/flashcards/${deck.id}` as any)}
            >
              <Text style={styles.finishBtnText}>Volver al Mazo</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Session Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{deck.name}</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} de {cardsToStudy.length} tarjetas
          </Text>
        </View>
        
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarBg}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            { width: `${progress}%`, backgroundColor: deckColor }
          ]} 
        />
      </View>

      {/* Main Flashcard Container */}
      <View style={styles.cardArea}>
        <FlashCard
          front={currentCard.front}
          back={currentCard.back}
          hint={currentCard.hint}
          color={deckColor}
          isFlipped={isFlipped}
          onFlip={handleFlip}
        />
      </View>

      {/* Quality controls (rendered after flip) */}
      <View style={styles.controlsArea}>
        {isFlipped ? (
          <QualityButtons onSelect={handleSelectQuality} />
        ) : (
          <Animated.View 
            entering={SlideInDown.duration(400)} 
            style={styles.tapPromptContainer}
          >
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleFlip}
              style={[styles.flipBtn, { backgroundColor: deckColor }]}
            >
              <Text style={styles.flipBtnText}>Revelar Respuesta</Text>
              <Ionicons name="eye-outline" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.canvas,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.md,
    color: COLORS.muted,
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base,
    color: COLORS.ink,
  },
  headerSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.muted,
    marginTop: 2,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.border,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },
  cardArea: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  controlsArea: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  tapPromptContainer: {
    alignItems: 'center',
    width: '100%',
  },
  flipBtn: {
    width: width * 0.9,
    paddingVertical: 16,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  flipBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base + 1,
  },
  victoryContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  victoryCard: {
    width: width * 0.9,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  victoryGradient: {
    padding: 30,
    alignItems: 'center',
  },
  mascotWrapper: {
    marginVertical: 10,
  },
  victoryTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE['3xl'],
    color: COLORS.ink,
    textAlign: 'center',
    marginTop: 10,
  },
  victorySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginVertical: 16,
    paddingHorizontal: 10,
  },
  xpBox: {
    borderRadius: 50,
    overflow: 'hidden',
    marginVertical: 10,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  xpGradient: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.lg,
    marginLeft: 6,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginVertical: 20,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryVal: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.ink,
  },
  summaryLbl: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: COLORS.muted,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },
  finishBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  finishBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base + 1,
  },
});
