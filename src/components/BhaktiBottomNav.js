import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import useDevotionalStyles from '../hooks/useDevotionalStyles';
import { useLanguage } from '../context/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const COLORS = {
  cardCream: 'rgba(255, 247, 227, 0.98)',
  cardGoldLight: '#EFD487',
  textDark: '#2B2115',
  textMuted: '#725C38',
  borderGold: 'rgba(201, 148, 22, 0.22)',
  shadow: '#8A5A10',
};

const ICONS = {
  calendar: require('../../assets/icon/calender.png'),
  horoscope: require('../../assets/horoscope/zodiac/aries.png'),
  kundli: require('../../assets/icon/kundli.png'),
  mantras: require('../../assets/icon/mantras.png'),
  puja: require('../../assets/icon/puja.png'),
};

const BOTTOM_NAV_ITEMS = [
  { id: 'Puja', label: 'Puja', screen: 'Puja', image: ICONS.puja },
  { id: 'Calendar', label: 'Calendar', screen: 'Calendar', image: ICONS.calendar },
  { id: 'Mantras', label: 'Mantras', screen: 'Mantras', image: ICONS.mantras },
  { id: 'Horoscope', label: 'Horoscope', screen: 'DailyHoroscope', image: ICONS.horoscope },
  { id: 'Kundli', label: 'Kundli', screen: 'Kundli', image: ICONS.kundli },
];

export function getBhaktiBottomNavHeight(height) {
  return Math.max(70, Math.min(82, height * 0.092));
}

export function getBhaktiBottomNavBottomPadding(height) {
  return Math.max(8, height * 0.012);
}

export function getBhaktiBottomNavContentPadding(height, extraPadding = 24) {
  return getBhaktiBottomNavHeight(height) + getBhaktiBottomNavBottomPadding(height) + extraPadding;
}

export default function BhaktiBottomNav({ activeTab, horizontalPadding, iconStyle, labelStyle, navigation, selectedItemStyle, style, surfaceStyle }) {
  const styles = useDevotionalStyles(baseStyles);
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const labels = currentLanguage === 'hi' ? { Puja: 'पूजा', Calendar: 'पंचांग', Mantras: 'मंत्र', Horoscope: 'राशिफल', Kundli: 'कुंडली' } : {};
  const { width, height } = useWindowDimensions();
  const compactWidth = Math.min(width, 520);
  const navHorizontalPadding = horizontalPadding ?? Math.max(14, Math.min(20, compactWidth * 0.045));
  const iconSize = width < 360 ? 18 : 20;
  const labelSize = width < 360 ? 8.5 : 9;
  const itemHeight = width < 360 ? 48 : 50;

  return (
    <View
      style={[
        styles.bottomNav,
        {
          minHeight: getBhaktiBottomNavHeight(height),
          paddingHorizontal: navHorizontalPadding,
          paddingBottom: Math.max(getBhaktiBottomNavBottomPadding(height), insets.bottom + 6),
        },
        style,
      ]}
    >
      <View style={[styles.bottomNavInner, surfaceStyle]}>
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isSelected = item.id === activeTab;

          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={labels[item.id] || item.label}
              activeOpacity={0.82}
              onPress={() => navigation?.navigate?.(item.screen)}
              style={[styles.bottomNavItem, { height: itemHeight }, isSelected && styles.bottomNavItemSelected, isSelected && selectedItemStyle]}
            >
              <Image
                source={item.image}
                style={[styles.bottomNavIcon, { width: iconSize, height: iconSize }, iconStyle]}
                resizeMode="contain"
              />
              <Text
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                numberOfLines={1}
                style={[styles.bottomNavLabel, { fontSize: labelSize }, isSelected && styles.bottomNavLabelSelected, labelStyle]}
              >
                {labels[item.id] || item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  bottomNavInner: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: COLORS.cardCream,
    borderWidth: 1,
    borderColor: COLORS.borderGold,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: -3 },
    elevation: 8,
  },
  bottomNavItem: {
    flex: 1,
    minWidth: 0,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
    paddingHorizontal: 1,
  },
  bottomNavItemSelected: {
    backgroundColor: COLORS.cardGoldLight,
  },
  bottomNavIcon: {
    marginBottom: 2,
  },
  bottomNavLabel: {
    color: COLORS.textMuted,
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
  },
  bottomNavLabelSelected: {
    color: COLORS.textDark,
  },
});
