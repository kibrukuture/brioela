import { StyleSheet, Dimensions } from 'react-native'
import { Canvas, Shader, Fill, Skia } from '@shopify/react-native-skia'
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { EMBER_SHADER } from './ember.shader'

const { width, height } = Dimensions.get('window')

const runtimeEffect = Skia.RuntimeEffect.Make(EMBER_SHADER)
if (!runtimeEffect) throw new Error('EmberScene: shader failed to compile')

type Props = {
  onReady?: () => void  // fires when ember is fully visible
}

export function EmberScene({ onReady }: Props) {
  // time — drives the breathe cycle, updated every frame
  const iTime = useSharedValue(0)

  // intensity — 0 on mount, animates to 1 to fade the ember in
  const iIntensity = useSharedValue(0)

  // tick iTime forward — runs on UI thread
  useIsomorphicLayoutEffect(() => {
    iTime.value = withRepeat(
      withTiming(3600, { duration: 3600 * 1000, easing: Easing.linear }),
      -1,
      false
    )
  }, [])

  // fade ember in over 2.4 seconds, then call onReady
  useIsomorphicLayoutEffect(() => {
    iIntensity.value = withTiming(1.0, { duration: 2400, easing: Easing.out(Easing.quad) }, (done) => {
      if (done && onReady) runOnJS(onReady)()
    })
  }, [])

  // uniforms passed to the shader — derived values run on UI thread
  const uniforms = useDerivedValue(() => ({
    iResolution: [width, height],
    iTime:       iTime.value,
    iIntensity:  iIntensity.value,
  }))

  return (
    <Canvas style={styles.canvas}>
      <Fill>
        <Shader source={runtimeEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  )
}

const styles = StyleSheet.create({
  canvas: {
    width,
    height,
    backgroundColor: '#000000',
  },
})
