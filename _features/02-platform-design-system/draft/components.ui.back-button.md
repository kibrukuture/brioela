# Draft: components/ui/back-button.tsx

Target: `mobile/components/ui/back-button.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

interface BackButtonProps {
  onPress?: () => void;
}

/**
 * Reusable back button component with consistent styling.
 * Uses router.back() by default if no onPress handler is provided.
 */
export function BackButton({ onPress }: BackButtonProps): React.JSX.Element {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      <TouchableOpacity
        onPress={handlePress}
        className="h-12 w-12 items-center justify-center rounded-full border border-neutral-200"
        activeOpacity={0.7}>
        <ArrowLeft size={22} color="#171717" />
      </TouchableOpacity>
      <View />
    </View>
  );
}

```
