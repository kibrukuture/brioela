import { View, Text, Switch } from 'react-native';

interface AccountSettingsSectionProps {
  isMyAccount: boolean;
  isPrimaryAccount: boolean;
  isTrustedAccount: boolean;
  onMyAccountChange: (value: boolean) => void;
  onPrimaryAccountChange: (value: boolean) => void;
  onTrustedAccountChange: (value: boolean) => void;
}

export const AccountSettingsSection: React.FC<AccountSettingsSectionProps> = ({
  isMyAccount,
  isPrimaryAccount,
  isTrustedAccount,
  onMyAccountChange,
  onPrimaryAccountChange,
  onTrustedAccountChange,
}) => {
  return (
    <View className="mt-6">
      <View className="mb-4 border-b border-gray-200 pb-2">
        <Text className="text-sm text-gray-500">Account settings</Text>
      </View>

      <View className="flex-row items-start justify-between py-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-gray-900">My account</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Keep your accounts separate from others so it's easier to manage your money.
          </Text>
        </View>
        <Switch
          value={isMyAccount}
          onValueChange={onMyAccountChange}
          trackColor={{ false: '#D1D5DB', true: '#1A1A1A' }}
        />
      </View>

      <View className="flex-row items-start justify-between py-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-medium text-red-400">
            Primary TRY account - no longer available
          </Text>
          <Text className="mt-1 text-sm text-gray-400">
            TRY sent to you on Wise using your email, phone number or Wisetag will go to your Wise
            account. Check your privacy settings to make sure your details can be found.
          </Text>
        </View>
        <Switch
          value={isPrimaryAccount}
          onValueChange={onPrimaryAccountChange}
          disabled
          trackColor={{ false: '#E5E7EB', true: '#1A1A1A' }}
        />
      </View>

      <View className="flex-row items-start justify-between py-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-semibold text-gray-900">Trusted account</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Skip authentication checks so you can send to this account faster. Only do this for
            someone you know.
          </Text>
        </View>
        <Switch
          value={isTrustedAccount}
          onValueChange={onTrustedAccountChange}
          trackColor={{ false: '#D1D5DB', true: '#1A1A1A' }}
        />
      </View>
    </View>
  );
};
