import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, FONT_SIZE } from '../../constants/typography';
import { COLORS, darken } from '../../constants/colors';
import type { Deck, Flashcard } from '../../types/db';

const { width } = Dimensions.get('window');

interface DeckCardProps {
  deck: Deck;
  cards: Flashcard[];
  dueCount: number;
}

export default function DeckCard({ deck, cards, dueCount }: DeckCardProps) {
  const totalCards = cards.length;
  
  // Calculate a mock or simple mastery percentage
  // E.g., percentage of cards with repetitions > 2 and ease_factor >= 2.5
  const masteredCards = cards.filter(c => c.repetitions > 2 && c.ease_factor >= 2.4).length;
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  const deckColor = deck.color || '#3B82F6';
  const shadowStyle = {
    shadowColor: deckColor,
  };

  return (
    <Link href={`/flashcards/${deck.id}` as any} asChild>
      <TouchableOpacity activeOpacity={0.9} style={[styles.cardContainer, shadowStyle]}>
        <LinearGradient
          colors={[deckColor, darken(deckColor, 0.25)] as [string, string]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title} numberOfLines={1}>{deck.name}</Text>
              {deck.is_ai_generated && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>🤖 Generado por IA</Text>
                </View>
              )}
            </View>
            
            {dueCount > 0 ? (
              <View style={styles.dueBadge}>
                <Text style={styles.dueBadgeText}>{dueCount} Pendientes</Text>
              </View>
            ) : (
              <View style={styles.doneBadge}>
                <Text style={styles.doneBadgeText}>Al día ✓</Text>
              </View>
            )}
          </View>

          <Text style={styles.description} numberOfLines={2}>
            {deck.description || 'Sin descripción.'}
          </Text>

          <View style={styles.footer}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Cartas</Text>
              <Text style={styles.statValue}>{totalCards}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.stat}>
              <Text style={styles.statLabel}>Dominio</Text>
              <Text style={styles.statValue}>{masteryPercentage}%</Text>
            </View>

            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${Math.max(5, masteryPercentage)}%` }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: width * 0.9,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    padding: 20,
    justifyContent: 'space-between',
    minHeight: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.white,
  },
  aiBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  aiBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.bodyBold,
    fontSize: 9,
  },
  dueBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dueBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xs,
  },
  doneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  doneBadgeText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.xs,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    marginBottom: 16,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 12,
  },
  stat: {
    marginRight: 20,
  },
  statLabel: {
    fontFamily: FONTS.bodyLight,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statValue: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.md,
    color: COLORS.white,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 20,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 3,
  },
});
