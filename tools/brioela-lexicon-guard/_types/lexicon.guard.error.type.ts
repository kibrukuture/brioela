export class InvalidLexiconBaselineError extends Error {
  override name = 'InvalidLexiconBaselineError'

  constructor() {
    super('Invalid Brioela Lexicon Guard baseline file.')
  }
}

export class LaunchdUserError extends Error {
  override name = 'LaunchdUserError'

  constructor() {
    super('Could not determine the current user id for launchctl.')
  }
}

export class InvalidLexiconGuardPlistError extends Error {
  override name = 'InvalidLexiconGuardPlistError'

  constructor(message: string) {
    super(message)
  }
}

export class LexiconGuardDaemonStartError extends Error {
  override name = 'LexiconGuardDaemonStartError'

  constructor(message: string) {
    super(message)
  }
}
