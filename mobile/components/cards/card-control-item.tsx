import type * as React from 'react';
import { View, Text, Switch, ActivityIndicator } from 'react-native';
import {
  Globe,
  CreditCard,
  Wifi,
  Cpu,
  Smartphone,
  Landmark,
  ShieldOff,
  Plane,
} from 'lucide-react-native';
import type { CardControlIconType } from './types';

type CardControlItemProps = {
  control: {
    id: string;
    icon: CardControlIconType;
    title: string;
    description: string;
    enabled: boolean;
  };
  onToggle: (controlId: string, enabled: boolean) => void;
  isLoading?: boolean;
};

const getCardControlIcon = (icon: CardControlIconType) => {
  const iconMap: Record<CardControlIconType, typeof Globe> = {
    globe: Globe,
    magnetic_stripe: CreditCard,
    contactless: Wifi,
    chip: Cpu,
    mobile_wallet: Smartphone,
    cash_withdrawal: Landmark,
    non_3d_secure: ShieldOff,
    overseas: Plane,
  };
  return iconMap[icon];
};

export const CardControlItem: React.FC<CardControlItemProps> = ({
  control,
  onToggle,
  isLoading,
}) => {
  const IconComponent = getCardControlIcon(control.icon);

  return (
    <View className="flex-row items-center px-6 py-4">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
        <IconComponent size={24} color="#1D1D1D" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-base font-semibold text-[#1D1D1D]">{control.title}</Text>
        <Text className="mt-1 text-sm text-[#6B7280]">{control.description}</Text>
      </View>
      <View className={isLoading ? 'relative opacity-60' : 'relative'}>
        <Switch
          value={control.enabled}
          onValueChange={(value) => onToggle(control.id, value)}
          disabled={!!isLoading}
          trackColor={{ false: '#E5E7EB', true: '#1D3D2C' }}
          thumbColor="#FFFFFF"
        />
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
            <ActivityIndicator size="small" color="#1D3D2C" className="scale-75" />
          </View>
        )}
      </View>
    </View>
  );
};
