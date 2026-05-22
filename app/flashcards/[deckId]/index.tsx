import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFlashcardStore } from '../../../store/useFlashcardStore';
import { FONTS, FONT_SIZE } from '../../../constants/typography';
import { COLORS, darken } from '../../../constants/colors';

const { width } = Dimensions.get('window');

export default function DeckDetail() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const decks = useFlashcardStore((s) => s.decks);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const fetchDecks = useFlashcardStore((s) => s.fetchDecks);
  const fetchCards = useFlashcardStore((s) => s.fetchCards);
  const deleteDeck = useFlashcardStore((s) => s.deleteDeck);
  const isLoading = useFlashcardStore((s) => s.isLoading);

  const deck = decks.find((d) => d.id === deckId);
  const cards = flashcards[deckId] || [];

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

  if (!deck) {
    if (isLoading || decks.length === 0) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={[styles.errorText, { marginTop: 15 }]}>Cargando mazo...</Text>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.boss} />
        <Text style={styles.errorText}>Mazo no encontrado</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const now = new Date();
  const dueCards = cards.filter((c) => new Date(c.next_due) <= now);
  const dueCount = dueCards.length;

  const masteredCards = cards.filter((c) => c.repetitions > 2 && c.ease_factor >= 2.4).length;
  const masteryPercentage = cards.length > 0 ? Math.round((masteredCards / cards.length) * 100) : 0;

  const handleDeleteDeck = () => {
    Alert.alert(
      'Eliminar Mazo',
      '¿Estás seguro de que deseas eliminar este mazo y todas sus tarjetas? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteDeck(deck.id);
            router.replace('/flashcards' as any);
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (d <= now) return '¡Pendiente ahora!';
    return d.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const deckColor = deck.color || '#3B82F6';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.ink} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>{deck.name}</Text>
        
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDeleteDeck}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={22} color={COLORS.boss} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Deck Info Banner */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={[deckColor, darken(deckColor, 0.25)] as [string, string]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerTop}>
              <View style={styles.infoCol}>
                <Text style={styles.bannerName}>{deck.name}</Text>
                <Text style={styles.bannerDesc}>{deck.description || 'Sin descripción.'}</Text>
              </View>
              {deck.is_ai_generated && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>🤖 IA</Text>
                </View>
              )}
            </View>

            <View style={styles.metricsContainer}>
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{cards.length}</Text>
                <Text style={styles.metricLbl}>Tarjetas</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={[styles.metricVal, dueCount > 0 ? { color: '#FF8787' } : {}]}>
                  {dueCount}
                </Text>
                <Text style={styles.metricLbl}>Pendientes</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metric}>
                <Text style={styles.metricVal}>{masteryPercentage}%</Text>
                <Text style={styles.metricLbl}>Dominio</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Study Call to Action */}
        <View style={styles.actionContainer}>
          {dueCount > 0 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.studyBtn, { backgroundColor: deckColor }]}
              onPress={() => router.push(`/flashcards/${deck.id}/review` as any)}
            >
              <Ionicons name="play" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.studyBtnText}>Estudiar {dueCount} Pendientes</Text>
            </TouchableOpacity>
          ) : cards.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.studyBtn, styles.freeStudyBtn]}
              onPress={() => router.push(`/flashcards/${deck.id}/review?free=true` as any)}
            >
              <Ionicons name="refresh" size={20} color={deckColor} style={{ marginRight: 8 }} />
              <Text style={[styles.studyBtnText, { color: deckColor }]}>Práctica Libre (Repasar todo)</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Cards list header */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Contenido del Mazo</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.addCardBtn, { borderColor: deckColor }]}
            onPress={() => router.push(`/flashcards/${deck.id}/edit` as any)}
          >
            <Ionicons name="add" size={16} color={deckColor} style={{ marginRight: 4 }} />
            <Text style={[styles.addCardBtnText, { color: deckColor }]}>Agregar Carta</Text>
          </TouchableOpacity>
        </View>

        {/* Cards List */}
        {cards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="documents-outline" size={50} color={COLORS.subtle} />
            <Text style={styles.emptyTitle}>Mazo Vacío</Text>
            <Text style={styles.emptySubtitle}>
              Este mazo no tiene tarjetas aún. Agrega una manualmente para comenzar.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.emptyAddBtn, { backgroundColor: deckColor }]}
              onPress={() => router.push(`/flashcards/${deck.id}/edit` as any)}
            >
              <Text style={styles.emptyAddBtnText}>Crear Primera Carta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {cards.map((card) => {
              const isDue = new Date(card.next_due) <= now;
              return (
                <TouchableOpacity
                  key={card.id}
                  activeOpacity={0.8}
                  style={styles.cardItem}
                  onPress={() => router.push(`/flashcards/${deck.id}/edit?cardId=${card.id}` as any)}
                >
                  <View style={styles.cardItemLeft}>
                    <Text style={styles.cardFrontText} numberOfLines={2}>
                      {card.front}
                    </Text>
                    <View style={styles.cardTags}>
                      <View style={styles.cardTag}>
                        <Text style={styles.cardTagText}>Rep: {card.repetitions}</Text>
                      </View>
                      <View style={styles.cardTag}>
                        <Text style={styles.cardTagText}>EF: {card.ease_factor.toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardItemRight}>
                    <Text 
                      style={[
                        styles.cardDueText,
                        isDue ? { color: COLORS.boss, fontFamily: FONTS.headingBold } : {},
                      ]}
                    >
                      {isDue ? 'Pendiente' : formatDate(card.next_due)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.subtle} style={{ marginTop: 4 }} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.canvas,
  },
  errorText: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.ink,
    marginTop: 15,
  },
  errorButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  errorButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base,
    color: COLORS.ink,
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
    fontSize: FONT_SIZE.lg,
    color: COLORS.ink,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerGradient: {
    padding: 24,
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  bannerName: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.white,
    marginBottom: 6,
  },
  bannerDesc: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  aiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xs,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricVal: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.white,
  },
  metricLbl: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionContainer: {
    width: width * 0.9,
    alignSelf: 'center',
    marginTop: 20,
  },
  studyBtn: {
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
  studyBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base + 1,
    color: COLORS.white,
  },
  freeStudyBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: 'transparent', // Will be overlaid by border color logic
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  listHeaderTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.ink,
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
  },
  addCardBtnText: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xs + 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: width * 0.9,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.ink,
    marginTop: 15,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyAddBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyAddBtnText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.sm,
  },
  cardsList: {
    paddingHorizontal: 20,
  },
  cardItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  cardFrontText: {
    fontFamily: FONTS.headingSemi,
    fontSize: FONT_SIZE.base,
    color: COLORS.ink,
    marginBottom: 8,
  },
  cardTags: {
    flexDirection: 'row',
  },
  cardTag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  cardTagText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.muted,
  },
  cardItemRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cardDueText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
  },
});
