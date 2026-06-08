import { join } from 'node:path'
import { launchdLabel, launchdStderrPath, launchdStdoutPath } from './launchd.config.helper'

type BuildLaunchdPlistInput = {
  bunExecutablePath: string
  workspaceRoot: string
}

export function buildLaunchdPlist(input: BuildLaunchdPlistInput): string {
  const guardHandlerPath = join(input.workspaceRoot, 'tools', 'brioela-type-guard', 'run.brioela.type.guard.handler.ts')
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
    <string>${escapeXml(input.bunExecutablePath)}</string>
    <string>${escapeXml(guardHandlerPath)}</string>
    <string>--watch</string>
  </array>

  <key>WorkingDirectory</key>
  <string>${escapeXml(input.workspaceRoot)}</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${escapeXml(pathValue)}</string>
    <key>BRIOELA_WORKSPACE_ROOT</key>
    <string>${escapeXml(input.workspaceRoot)}</string>
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
