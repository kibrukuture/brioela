import * as React from 'react';
import { BottomSheetModalProvider } from '@/components/ui/sheet';

export function SheetProvider({ children }: { children: React.ReactNode }) {
  return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>;
}
