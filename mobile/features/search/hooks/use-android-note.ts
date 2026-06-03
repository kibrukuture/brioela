import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { Alert, Platform } from 'react-native';

export const useAndroidNote = (message: string) => {
  useIsomorphicLayoutEffect(() => {
    if (Platform.OS === 'android') {
      Alert.alert('Note', message);
    }
  }, [message]);
};
