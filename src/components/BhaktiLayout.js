import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TOP_PADDING_VARIANTS = {
  title: { scale: 0.04, min: 16, max: 34 },
  compact: { scale: 0.035, min: 14, max: 24 },
  hero: { scale: 0.08, min: 42, max: 58 },
  overlay: { scale: 0.032, min: 12, max: 22 },
};

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getBhaktiTopPadding(width, topInset = 0, variant = 'title', options = {}) {
  const config = TOP_PADDING_VARIANTS[variant] ?? TOP_PADDING_VARIANTS.title;
  const { usesCoreSafeArea = true } = options;
  const responsiveGap = clamp(width * config.scale, config.min, config.max);
  const effectiveTopInset = Platform.select({
    ios: usesCoreSafeArea ? 0 : topInset,
    web: 0,
    default: topInset,
  }) || 0;

  return Math.round(Math.max(0, effectiveTopInset) + responsiveGap);
}

export function useBhaktiTopPadding(width, variant = 'title', options) {
  const insets = useSafeAreaInsets();
  return getBhaktiTopPadding(width, insets.top, variant, options);
}
