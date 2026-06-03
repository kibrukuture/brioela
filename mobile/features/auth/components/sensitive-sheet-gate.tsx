import * as React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { useDeviceAuthGate } from '@/features/auth/hooks/use-device-auth-gate';

export interface SensitiveSheetGateProps {
  readonly isVisible: boolean;
  readonly promptMessage: string;
  readonly progressTitle?: string;
  readonly onAuthed: () => void;
  readonly onDenied?: () => void;
  readonly children?: React.ReactNode;
}

export function SensitiveSheetGate({
  isVisible,
  promptMessage,
  progressTitle,
  onAuthed,
  onDenied,
  children,
}: SensitiveSheetGateProps) {
  const { requireDeviceAuth } = useDeviceAuthGate();

  useIsomorphicLayoutEffect(() => {
    const run = async () => {
      if (!isVisible) return;
      const ok = await requireDeviceAuth(promptMessage, progressTitle);
      if (ok) {
        onAuthed();
      } else {
        onDenied?.();
      }
    };

    run();
  }, [isVisible, onAuthed, onDenied, progressTitle, promptMessage, requireDeviceAuth]);

  return <>{children}</>;
}
