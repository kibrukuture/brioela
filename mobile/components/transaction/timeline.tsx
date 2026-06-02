import type React from 'react';
import { View, Text } from 'react-native';
import type { TimelineStep } from './types';
import { Check } from 'phosphor-react-native';

interface TimelineProps {
  steps: TimelineStep[];
}

export const Timeline: React.FC<TimelineProps> = ({ steps }) => {
  return (
    <View className="px-4">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={step.id} className="flex-row">
            {/* Left side - Icon and line */}
            <View className="mr-4 items-center">
              <View className="h-6 w-6 items-center justify-center">
                <Check size={20} color="#666" />
              </View>
              {!isLast && <View className="min-h-[40px] w-0.5 flex-1 bg-gray-300" />}
            </View>

            {/* Right side - Content */}
            <View className="flex-1 pb-6">
              <Text className="text-sm text-gray-500">
                {step.date} at {step.time}
              </Text>
              <Text
                className={`mt-1 text-base ${step.isHighlighted ? 'font-bold text-black' : 'text-gray-700'}`}>
                {step.title}
              </Text>
              {step.description && (
                <Text className="mt-1 text-sm text-gray-600">{step.description}</Text>
              )}
              {step.note && (
                <Text className="mt-2 text-sm text-gray-500">
                  <Text className="font-semibold">Keep in mind — </Text>
                  {step.note}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};
