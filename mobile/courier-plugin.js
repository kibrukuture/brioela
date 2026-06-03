const { withMainActivity } = require('@expo/config-plugins');

/**
 * Custom Expo config plugin for Courier React Native
 * Automatically patches MainActivity to extend CourierReactNativeActivity
 */
const withCourier = (config) => {
  return withMainActivity(config, (config) => {
    const { modResults } = config;
    let contents = modResults.contents;

    // Check if already patched
    if (contents.includes('CourierReactNativeActivity')) {
      console.log('✓ MainActivity already extends CourierReactNativeActivity');
      return config;
    }

    // Determine if Java or Kotlin
    const isKotlin = modResults.language === 'kt';

    if (isKotlin) {
      // Kotlin: Add import
      if (!contents.includes('import com.courierreactnative.CourierReactNativeActivity')) {
        contents = contents.replace(
          /(package .+)/,
          '$1\n\nimport com.courierreactnative.CourierReactNativeActivity'
        );
      }

      // Kotlin: Change class to extend CourierReactNativeActivity
      contents = contents.replace(
        /class MainActivity\s*:\s*ReactActivity\(\)/,
        'class MainActivity : CourierReactNativeActivity()'
      );
    } else {
      // Java: Add import
      if (!contents.includes('import com.courierreactnative.CourierReactNativeActivity;')) {
        contents = contents.replace(
          /(package .+;)/,
          '$1\n\nimport com.courierreactnative.CourierReactNativeActivity;'
        );
      }

      // Java: Change class to extend CourierReactNativeActivity
      contents = contents.replace(
        /public class MainActivity extends ReactActivity/,
        'public class MainActivity extends CourierReactNativeActivity'
      );
    }

    modResults.contents = contents;
    console.log('✓ Patched MainActivity to extend CourierReactNativeActivity');
    return config;
  });
};

module.exports = withCourier;
