// longevity-deck-onboarding-animation 🔽

import { createContext, FC, PropsWithChildren } from 'react';
import { SharedValue } from 'react-native-reanimated';

/**
 * Context type for sharing the active slide index across animation components.
 * activeIndex is a SharedValue that tracks the current slide (0-4) and enables
 * synchronized animations across all child components without prop drilling.
 */
type AnimatedIndexContextType = {
  activeIndex: SharedValue<number>;
};

const AnimatedIndexContext = createContext<AnimatedIndexContextType>(
  {} as AnimatedIndexContextType
);

export const AnimatedIndexContextProvider: FC<PropsWithChildren<AnimatedIndexContextType>> = ({
  children,
  activeIndex,
}) => {
  return (
    <AnimatedIndexContext.Provider value={{ activeIndex }}>
      {children}
    </AnimatedIndexContext.Provider>
  );
};

export { AnimatedIndexContext };

// longevity-deck-onboarding-animation 🔼
