import { Alert } from 'react-native';

export function useCreateSupportChat() {
  return async () => {
    Alert.alert('Customer support', 'Support chat is temporarily unavailable.');
  };
}
