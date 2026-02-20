import { useNavigation, useNavigationState } from '@react-navigation/native';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

export default function FloatingBackButton() {
  const navigation = useNavigation();
  // This hook safely checks the navigation history.
  const index = useNavigationState(state => state.index);

  // If the index is 0, we are on a main tab screen, so we don't show the button.
  if (index === 0) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 90, // Raised to be above the bottom tab bar
    left: 20,
    backgroundColor: tokens.colors.light.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 1000,
  }
});
