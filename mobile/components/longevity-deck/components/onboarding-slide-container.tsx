import { PropsWithChildren, ReactNode } from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

type Props = {
  title: string;
  description?: string | ReactNode;
  subtitle?: string;
};

export const OnboardingSlideContainer: React.FC<PropsWithChildren<Props>> = ({
  title,
  description,
  subtitle,
  children,
}) => {
  const { width } = useWindowDimensions();

  return (
    <View style={{ width }} className="h-full">
      <View className="h-1/2 w-full">{children}</View>
      <View className="h-1/2 w-full items-center justify-center px-6 py-10">
        <View className="mb-6 flex w-full items-center px-6 py-8">
          <Text className="text-center font-parafina text-6xl text-zinc-50">{title}</Text>
          {subtitle && (
            <Text className="mb-8 mt-3 text-center text-xl text-zinc-300">{subtitle}</Text>
          )}
          {description && (
            <View className="w-11/2 mx-auto mt-2 ">
              {typeof description === 'string' ? (
                <Text className="mb-12 mt-4 text-center text-xl text-zinc-300">{description}</Text>
              ) : (
                description
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
