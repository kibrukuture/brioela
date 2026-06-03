import {
  BottomSheetModalProvider,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { useColorScheme } from '@/lib/useColorScheme';
import { Animated, useWindowDimensions } from 'react-native';
import useSheetStore from '@/stores/ui/use-sheet-store';
import { GlassView } from 'expo-glass-effect';

/**
 * Props for the `Sheet` component.
 *
 * These are the props that can be passed to the `Sheet` component, which is a
 * wrapper around the Gorhom `BottomSheetModal`.
 */
type SheetProps = React.ComponentPropsWithoutRef<typeof BottomSheetModal>;

/**
 * Type alias for the `BottomSheetModal` instance.
 *
 * This type alias is used to refer to the `BottomSheetModal` instance that is
 * returned by the `useSheetRef` and `useManagedSheetRef` hooks.
 */
export type BottomSheetInstance = import('@gorhom/bottom-sheet').default;

/**
 * Type alias for the `BottomSheetModal` instance.
 *
 * This type alias is used to refer to the `BottomSheetModal` instance that is
 * returned by the `useSheetRef` and `useManagedSheetRef` hooks.
 */
export type BottomSheetModalInstance = import('@gorhom/bottom-sheet').BottomSheetModal;

/**
 * App-standard bottom sheet wrapper around Gorhom `BottomSheetModal`.
 *
 * Why this wrapper exists:
 * - Ensures consistent styling (rounded corners, margins, “glass” background).
 * - Wires `onChange` to our global sheet store (`useSheetStore`) so other parts
 *   of the app can react to “a sheet is open / closed”.
 * - Provides a consistent backdrop.
 *
 * Important: This is still an *imperative* modal.
 * You open/close it using a ref:
 * - `ref.current?.present()`
 * - `ref.current?.dismiss()`
 *
 * For ref creation, prefer `useManagedSheetRef(isVisible)` when your sheet is
 * driven by React state.
 */
const Sheet = React.forwardRef<BottomSheetModal, SheetProps>(
  (
    { index = 0, backgroundStyle, style, handleIndicatorStyle, children, onChange, ...props },
    ref
  ) => {
    const { colors } = useColorScheme();
    const setSheetVisible = useSheetStore((state) => state.setSheetVisible);
    const { width } = useWindowDimensions();

    // Small gaps - 8px on each side
    const sheetWidth = width - 16;
    const horizontalMargin = 8;

    const renderBackdrop = React.useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
      ),
      []
    );

    const handleSheetChanges = React.useCallback(
      (index: number) => {
        setSheetVisible(index >= 0);

        if (onChange) {
          onChange(index);
        }
      },
      [onChange, setSheetVisible]
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        onChange={handleSheetChanges}
        backgroundComponent={({ style }) => (
          <GlassView
            style={[
              style,
              {
                borderRadius: 20,

                overflow: 'hidden',
              },
            ]}
          />
        )}
        style={
          style ?? {
            marginHorizontal: horizontalMargin,
            marginBottom: 8,
            width: sheetWidth,
            alignSelf: 'center',

            borderRadius: 20,
          }
        }
        handleIndicatorStyle={
          handleIndicatorStyle ?? {
            backgroundColor: colors.grey4,
            width: 40,
            height: 4,
          }
        }
        backdropComponent={renderBackdrop}
        {...props}>
        {children}
      </BottomSheetModal>
    );
  }
);
/**
 * Creates a ref for an imperative Gorhom `BottomSheetModal`.
 *
 * This project uses bottom sheets in an *imperative* way:
 * - Open with `ref.current?.present()`
 * - Close with `ref.current?.dismiss()`
 *
 * Meaning: changing React state alone does not automatically open/close the
 * sheet UI unless you also call these ref methods.
 *
 * If your component has a boolean like `isVisible` and you want “when isVisible
 * becomes false, the sheet must close”, use `useManagedSheetRef(isVisible)`.
 *
 * @returns A React ref object whose `.current` is a `BottomSheetModal` instance.
 *
 * @example
 * ```tsx
 * const sheetRef = useSheetRef();
 *
 * // Imperative open/close.
 * // Use this when you are NOT driving the sheet by a React boolean.
 * const open = () => sheetRef.current?.present();
 * const close = () => sheetRef.current?.dismiss();
 * ```
 */
function useSheetRef() {
  return React.useRef<BottomSheetModal>(null);
}

/**
 * Like `useSheetRef()`, but with one critical extra guarantee:
 *
 * When the parent state says the sheet should NOT be visible, we automatically
 * dismiss the sheet instance.
 *
 * This removes boilerplate like:
 * ```ts
 * useIsomorphicLayoutEffect(() => {
 *   if (!isVisible) sheetRef.current?.dismiss();
 * }, [isVisible]);
 * ```
 *
 * @param isVisible - Your React “source of truth” for whether the sheet should
 * be open.
 *
 * This is intentionally a single boolean (not multiple values):
 * - Most commonly it is a `useState<boolean>` like `const [isVisible, setIsVisible] = useState(false)`.
 * - It can also be a derived boolean like `Boolean(isVisible && card)`.
 *
 * When `isVisible` becomes `false`, `dismiss()` is called.
 *
 * @returns A React ref object whose `.current` is a `BottomSheetModal` instance.
 *
 * @example
 * ```tsx
 * const [isVisible, setIsVisible] = useState(false);
 * const sheetRef = useManagedSheetRef(isVisible);
 *
 * // When you want to open (e.g. after auth passed):
 * sheetRef.current?.present();
 *
 * // When you want to close:
 * setIsVisible(false);
 * // The hook will call `dismiss()` automatically.
 * ```
 */
function useManagedSheetRef(isVisible: boolean) {
  const ref = useSheetRef();

  /**
   * Sync rule: when the parent state says “not visible”, we must imperatively
   * dismiss the sheet instance.
   *
   * Without this, calling `setIsVisible(false)` in React may not actually close
   * the sheet UI, because the sheet is controlled by a ref.
   */
  useIsomorphicLayoutEffect(() => {
    if (!isVisible) {
      ref.current?.dismiss();
    }
  }, [isVisible]);

  return ref;
}

/**
 * Optional wrapper to apply a subtle scale animation to the whole app content
 * based on whether any sheet is currently visible.
 *
 * This is connected to `useSheetStore` which is updated by the `Sheet` wrapper
 * (via `onChange`).
 */
function SheetContentWrapper({ children }: { children: React.ReactNode }) {
  const isSheetVisible = useSheetStore((state) => state.isSheetVisible);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useIsomorphicLayoutEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: 1, // no animation needed.
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isSheetVisible, scaleAnim]);

  return (
    <Animated.View
      style={{
        flex: 1,
        transform: [{ scale: scaleAnim }],
      }}>
      {children}
    </Animated.View>
  );
}

export { Sheet, useSheetRef, useManagedSheetRef, SheetContentWrapper };

/**
 * Re-exported Gorhom primitives used across the app.
 *
 * These are re-exported from one place so call-sites can import consistently
 * from `@/components/ui/sheet`.
 */
export { BottomSheetModalProvider, BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView };

/**
 * Re-exported types for convenience.
 */
export type { BottomSheetBackdropProps, SheetProps };
