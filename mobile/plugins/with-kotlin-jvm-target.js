const { withProjectBuildGradle } = require('expo/config-plugins');

const BLOCK_START_TAG = '// >>> schnl-kotlin-jvm-target';
const BLOCK_END_TAG = '// <<< schnl-kotlin-jvm-target';

const KOTLIN_JVM_BLOCK = `${BLOCK_START_TAG}
subprojects { subproject ->
  def applyJvmTarget = {
    subproject.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach { task ->
      if (task.kotlinOptions != null && task.kotlinOptions.jvmTarget != '17') {
        task.kotlinOptions.jvmTarget = '17'
      }
    }
  }

  subproject.plugins.withId('org.jetbrains.kotlin.android') { applyJvmTarget() }
  subproject.plugins.withId('kotlin-android') { applyJvmTarget() }
  subproject.plugins.withId('org.jetbrains.kotlin.jvm') { applyJvmTarget() }
  subproject.plugins.withId('kotlin') { applyJvmTarget() }
}
${BLOCK_END_TAG}`;

function ensureKotlinJvmTargetBlock(contents) {
  if (contents.includes(BLOCK_START_TAG)) {
    return contents;
  }

  return `${contents.trimEnd()}\n\n${KOTLIN_JVM_BLOCK}\n`;
}

module.exports = function withKotlinJvmTarget(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    config.modResults.contents = ensureKotlinJvmTargetBlock(config.modResults.contents);
    return config;
  });
};
