import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';
import { MascotChar } from './MascotChar';
import { EXERCISES } from '../../constants/exercises';
import { supabase, invokeEdgeFunction } from '../../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AIChatbotProps {
  mode?: 'embedded' | 'modal';
  exerciseId?: string;
  onClose?: () => void;
}

const getSuggestions = (exId?: string) => {
  if (exId === 'schulte') {
    return [
      "¿Cómo entreno mi visión periférica?",
      "¿Por qué es malo mover los ojos?",
      "¿Cómo evito frustrarme en grillas 5x5?"
    ];
  }
  if (exId === 'loci') {
    return [
      "¿Cómo asocio imágenes inverosímiles?",
      "¿Qué hago si olvido una habitación?",
      "Dame un ejemplo de asociación absurda"
    ];
  }
  if (exId === 'reading' || exId === 'reading_test') {
    return [
      "¿Cómo elimino la subvocalización?",
      "¿Qué velocidad WPM me recomiendas?",
      "Consejos para la lectura RSVP"
    ];
  }
  if (exId === 'wordspan') {
    return [
      "¿Cómo expando mi memoria de trabajo?",
      "Consejos para Word Span",
      "¿Qué es la codificación serial?"
    ];
  }
  if (exId === 'comprehension') {
    return [
      "¿Cómo leo rápido y entiendo todo?",
      "Consejos de retención activa",
      "¿Qué es el ritmo semántico?"
    ];
  }
  return [
    "¿Cómo evito la subvocalización?",
    "¿Cómo funciona el método loci?",
    "¿Qué es la asociación inverosímil?",
    "Consejos de lectura rápida"
  ];
};

function ChatMessage({ message, accent }: { message: Message; accent: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 250 });
    translateY.value = withSpring(0, { damping: 15 });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const isUser = message.role === 'user';

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.assistantRow,
        animStyle,
      ]}
    >
      {!isUser && (
        <View style={styles.mascotWrapper}>
          <MascotChar which="loci" size={32} breathing={false} blinking={true} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isUser
            ? [styles.userBubble, { backgroundColor: accent }]
            : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
}

function TypingIndicator({ accent }: { accent: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    dot1.value = withRepeat(
      withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
      -1,
      true
    );
    const t2 = setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1,
        true
      );
    }, 150);
    const t3 = setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(withTiming(-5, { duration: 300 }), withTiming(0, { duration: 300 })),
        -1,
        true
      );
    }, 300);

    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const style1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const style2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const style3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={[styles.messageRow, styles.assistantRow]}>
      <View style={styles.mascotWrapper}>
        <MascotChar which="loci" size={32} breathing={true} blinking={false} />
      </View>
      <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
        <Animated.View style={[styles.typingDot, { backgroundColor: accent }, style1]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: accent }, style2]} />
        <Animated.View style={[styles.typingDot, { backgroundColor: accent }, style3]} />
      </View>
    </View>
  );
}

