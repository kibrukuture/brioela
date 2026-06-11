# Draft: _helpers/build.launchd.plist.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/build.launchd.plist.helper.ts`

```typescript
import { join } from 'node:path'
import { launchdLabel, launchdStderrPath, launchdStdoutPath } from './launchd.config.helper'

type BuildLaunchdPlistContext = {
  bunExecutablePath: string
  workspaceRoot: string
}

export function buildLaunchdPlist(context: BuildLaunchdPlistContext): string {
  const guardHandlerPath = join(context.workspaceRoot, 'tools', 'brioela-lexicon-guard', 'run.brioela.lexicon.guard.handler.ts')
  const pathValue = [
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
  ].join(':')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${escapeXml(launchdLabel)}</string>

  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(context.bunExecutablePath)}</string>
    <string>${escapeXml(guardHandlerPath)}</string>
    <string>--watch</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${escapeXml(context.workspaceRoot)}</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${escapeXml(pathValue)}</string>
    <key>BRIOELA_WORKSPACE_ROOT</key>
    <string>${escapeXml(context.workspaceRoot)}</string>
  </dict>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>ProcessType</key>
  <string>Background</string>

  <key>StandardOutPath</key>
  <string>${escapeXml(launchdStdoutPath)}</string>

  <key>StandardErrorPath</key>
  <string>${escapeXml(launchdStderrPath)}</string>
</dict>
</plist>
`
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}
```
