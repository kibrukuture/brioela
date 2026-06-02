import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SEARCHBAR_HEIGHT } from '@/stores/ui/use-search-header-store';

export const useHeaderHeight = () => {
  const insets = useSafeAreaInsets();

  return {
    // Why: Net header height is the interactive content height (searchbar),
    // used for scrollIndicatorInsets and spacing below the absolute header.
    netHeight: SEARCHBAR_HEIGHT,
    // Why: Gross height = safe top inset + chrome (approx 58) to position
    // elements below status bar and align chevron/gradients.
    grossHeight: insets.top + 58,
    // Why: Extra 8px top inset provides breathing room and touch comfort,
    // also prevents blur/gradient from touching screen edge.
    insetTop: insets.top + 8,
  };
};
