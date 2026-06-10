import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const DEVICE_ID_KEY = 'schnl_device_id';

async function createId(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex;
}

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing && existing.length > 0) {
    return existing;
  }
  const id = await createId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
