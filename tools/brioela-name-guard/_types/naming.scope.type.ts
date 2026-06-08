export type NamingScope = {
  scope: string
  allowedSubjects?: string[]
  requiredSubject?: boolean
  allowedActions?: string[]
  allowedRoles?: string[]
}
