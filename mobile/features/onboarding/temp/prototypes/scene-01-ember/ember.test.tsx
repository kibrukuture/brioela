import { View, StyleSheet, StatusBar } from 'react-native'
import { EmberScene } from './ember.scene'

// drop into any screen to test in isolation
// e.g. replace app/onboarding.tsx with:
//   import { EmberTest } from '@/features/onboarding/temp/prototypes/scene-01-ember/ember.test'
//   export default EmberTest

export function EmberTest() {
  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <EmberScene onReady={() => console.log('[EmberScene] ember fully visible')} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
})
