import { View, Text } from 'react-native';

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <View className="border-t border-gray-200 py-4">
      <Text className="mb-2 text-sm font-medium text-gray-600">{title}</Text>
      {children}
    </View>
  );
}
