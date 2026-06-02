import type { User } from '@supabase/supabase-js';

/**
 * Extract a display name from Supabase user data
 * Priority: user_metadata.name > user_metadata.full_name > email local part
 * Returns null if no name can be extracted
 */
export function extractUserName(user: User | null): string | null {
  if (!user) {
    return null;
  }

  // Try user_metadata.name first
  if (user.user_metadata?.name) {
    return user.user_metadata.name;
  }

  // Try user_metadata.full_name
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }

  // Fallback to email local part (before @)
  if (user.email) {
    const emailLocalPart = user.email.split('@')[0];

    // Convert common email formats to readable names
    // john.doe@example.com -> John Doe
    // john_doe@example.com -> John Doe
    // johndoe@example.com -> Johndoe
    let name = emailLocalPart
      .replace(/[._-]/g, ' ') // Replace dots, underscores, hyphens with spaces
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();

    // If it's still too long or looks like gibberish, just use first part
    if (name.length > 20 || name.split(' ').length > 3) {
      name = name.split(' ')[0];
    }

    return name || null;
  }

  return null;
}

/**
 * Get just the first name from a full name
 */
export function getFirstName(fullName: string | null): string | null {
  if (!fullName) return null;

  const firstWord = fullName.split(' ')[0];
  return firstWord || null;
}
