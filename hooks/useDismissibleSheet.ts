import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SPRING, TIMING } from '../constants/motion';

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Un bottom sheet que se puede agarrar.
 *
 * POR QUÉ EXISTE
 * --------------
 * La app tenía seis sheets y ninguno se podía arrastrar: todos entraban con una
 * animación y solo se cerraban por un botón. Eso deja fuera el gesto que
 * cualquiera prueba primero en un sheet — tirar de él hacia abajo — y hace que
 * la superficie se lea como una imagen y no como un objeto.
 *
 * Este hook concentra las tres cosas que separan un sheet que "va bien" de uno
 * que se siente físico, y que son fáciles de olvidar cuando se escriben seis
 * veces por separado:
 *
 *  1. HISTÉRESIS. El sheet no se mueve hasta que el dedo ha recorrido 10px
 *     hacia abajo. Sin esto, cualquier roce mientras se lee lo arrastra.
 *
 *  2. GOMA EN EL BORDE. Al tirar hacia arriba el sheet cede solo un 15%, en vez
 *     de quedarse clavado. Un tope duro se lee como "se ha colgado"; una
 *     resistencia que crece se lee como "aquí no hay más".
 *
 *  3. PROYECCIÓN DE INERCIA. Al soltar no se mira dónde está el sheet, sino
 *     dónde ACABARÍA con la velocidad que lleva, usando la misma fórmula de
 *     deceleración exponencial que el scroll del sistema. Por eso un
 *     lanzamiento corto pero rápido cierra, y un arrastre largo y lento no.
 *     Después esa misma velocidad entra en el muelle, así que no hay costura
 *     entre el dedo arrastrando y la animación terminando el trabajo.
 *
 * Todo corre en el hilo de UI, así que el sheet sigue al dedo aunque el hilo de
 * JS esté ocupado, y se puede agarrar de nuevo a media animación de cierre.
 *
 * USO
 * ---
 *   const sheet = useDismissibleSheet({ visible, onDismiss: onClose });
 *
 *   <GestureDetector gesture={sheet.gesture}>
 *     <View style={styles.dragZone}><View style={styles.handle} /></View>
 *   </GestureDetector>
 *   <Animated.View style={[styles.sheet, sheet.style]}>…</Animated.View>
 *
 * `close()` es la salida programática (la X, un botón): anima y luego avisa.
 */
export function useDismissibleSheet({
  visible = true,
  onDismiss,
  height = SCREEN_HEIGHT,
}: {
  /** Mientras sea false el sheet se queda fuera de pantalla. */
  visible?: boolean;
  /** Se llama cuando el sheet ya ha terminado de salir, no al empezar. */
  onDismiss: () => void;
  /** Distancia que recorre al salir. Por defecto, el alto de la pantalla. */
  height?: number;
}) {
  const translateY = useSharedValue(height);

  // Se guarda en una ref para que el gesto no haya que reconstruirlo cada vez
  // que el padre re-renderiza con un onDismiss nuevo.
  const onDismissRef = React.useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const dismiss = React.useCallback(() => onDismissRef.current(), []);

  React.useEffect(() => {
    translateY.value = visible ? withSpring(0, SPRING.sheet) : height;
  }, [visible, height, translateY]);

  const close = React.useCallback(() => {
    translateY.value = withTiming(height, TIMING.exit, finished => {
      if (finished) scheduleOnRN(dismiss);
    });
  }, [dismiss, height, translateY]);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(10)
        .onUpdate(e => {
          'worklet';
          translateY.value = e.translationY > 0 ? e.translationY : e.translationY * 0.15;
        })
        .onEnd(e => {
          'worklet';
          // Deceleración exponencial, la misma que usa el scroll del sistema.
          // No es la fórmula de libro v²/(2·a): es la que se comporta como el
          // resto de la plataforma, que es lo que el dedo espera.
          const projected = translateY.value + (e.velocityY / 1000) * 0.998 / (1 - 0.998);
          if (projected > height * 0.25) {
            translateY.value = withSpring(
              height,
              { ...SPRING.sheet, velocity: e.velocityY },
              finished => { if (finished) scheduleOnRN(dismiss); },
            );
          } else {
            translateY.value = withSpring(0, { ...SPRING.sheet, velocity: e.velocityY });
          }
        }),
    [dismiss, height, translateY],
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return { translateY, style, gesture, close };
}
