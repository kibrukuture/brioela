import type React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface TabSelectorProps {
  activeTab: 'Updates' | 'Details';
  onTabChange: (tab: 'Updates' | 'Details') => void;
}

export const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange }) => {
  return (
    <View className="mx-4 my-4 flex-row rounded-full bg-gray-200 p-1">
      <TouchableOpacity
        onPress={() => onTabChange('Updates')}
        className={`flex-1 items-center rounded-full py-3 ${activeTab === 'Updates' ? 'bg-white' : ''}`}>
        <Text
          className={`text-base font-medium ${activeTab === 'Updates' ? 'text-black' : 'text-gray-500'}`}>
          Updates
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onTabChange('Details')}
        className={`flex-1 items-center rounded-full py-3 ${activeTab === 'Details' ? 'bg-white' : ''}`}>
        <Text
          className={`text-base font-medium ${activeTab === 'Details' ? 'text-black' : 'text-gray-500'}`}>
          Details
        </Text>
      </TouchableOpacity>
    </View>
  );
};
