/**
 * SchnlTag Utilities
 *
 * Rules for a valid SchnlTag:
 * 1. Must be unique (case-insensitive, stored as lowercase).
 * 2. Length: 3-20 characters.
 * 3. Allowed characters: lowercase letters (a-z), numbers (0-9), dots (.), and underscores (_).
 * 4. Must start with a letter.
 * 5. Cannot end with a special character (. or _).
 * 6. Cannot contain consecutive special characters (e.g., '..', '__', '._').
 *
 * Storage:
 * - Always stored in lowercase.
 * - Stored WITHOUT the '@' prefix.
 */

// Regex Breakdown:
// ^[a-z]           : Must start with a lowercase letter
// (?!.*[._]{2})    : Negative lookahead - ensures no consecutive dots or underscores anywhere
// [a-z0-9._]{1,18} : Middle characters (1-18 chars) allowed: a-z, 0-9, ., _
// [a-z0-9]$        : Must end with alphanumeric (no trailing . or _)
// Total length enforced primarily by the middle quantifier + start/end anchors (1+18+1 = 20 max)
const VALID_TAG_REGEX = /^[a-z](?!.*[._]{2})[a-z0-9._]{1,18}[a-z0-9]$/;

// List of reserved tags or sensitive words to block
const RESERVED_TAGS = new Set([
  "admin",
  "administrator",
  "root",
  "support",
  "help",
  "info",
  "schnl",
  "official",
  "system",
  "moderator",
  "staff",
  "team",
  "ceo",
  "cto",
  "cfo",
  "coo",
  "founder",
  "cofounder",
  "co_founder",
  "co.founder",
  "owner",
  "president",
  "director",
  "manager",
  "executive",
  "verified",
  "authentic",
  "real",
  "genuine",
  "trusted",
  "certified",
  "approved",
  "endorsed",
  "spam",
  "scam",
  "phishing",
  "fake",
  "fraud",
  "hacker",
  "hack",
  "exploit",
  "abuse",
  "report",
  "null",
  "undefined",
  "none",
  "delete",
  "remove",
  "user",
  "guest",
  "anonymous",
  "everyone",
  "all",
  "webhook",
  "config",
  "database",
  "server",
  "backend",
  "schnltag",
  "schnlpay",
  "schnlcard",
  "billing",
  "contact",
  "legal",
  "compliance",
  "regulation",
  "lawyer",
  "attorney",
  "copyright",
  "trademark",
  "patent",
  "dmca",
  "privacy",
  "security",
  "about",
  "terms",
  "faq",
  "blog",
  "careers",
  "press",
  "docs",
  "login",
  "logout",
  "reset",
  "forgot",
  "forgotpassword",
  "resetpassword",
  "verify",
  "verification",
  "verifyemail",
  "verifyphone",
  "otp",
  "mfa",
  "2fa",
  "password",
  "passcode",
  "pin",
  "signup",
  "register",
  "auth",
  "callback",
  "profile",
  "settings",
  "account",
  "accounts",
  "cards",
  "card",
  "wallet",
  "payment",
  "payments",
  "pay",
  "transfer",
  "transfers",
  "transaction",
  "transactions",
  "recipient",
  "recipients",
  "notification",
  "notifications",
  "inbox",
  "scan",
  "qr",
  "www",
  "mail",
  "cdn",
  "static",
  "assets",
  "files",
  "api",
  "dev",
  "test",
  "demo",
  "bot",
  "status",
  "dashboard",
]);

export function isReservedSchnlTag(tag: string): boolean {
  if (!tag) return false;

  const rawTag = tag.startsWith("@") ? tag.slice(1) : tag;
  const lowerTag = rawTag.toLowerCase();

  if (RESERVED_TAGS.has(lowerTag)) return true;

  const noSeparators = lowerTag.replace(/[._]/g, "");

  if (noSeparators.startsWith("schnl")) return true;

  const prefixBlocked =
    /^(admin|administrator|root|support|help|info|official|system|moderator|staff|team)/;
  if (prefixBlocked.test(lowerTag)) return true;

  const impersonationBlocked =
    /(schnl.*(support|team|admin|official|staff|mod|moderator))|((support|team|admin|official|staff|mod|moderator).*schnl)/;
  if (impersonationBlocked.test(noSeparators)) return true;

  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates if a SchnlTag string is acceptable.
 * @param tag - The tag to validate (can include '@' prefix, but validation logic assumes raw tag)
 */
export function validateSchnlTag(tag: string): ValidationResult {
  if (!tag) return { valid: false, error: "SchnlTag cannot be empty" };

  // Remove '@' if present for validation
  const rawTag = tag.startsWith("@") ? tag.slice(1) : tag;
  const lowerTag = rawTag.toLowerCase();

  // 1. Length check
  if (lowerTag.length < 3) {
    return {
      valid: false,
      error: "SchnlTag is too short (minimum 3 characters)",
    };
  }
  if (lowerTag.length > 20) {
    return {
      valid: false,
      error: "SchnlTag is too long (maximum 20 characters)",
    };
  }

  // 2. Reserved word check
  if (isReservedSchnlTag(lowerTag)) {
    return { valid: false, error: "This SchnlTag is reserved" };
  }

  // 3. Regex check (format, characters, special char rules)
  if (!VALID_TAG_REGEX.test(lowerTag)) {
    // Determine specific error for better UX
    if (!/^[a-z]/.test(lowerTag)) {
      return { valid: false, error: "SchnlTag must start with a letter" };
    }
    if (/[^a-z0-9._]/.test(lowerTag)) {
      return {
        valid: false,
        error:
          "SchnlTag can only contain letters, numbers, dots (.), and underscores (_)",
      };
    }
    if (/[._]{2}/.test(lowerTag)) {
      return {
        valid: false,
        error:
          'SchnlTag cannot contain consecutive special characters (e.g., "..", "__")',
      };
    }
    if (/[._]$/.test(lowerTag)) {
      return {
        valid: false,
        error: "SchnlTag cannot end with a special character",
      };
    }
    return { valid: false, error: "Invalid SchnlTag format" };
  }

  return { valid: true };
}

/**
 * Sanitizes input for storage or usage.
 * - Removes leading '@'
 * - Converts to lowercase
 * - Trims whitespace
 */
export function sanitizeSchnlTag(tag: string): string {
  if (!tag) return "";
  let sanitized = tag.trim().toLowerCase();
  if (sanitized.startsWith("@")) {
    sanitized = sanitized.slice(1);
  }
  return sanitized;
}

/**
 * Formats a SchnlTag for display.
 * Adds the '@' prefix if not present.
 */
export function formatSchnlTag(tag: string | null | undefined): string {
  if (!tag) return "";
  return tag.startsWith("@") ? tag : `@${tag}`;
}
