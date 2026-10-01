import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadow } from '../theme';

const DISPLAY_DURATION_MS = 3200;

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(cardFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      onFinish();
    }, DISPLAY_DURATION_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.iconWrap}>
          <Ionicons name="sunny-outline" size={44} color="#fff" />
        </View>
        <Text style={styles.appName}>Manodrishti</Text>
        <Text style={styles.tagline}>मनोदृष्टि · Vision of the Mind</Text>
      </Animated.View>

      <Animated.View style={[styles.fullFormCard, { opacity: cardFade }]}>
        <Text style={styles.fullFormLabel}>WHAT IT STANDS FOR</Text>
        <Text style={styles.fullFormText}>
          <Text style={styles.fullFormLetter}>M</Text>ental{' '}
          <Text style={styles.fullFormLetter}>A</Text>ssessment &{' '}
          <Text style={styles.fullFormLetter}>N</Text>eurocognitive{'\n'}
          <Text style={styles.fullFormLetter}>O</Text>bservation for{' '}
          <Text style={styles.fullFormLetter}>D</Text>epression{' '}
          <Text style={styles.fullFormLetter}>R</Text>ecovery{'\n'}
          <Text style={styles.fullFormLetter}>I</Text>ntelligent{' '}
          <Text style={styles.fullFormLetter}>S</Text>elf-care, {'\n'}
          <Text style={styles.fullFormLetter}>H</Text>ealth{' '}
          <Text style={styles.fullFormLetter}>T</Text>racking &{' '}
          <Text style={styles.fullFormLetter}>I</Text>nsight
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  content: { alignItems: 'center' },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  fullFormCard: {
    position: 'absolute',
    bottom: 64,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  fullFormLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  fullFormText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 21,
  },
  fullFormLetter: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});