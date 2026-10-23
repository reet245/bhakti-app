import { useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { ThemeContext } from '../../App';
import devotionalTheme from '../utils/devotionalTheme.cjs';

// Adapt the existing cream/gold devotional palette to the app's dark tokens.
// Artwork, gold actions, motion, and the original light appearance are preserved.
export default function useDevotionalStyles(baseStyles) {
  const { isDark, theme } = useContext(ThemeContext) || {};
  return useMemo(() => {
    if (!isDark || !theme) return baseStyles;
    return Object.fromEntries(Object.entries(baseStyles).map(([name, value]) => [
      name, devotionalTheme.themeDevotionalStyle(StyleSheet.flatten(value) || {}, theme, name),
    ]));
  }, [baseStyles, isDark, theme]);
}
