import { ImageBackground, StyleSheet, View } from 'react-native';
import useDevotionalStyles from '../hooks/useDevotionalStyles';

const DEVOTIONAL_BACKGROUND_IMAGE = require('../../assets/horoscope/background/horoscope-bg.png');
const DEVOTIONAL_BACKGROUND_FALLBACK = '#FFF7E6';
const DEVOTIONAL_BACKGROUND_OVERLAY = 'rgba(255, 247, 228, 0.68)';

export default function DevotionalBackground({ children, overlayStyle, style }) {
  const styles = useDevotionalStyles(baseStyles);
  return (
    <ImageBackground
      source={DEVOTIONAL_BACKGROUND_IMAGE}
      style={[styles.background, style]}
      resizeMode="cover"
    >
      <View pointerEvents="none" style={[styles.overlay, overlayStyle]} />
      {children}
    </ImageBackground>
  );
}

const baseStyles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: DEVOTIONAL_BACKGROUND_FALLBACK,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DEVOTIONAL_BACKGROUND_OVERLAY,
  },
});
