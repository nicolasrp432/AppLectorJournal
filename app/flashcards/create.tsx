import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFlashcardStore } from '../../store/useFlashcardStore';
import { FONTS, FONT_SIZE } from '../../constants/typography';
import { COLORS } from '../../constants/colors';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

const { width } = Dimensions.get('window');

const COLOR_PRESETS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
];

export default function CreateDeck() {
  const createDeck = useFlashcardStore((s) => s.createDeck);
  const createCard = useFlashcardStore((s) => s.createFlashcard);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  
  // AI mode fields
  const [sourceText, setSourceText] = useState('');
  const [cardCount, setCardCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Falta información', 'Por favor ingresa un nombre para el mazo.');
      return;
    }

    try {
      setIsGenerating(true);

      if (mode === 'manual') {
        const newDeck = await createDeck(name, description, selectedColor, false);
        if (newDeck) {
          router.replace(`/flashcards/${newDeck.id}` as any);
        }
      } else {
        // AI Generation Mode
        if (!sourceText.trim() || sourceText.length < 50) {
          Alert.alert(
            'Texto insuficiente',
            'Por favor ingresa al menos 50 caracteres del tema para que la IA pueda extraer conceptos útiles.'
          );
          setIsGenerating(false);
          return;
        }

        // Create the deck first
        const newDeck = await createDeck(
          name,
          description || 'Generado automáticamente por Inteligencia Artificial.',
          selectedColor,
          true
        );

        if (newDeck) {
          try {
            const { data, error } = await invokeEdgeFunction<{ flashcards: any[] }>('ai-flashcards', {
              text: sourceText,
            });

            if (error || !data || !data.flashcards) {
              throw new Error(error?.message || 'Error al generar tarjetas');
            }

            const cards = data.flashcards;
            for (const card of cards) {
              await createCard(newDeck.id, card.front, card.back, card.hint || '');
            }

            setIsGenerating(false);
            router.replace(`/flashcards/${newDeck.id}` as any);
          } catch (err: any) {
            console.warn('Gemini extraction failed, using fallback:', err);
            // Smart local parser: splits by key paragraphs or common punctuation to form logical question/answers
            const sentences = sourceText
              .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
              .split("|")
              .map((s) => s.trim())
              .filter((s) => s.length > 20);

            const cardsToCreate = Math.min(cardCount, Math.ceil(sentences.length / 2));
            
            if (cardsToCreate > 0) {
              for (let i = 0; i < cardsToCreate; i++) {
                const front = `¿Qué concepto se describe como: "${sentences[i * 2]?.substring(0, 80)}..."?`;
                const back = sentences[i * 2 + 1] || sentences[i * 2] || 'Concepto clave extraído del material de lectura.';
                const hint = 'Información del texto original';
                await createCard(newDeck.id, front, back, hint);
              }
            } else {
              // If it's short, just add default cards based on the name
              await createCard(
                newDeck.id,
                `¿Cuál es el concepto principal de ${name}?`,
                `Es la idea central y fundamental explicada en el texto base.`,
                'Concepto general'
              );
            }

            setIsGenerating(false);
            router.replace(`/flashcards/${newDeck.id}` as any);
          }
        }
      }
    } catch (error) {
      setIsGenerating(false);
      Alert.alert('Error', 'Ocurrió un error al crear el mazo.');
    }
  };

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
        <Text style={styles.headerTitle}>Crear Mazo</Text>
        <View style={{ width: 40 }} />
      </View>

      {isGenerating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>
            {mode === 'ai' ? '🤖 La IA está analizando tu texto y creando las flashcards...' : 'Creando mazo...'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Mode Selector */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('manual')}
              style={[styles.modeTab, mode === 'manual' && styles.activeTab]}
            >
              <Ionicons 
                name="create-outline" 
                size={18} 
                color={mode === 'manual' ? '#8B5CF6' : COLORS.muted} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.modeTabText, mode === 'manual' && styles.activeTabText]}>
                Manual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setMode('ai')}
              style={[styles.modeTab, mode === 'ai' && styles.activeTab]}
            >
              <Ionicons 
                name="sparkles-outline" 
                size={18} 
                color={mode === 'ai' ? '#8B5CF6' : COLORS.muted} 
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.modeTabText, mode === 'ai' && styles.activeTabText]}>
                Generar con IA
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>Nombre del Mazo</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej: Neurociencia Básica, Vocabulario..."
              placeholderTextColor={COLORS.subtle}
              style={styles.textInput}
            />

            <Text style={styles.inputLabel}>Descripción (Opcional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe qué vas a estudiar en este mazo..."
              placeholderTextColor={COLORS.subtle}
              style={[styles.textInput, styles.textArea]}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Color de Identidad</Text>
            <View style={styles.colorRow}>
              {COLOR_PRESETS.map((color) => (
                <TouchableOpacity
                  key={color}
                  activeOpacity={0.8}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorCircle,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* AI Generator Fields */}
          {mode === 'ai' && (
            <View style={styles.formCard}>
              <View style={styles.aiTitleContainer}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" style={{ marginRight: 6 }} />
                <Text style={styles.aiSectionTitle}>Crea Flashcards desde un texto</Text>
              </View>
              <Text style={styles.aiInstructions}>
                Pega un artículo, apuntes o apuntes de libros y nuestra Inteligencia Artificial generará tarjetas de estudio de forma automática.
              </Text>

              <Text style={styles.inputLabel}>Texto Fuente</Text>
              <TextInput
                value={sourceText}
                onChangeText={setSourceText}
                placeholder="Pega aquí el contenido a estudiar (min. 50 caracteres)..."
                placeholderTextColor={COLORS.subtle}
                style={[styles.textInput, styles.sourceTextArea]}
                multiline
                numberOfLines={8}
              />

              <Text style={styles.inputLabel}>Cantidad de tarjetas: {cardCount}</Text>
              <View style={styles.sliderMock}>
                {[5, 10, 15].map((num) => (
                  <TouchableOpacity
                    key={num}
                    activeOpacity={0.8}
                    onPress={() => setCardCount(num)}
                    style={[
                      styles.cardCountBtn,
                      cardCount === num && styles.activeCardCountBtn,
                    ]}
                  >
                    <Text 
                      style={[
                        styles.cardCountText, 
                        cardCount === num && styles.activeCardCountText
                      ]}
                    >
                      {num} Tarjetas
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleCreate}
            style={styles.submitContainer}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899'] as [string, string]}
              style={styles.submitButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.submitButtonText}>
                {mode === 'ai' ? 'Generar Mazo con IA' : 'Crear Mazo'}
              </Text>
              <Ionicons 
                name={mode === 'ai' ? "sparkles" : "checkmark-circle"} 
                size={20} 
                color={COLORS.white} 
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
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
  scrollContent: {
    paddingBottom: 40,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  modeTabText: {
    fontFamily: FONTS.headingSemi,
    fontSize: FONT_SIZE.sm,
    color: COLORS.muted,
  },
  activeTabText: {
    color: '#8B5CF6',
  },
  formCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.inkLight,
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: COLORS.canvas,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: FONT_SIZE.base,
    color: COLORS.ink,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.body,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sourceTextArea: {
    height: 160,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColorCircle: {
    borderColor: COLORS.border,
    transform: [{ scale: 1.15 }],
  },
  aiTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiSectionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base,
    color: '#8B5CF6',
  },
  aiInstructions: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.muted,
    lineHeight: 18,
    marginBottom: 16,
  },
  sliderMock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardCountBtn: {
    flex: 1,
    backgroundColor: COLORS.canvas,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeCardCountBtn: {
    backgroundColor: '#8B5CF615',
    borderColor: '#8B5CF6',
  },
  cardCountText: {
    fontFamily: FONTS.headingSemi,
    fontSize: FONT_SIZE.xs + 1,
    color: COLORS.muted,
  },
  activeCardCountText: {
    color: '#8B5CF6',
  },
  submitContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.headingBold,
    fontSize: FONT_SIZE.base + 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.md,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
});
