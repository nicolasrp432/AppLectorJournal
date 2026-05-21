import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFlashcardStore } from '../../../store/useFlashcardStore';
import { FONTS, FONT_SIZE } from '../../../constants/typography';
import { COLORS, darken } from '../../../constants/colors';

const { width } = Dimensions.get('window');

export default function EditCard() {
  const { deckId, cardId } = useLocalSearchParams<{ deckId: string; cardId?: string }>();
  
  const decks = useFlashcardStore((s) => s.decks);
  const flashcards = useFlashcardStore((s) => s.flashcards);
  const createCard = useFlashcardStore((s) => s.createFlashcard);
  const deleteCard = useFlashcardStore((s) => s.deleteFlashcard);

  const deck = decks.find((d) => d.id === deckId);
  const cards = flashcards[deckId] || [];
  const cardToEdit = cardId ? cards.find((c) => c.id === cardId) : null;

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [hint, setHint] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (cardToEdit) {
      setFront(cardToEdit.front);
      setBack(cardToEdit.back);
      setHint(cardToEdit.hint || '');
    }
  }, [cardToEdit]);

  if (!deck) {
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

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Falta información', 'Por favor ingresa la pregunta y la respuesta.');
      return;
    }

    try {
      setIsSaving(true);
      if (cardToEdit) {
        // Edit mode (Note: standard createFlashcard will update or we can delete and recreate if we want,
        // but let's delete the old one and create a new one to be fully robust without changing too many interfaces)
        await deleteCard(deck.id, cardToEdit.id);
        await createCard(deck.id, front, back, hint);
      } else {
        // Add mode
        await createCard(deck.id, front, back, hint);
      }
      setIsSaving(false);
      router.back();
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo guardar la tarjeta.');
    }
  };

  const handleDelete = () => {
    if (!cardToEdit) return;

    Alert.alert(
      'Eliminar Tarjeta',
      '¿Estás seguro de que deseas eliminar esta tarjeta de estudio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCard(deck.id, cardToEdit.id);
            router.back();
          },
        },
      ]
    );
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
        
        <Text style={styles.headerTitle}>
          {cardToEdit ? 'Editar Tarjeta' : 'Nueva Tarjeta'}
        </Text>
        
        {cardToEdit ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDelete}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.boss} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Pregunta (Frente de la Tarjeta)</Text>
          <TextInput
            value={front}
            onChangeText={setFront}
            placeholder="Escribe la pregunta o concepto clave..."
            placeholderTextColor={COLORS.subtle}
            style={[styles.textInput, styles.textArea]}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.inputLabel}>Respuesta (Detrás de la Tarjeta)</Text>
          <TextInput
            value={back}
            onChangeText={setBack}
            placeholder="Escribe la respuesta detallada o explicación..."
            placeholderTextColor={COLORS.subtle}
            style={[styles.textInput, styles.textArea]}
            multiline
            numberOfLines={6}
          />

          <Text style={styles.inputLabel}>Pista o Contexto (Opcional)</Text>
          <TextInput
            value={hint}
            onChangeText={setHint}
            placeholder="Escribe una pequeña pista para ayudarte..."
            placeholderTextColor={COLORS.subtle}
            style={styles.textInput}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSave}
          style={styles.submitContainer}
        >
          <LinearGradient
            colors={[deckColor, darken(deckColor, 0.25)] as [string, string]}
            style={styles.submitButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.submitButtonText}>
              {cardToEdit ? 'Guardar Cambios' : 'Crear Tarjeta'}
            </Text>
            <Ionicons name="save-outline" size={20} color={COLORS.white} style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
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
    fontSize: FONT_SIZE.xl,
    color: COLORS.ink,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  scrollContent: {
    paddingBottom: 40,
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
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 50,
    overflow: 'hidden',
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
});
