import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable } from 'react-native';
import { useUser } from '@/hooks/users/use-user';

export default function HomeHeaderLeft() {
  const { data: user } = useUser();

  return (
    <Pressable onPress={() => router.push('/profile')}>
      <Image
        source={{ uri: user?.profilePicture || 'https://i.pravatar.cc/100' }}
        className="h-11 w-11 rounded-full"
      />
    </Pressable>
  );
}
