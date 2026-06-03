import { useNavigation } from 'expo-router';

export const useDrawerControl = () => {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch({ type: 'OPEN_DRAWER' });
  };

  return {
    openDrawer,
  };
};
