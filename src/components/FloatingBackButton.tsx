import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../theme/tokens';

export default function FloatingBackButton() {
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  const buttonStyle = [
    styles.button,
    !canGoBack && styles.disabledButton
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={() => canGoBack && navigation.goBack()}
      disabled={!canGoBack}
    >
      <Ionicons name="arrow-back" size={24} color="white" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
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
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.5)', // Red and semi-transparent for debugging
  }
});
