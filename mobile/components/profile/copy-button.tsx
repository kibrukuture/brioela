import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Burnt from 'burnt';
import { Check, Copy } from 'lucide-react-native';

export function CopyButton({ value }: { value?: string | null }): React.ReactElement {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    if (!value) return;

    await Haptics.selectionAsync();
    await Clipboard.setStringAsync(value);
    setHasCopied(true);
    Burnt.toast({ title: 'Copied', preset: 'done', haptic: 'none' });

    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  let icon: React.ReactElement;
  if (hasCopied) {
    icon = <Check size={20} color="#22c55e" />;
  } else {
    icon = <Copy size={20} color="#a3a3a3" />;
  }

  return (
    <TouchableOpacity onPress={handleCopy} activeOpacity={0.7} className="p-2">
      {icon}
    </TouchableOpacity>
  );
}
