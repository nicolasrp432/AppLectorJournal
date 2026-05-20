import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, StyleSheet, Modal, ScrollView,
  Platform, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStore } from '../../store/useSubscriptionStore';
import * as haptics from '../../lib/haptics';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dynamically import react-native-purchases-ui to prevent web/simulator build crashes
let NativePaywall: any = null;
if (Platform.OS !== 'web') {
  try {
    NativePaywall = require('react-native-purchases-ui').default;
  } catch (e) {
    console.warn('[PremiumPaywall] Native RevenueCat Paywall UI is not available in this shell.');
  }
}

interface PremiumPaywallProps {
  visible: boolean;
  onClose: () => void;
}

export function PremiumPaywall({ visible, onClose }: PremiumPaywallProps) {
  const { isPremium, isLoading, offerings, fetchOfferings, purchase, restore } = useSubscriptionStore();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('yearly');
  const [useNative, setUseNative] = useState<boolean>(Platform.OS !== 'web' && !!NativePaywall);
  const [localLoading, setLocalLoading] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchOfferings().catch(err => console.warn('Could not fetch offerings:', err));
    }
  }, [visible]);

  // Handle plan purchase
  const handlePurchase = async () => {
    haptics.medium();
    const plan = offerings.find(o => o.id === selectedPlanId);
    if (!plan) {
      Alert.alert('Error', 'Selecciona un plan válido para continuar.');
      return;
    }

    setLocalLoading(true);
    try {
      const success = await purchase(plan);
      if (success) {
        haptics.success();
        if (Platform.OS === 'web') {
          alert('¡Bienvenido a LectorApp Pro! Tu suscripción simulada ha sido activada con éxito.');
        } else {
          Alert.alert('¡Éxito!', '¡Bienvenido a LectorApp Pro! Tu suscripción ha sido activada con éxito.');
        }
        onClose();
      } else {
        haptics.error();
        if (Platform.OS === 'web') {
          alert('No se pudo completar la compra. Por favor, intenta de nuevo.');
        } else {
          Alert.alert('Compra cancelada', 'No se pudo completar el pago. Por favor, intenta de nuevo.');
        }
      }
    } catch (e) {
      haptics.error();
      console.error('Purchase error:', e);
    } finally {
      setLocalLoading(false);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    haptics.tap();
    setLocalLoading(true);
    try {
      const success = await restore();
      if (success) {
        haptics.success();
        if (Platform.OS === 'web') {
          alert('¡Suscripción Pro restaurada con éxito!');
        } else {
          Alert.alert('Restaurado', '¡Suscripción Pro restaurada con éxito!');
        }
        onClose();
      } else {
        haptics.warning();
        if (Platform.OS === 'web') {
          alert('No encontramos ninguna suscripción Pro activa asociada a tu cuenta.');
        } else {
          Alert.alert('Sin Suscripciones', 'No encontramos ninguna suscripción Pro activa asociada a tu cuenta.');
        }
      }
    } catch (e) {
      haptics.error();
      console.error('Restore error:', e);
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Render Native Paywall if desired & available */}
        {useNative && NativePaywall ? (
          <View style={{ flex: 1 }}>
            <NativePaywall
              onPurchaseCompleted={(customerInfo: any) => {
                haptics.success();
                useSubscriptionStore.getState().checkSubscription();
                Alert.alert('¡Completado!', 'Gracias por apoyar a LectorApp.');
                onClose();
              }}
              onPurchaseError={(error: any) => {
                haptics.error();
                console.warn('Native purchase error:', error);
                if (error?.userCancelled) return;
                Alert.alert('Error', 'La compra no se pudo completar. ¿Deseas probar en modo Simulación?', [
                  { text: 'Probar Simulación', onPress: () => setUseNative(false) },
                  { text: 'Cancelar', style: 'cancel' }
                ]);
              }}
            />
            {/* Native Paywall fallback / switch button */}
            <Pressable
              style={styles.nativeSwitchBtn}
              onPress={() => {
                haptics.tap();
                setUseNative(false);
              }}
            >
              <Ionicons name="construct-outline" size={14} color="#94A3B8" />
              <Text style={styles.nativeSwitchTxt}>Cambiar a Modo Simulado</Text>
            </Pressable>

            {/* Absolute Back Button */}
            <Pressable style={styles.backBtnAbsolute} onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#94A3B8" />
            </Pressable>
          </View>
        ) : (
          /* HIGH-END GLASSMORPHIC CUSTOM SIMULATION UI */
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Background elements */}
            <View style={[styles.bgCircle, { width: 300, height: 300, top: -50, right: -100, backgroundColor: 'rgba(217, 119, 6, 0.15)' }]} />
            <View style={[styles.bgCircle, { width: 250, height: 250, top: 200, left: -100, backgroundColor: 'rgba(16, 185, 129, 0.12)' }]} />

            {/* Header / Dismiss */}
            <View style={styles.header}>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.ink} />
              </Pressable>
              {Platform.OS !== 'web' && NativePaywall && (
                <Pressable
                  style={styles.simulatorIndicator}
                  onPress={() => {
                    haptics.tap();
                    setUseNative(true);
                  }}
                >
                  <Ionicons name="card" size={14} color="#D97706" />
                  <Text style={styles.simulatorIndicatorText}>Usar Pasarela Nativa</Text>
                </Pressable>
              )}
            </View>

            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.sparkleWrap}>
                <Ionicons name="sparkles" size={36} color="#D97706" />
              </View>
              <Text style={styles.proTitle}>LectorApp Pro</Text>
              <Text style={styles.proSubtitle}>Desbloquea el potencial ilimitado de tu cerebro</Text>
            </View>

            {/* Value Props Grid */}
            <View style={styles.featureGrid}>
              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
                  <Ionicons name="infinite" size={20} color="#D97706" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Sesiones Diarias Ilimitadas</Text>
                  <Text style={styles.featureDesc}>Entrena todo el tiempo que quieras sin límites de 3 sesiones diarias.</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="book" size={20} color="#10B981" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Importa Libros y Textos Propios</Text>
                  <Text style={styles.featureDesc}>Sube PDFs o textos ilimitados y entrénalos con el lector dinámico.</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <Ionicons name="stats-chart" size={20} color="#3B82F6" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Métricas Cognitivas Avanzadas</Text>
                  <Text style={styles.featureDesc}>Gráficos interactivos de comprensión, racha y velocidad de lectura.</Text>
                </View>
              </View>

              <View style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <Ionicons name="settings" size={20} color="#8B5CF6" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Configuraciones Exclusivas</Text>
                  <Text style={styles.featureDesc}>Accede al modo de enfoque dinámico y temas exclusivos en la tienda.</Text>
                </View>
              </View>
            </View>

            {/* Pricing Offerings */}
            <Text style={styles.sectionTitle}>Elige tu plan de entrenamiento</Text>
            <View style={styles.pricingList}>
              {offerings.map(pkg => {
                const isSelected = selectedPlanId === pkg.id;
                const isYearly = pkg.id === 'yearly';
                const isLifetime = pkg.id === 'lifetime';

                return (
                  <Pressable
                    key={pkg.id}
                    style={[
                      styles.pricingCard,
                      isSelected && styles.pricingCardSelected,
                      isYearly && isSelected && styles.pricingCardYearly,
                    ]}
                    onPress={() => {
                      haptics.tap();
                      setSelectedPlanId(pkg.id);
                    }}
                  >
                    {isYearly && (
                      <View style={styles.yearlyTag}>
                        <Text style={styles.yearlyTagText}>MÁS ELEGIDO</Text>
                      </View>
                    )}
                    {isLifetime && (
                      <View style={[styles.yearlyTag, { backgroundColor: '#8B5CF6' }]}>
                        <Text style={styles.yearlyTagText}>PAGO ÚNICO</Text>
                      </View>
                    )}

                    <View style={styles.pricingRow}>
                      <View style={styles.radioBox}>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleChecked]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pricingTitle}>{pkg.title}</Text>
                        <Text style={styles.pricingDesc}>{pkg.description}</Text>
                      </View>
                      <View style={styles.priceColumn}>
                        <Text style={[styles.priceString, isSelected && styles.priceStringSelected]}>
                          {pkg.priceString}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Action CTA */}
            <View style={styles.ctaWrapper}>
              <Pressable
                style={[styles.ctaButton, (isLoading || localLoading) && styles.ctaButtonDisabled]}
                onPress={handlePurchase}
                disabled={isLoading || localLoading}
              >
                {isLoading || localLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color="#fff" />
                    <Text style={styles.ctaButtonText}>Activar Acceso Premium</Text>
                  </>
                )}
              </Pressable>

              {/* Restore Purchases */}
              <Pressable
                style={styles.restoreBtn}
                onPress={handleRestore}
                disabled={isLoading || localLoading}
              >
                <Text style={styles.restoreBtnText}>Restaurar Compras Previas</Text>
              </Pressable>

              {/* Security Footer */}
              <Text style={styles.securityFooter}>
                Esta compra es completamente segura. Al presionar "Activar Acceso Premium" en modo simulación, desbloquearás todas las características de forma local de inmediato. Las transacciones de la App Store/Google Play se gestionan de forma segura a través de RevenueCat SDK.
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFDFB',
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  bgCircle: {
    position: 'absolute',
    borderRadius: 9999,
    zIndex: -1,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.15)',
  },
  simulatorIndicatorText: {
    fontFamily: FONTS.bodyBold || 'System',
    fontSize: 11,
    color: '#D97706',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  sparkleWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  proTitle: {
    fontFamily: FONTS.heading || 'System',
    fontSize: 32,
    color: COLORS.ink,
  },
  proSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
  featureGrid: {
    marginVertical: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 20,
  },
  featureIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 14,
    color: COLORS.ink,
  },
  featureDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: 14,
  },
  pricingList: {
    gap: 14,
    marginBottom: 28,
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  pricingCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.01)',
  },
  pricingCardYearly: {
    borderColor: '#D97706',
    backgroundColor: 'rgba(217, 119, 6, 0.01)',
  },
  yearlyTag: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#D97706',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  yearlyTagText: {
    fontFamily: FONTS.headingBold || 'System',
    fontSize: 8,
    color: '#fff',
    letterSpacing: 0.6,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  radioCircleChecked: {
    backgroundColor: '#10B981',
  },
  pricingTitle: {
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 15,
    color: COLORS.ink,
  },
  pricingDesc: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  priceColumn: {
    alignItems: 'flex-end',
  },
  priceString: {
    fontFamily: FONTS.headingBold || 'System',
    fontSize: 14,
    color: COLORS.muted,
  },
  priceStringSelected: {
    color: COLORS.ink,
  },
  ctaWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  ctaButton: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.focus,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.focus,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontFamily: FONTS.headingSemi || 'System',
    fontSize: 15,
    color: '#fff',
  },
  restoreBtn: {
    paddingVertical: 8,
  },
  restoreBtnText: {
    fontFamily: FONTS.bodyBold || 'System',
    fontSize: 13,
    color: COLORS.muted,
  },
  securityFooter: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  // Native absolute back / controls
  backBtnAbsolute: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 99,
  },
  nativeSwitchBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 99,
  },
  nativeSwitchTxt: {
    fontFamily: FONTS.bodyBold || 'System',
    fontSize: 11,
    color: '#64748B',
  },
});
