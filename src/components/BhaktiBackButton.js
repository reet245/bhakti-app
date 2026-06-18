import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BACK_BUTTON_SIZE = 40;

export function navigateBackSafely(navigation, fallbackRoute = 'Home', fallbackParams) {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return;
  }

  if (fallbackRoute) {
    navigation?.navigate?.(fallbackRoute, fallbackParams);
  }
}

export function BhaktiBackSpacer({ style }) {
  return <View pointerEvents="none" style={[styles.spacer, style]} />;
}

export default function BhaktiBackButton({
  accessibilityLabel = 'Go back',
  fallbackParams,
  fallbackRoute = 'Home',
  navigation,
  onPress,
  style,
}) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    navigateBackSafely(navigation, fallbackRoute, fallbackParams);
  };

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.68}
      onPress={handlePress}
      style={[styles.button, style]}
    >
      <Text style={styles.arrow}>{'\u2039'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  arrow: {
    color: '#2B2115',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '800',
    marginLeft: 1,
    marginTop: -2,
  },
  spacer: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
  },
});