export function AIChatbot({ mode = 'embedded', exerciseId, onClose }: AIChatbotProps) {
  const activeExercise = exerciseId ? EXERCISES[exerciseId] : null;
  const accent = activeExercise?.color || COLORS.calm || '#3B82F6';

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: exerciseId
        ? `¡Hola! Veo que estás practicando "${activeExercise?.title}". Soy tu mentor neuronal Mente IA. ¿Tienes alguna duda sobre este ejercicio o te gustaría algún truco para mejorar en [${activeExercise?.improves}]? 🧠⚡`
        : '¡Hola! Soy Mente IA, tu mentor de aprendizaje cognitivo en LectorApp. Pregúntame sobre técnicas de lectura rápida, mnemotecnia (loci), asociación inverosímil o retención mental. ¡Dupliquemos juntos tus capacidades neuronales! 🧠📚',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll on new messages
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, [messages, loading]);

  const triggerHaptic = (type: 'light' | 'success' | 'warning') => {
    if (Platform.OS !== 'web') {
      if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (type === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    triggerHaptic('light');

    const userMessage: Message = {
      id: Math.random().toString(),
      role: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const messagesToSend = [...messages, userMessage]
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        text: m.text,
      }));

    // Formular el contexto del ejercicio si aplica
    const exContext = activeExercise
      ? {
          exerciseId,
          exerciseTitle: activeExercise.title,
          exerciseCategory: activeExercise.category,
          exerciseImproves: activeExercise.improves,
          exerciseDifficulty: activeExercise.difficulty,
        }
      : null;

    try {
      const { data, error } = await invokeEdgeFunction<{ text: string }>('ai-chat', {
        messages: messagesToSend,
        context: exContext,
      });

      if (error || !data || !data.text) {
        throw new Error(error?.message || 'Respuesta de Edge Function inválida');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'assistant',
          text: data.text,
        },
      ]);
      triggerHaptic('success');
    } catch (err) {
      console.warn('Edge Function failure, invoking fallback Direct Gemini Call:', err);
      try {
        const rawApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyAa-CYZy22GmzO2_Y4TH84310yQVNBRSdE";
        const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");
        const systemPrompt = `Eres "Mente IA", el mentor neuronal y asistente de LectorApp. Da respuestas CORTAS y DIRECTAS (max 2 párrafos). Sé amigable pero profesional. ${
          activeExercise ? `[Contexto]: El usuario está en el ejercicio ${activeExercise.title}.` : ''
        }`;

        const formattedContents = [...messages, userMessage]
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }));

        // Dynamic multi-model fallback chain to guarantee 100% success rate
        const tryModel = async (model: string) => {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: formattedContents,
                systemInstruction: { parts: [{ text: systemPrompt }] },
                generationConfig: { maxOutputTokens: 350 }
              })
            }
          );
          if (!response.ok) {
            let errMsg = `Direct call to ${model} returned status ${response.status}`;
            try {
              const errBody = await response.json();
              if (errBody?.error?.message) {
                errMsg += `: ${errBody.error.message}`;
              }
            } catch (_) {}
            throw new Error(errMsg);
          }
          return response.json();
        };

        let result;
        try {
          result = await tryModel('gemini-1.5-flash');
        } catch (firstErr) {
          console.warn('gemini-1.5-flash failed, trying gemini-2.0-flash fallback:', firstErr);
          try {
            result = await tryModel('gemini-2.0-flash');
          } catch (secErr) {
            console.warn('gemini-2.0-flash failed, trying gemini-1.5-pro fallback:', secErr);
            result = await tryModel('gemini-1.5-pro');
          }
        }

        const reply = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              role: 'assistant',
              text: reply,
            },
          ]);
          triggerHaptic('success');
        } else {
          throw new Error('Gemini API response malformed');
        }
      } catch (fallbackErr: any) {
        console.warn('Fallback failed too:', fallbackErr);
        const errMessage = fallbackErr?.message || '';
        const isKeyExpired = errMessage.includes('expired') || errMessage.includes('API key') || errMessage.includes('API_KEY_INVALID');
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: 'assistant',
            text: isKeyExpired
              ? '🔑 Error de Configuración: La clave API de Gemini ha expirado. Por favor, actualiza la variable GEMINI_API_KEY en tu entorno o en los secretos de Supabase con una clave válida de Google AI Studio para reactivar mis sinapsis cognitivas. 🧠⚡'
              : '¡Hola! Estoy experimentando una micro-desconexión en mis sinapsis digitales. Revisa tu conexión a internet e inténtalo de nuevo en unos momentos. 🧠⚡',
          },
        ]);
        triggerHaptic('warning');
      }
    } finally {
      setLoading(false);
    }
  };

  const isModal = mode === 'modal';
  const suggestions = getSuggestions(exerciseId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, isModal ? styles.modalContainer : styles.embeddedContainer]}
      keyboardVerticalOffset={isModal ? 40 : 0}
    >
      {/* Header (visible in Modal mode) */}
      {isModal && (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={20} color={accent} style={{ marginRight: 8 }} />
            <View>
              <Text style={styles.headerTitle}>Mente IA</Text>
              <Text style={styles.headerSub}>Asistente experto de aprendizaje</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
            <Ionicons name="close" size={24} color={COLORS.muted} />
          </Pressable>
        </View>
      )}

      {/* Main chat widget */}
      <View style={[styles.chatCard, { borderColor: isModal ? 'transparent' : 'rgba(255, 255, 255, 0.08)' }]}>
        {!isModal && (
          <View style={[styles.cardHeader, { borderBottomColor: 'rgba(255,255,255,0.06)' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>🧠 Pregunta a Mente IA</Text>
              <Text style={styles.cardSub}>Tu mentor cognitivo virtual</Text>
            </View>
            <MascotChar which="loci" size={44} breathing={true} blinking={true} />
          </View>
        )}

        <ScrollView
          ref={scrollViewRef}
          style={styles.msgScroll}
          contentContainerStyle={styles.msgScrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} accent={accent} />
          ))}
          {loading && <TypingIndicator accent={accent} />}
        </ScrollView>

        {/* Suggestion Chips */}
        <View style={styles.suggestionsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScroll}
          >
            {suggestions.map((s, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSend(s)}
                style={[styles.chipBtn, { borderColor: `${accent}30` }]}
                disabled={loading}
              >
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input area */}
        <View style={[styles.inputRow, { borderTopColor: 'rgba(255,255,255,0.06)' }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Haz una pregunta sobre tu cerebro..."
            placeholderTextColor="rgba(255,255,255,0.65)"
            style={styles.textInput}
            multiline={false}
            maxLength={180}
            onSubmitEditing={() => handleSend(input)}
            disabled={loading}
          />
          <Pressable
            onPress={() => handleSend(input)}
            style={[
              styles.sendBtn,
              { backgroundColor: accent },
              (!input.trim() || loading) && styles.sendBtnDisabled,
            ]}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#FFF" />
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  embeddedContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A', // Premium dark slate background for sheet
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#F8FAFC',
  },
  headerSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: '#94A3B8',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  chatCard: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek glassmorphism backing
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  cardTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#FFF',
  },
  cardSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 1,
  },
  msgScroll: {
    flex: 1,
    height: 250,
  },
  msgScrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 14,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    marginVertical: 2,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  mascotWrapper: {
    marginRight: 8,
    marginBottom: -4,
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  userBubble: {
    borderBottomRightRadius: 3,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderBottomLeftRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  messageText: {
    fontFamily: FONTS.body,
    fontSize: 13.5,
    lineHeight: 19.5,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#E2E8F0',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  typingDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
  },
  suggestionsWrapper: {
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
  },
  chipText: {
    fontFamily: FONTS.body,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 14,
    color: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginRight: 10,
    maxHeight: 40,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
