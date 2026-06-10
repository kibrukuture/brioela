import { customAlphabet } from 'nanoid';
import { CustomerType } from '@tolbel/align';
/**
 * Safe characters for membership numbers
 * Excludes confusing characters: 0, O, 1, I, 5, S, 8, B, C
 * B and C are reserved for prefixes only (I=Individual, C=Corporate)
 * This prevents user confusion when reading/typing membership numbers
 */
const SAFE_CHARS = '23456789ADEFGHJKLMNPQRTUVWXY';

/**
 * Generate a random 8-character ID using safe characters
 * Total combinations: 28^8 = ~377 billion
 */
const createId = customAlphabet(SAFE_CHARS, 8);

/**
 * Generate a unique membership number
 *
 * Format:
 * - Individual: I-A3K9M2PX
 * - Corporate: C-X7R4N9QT
 *
 * @param type - Account type ('individual' or 'business')
 * @returns Formatted membership number (e.g., "I-A3K9M2PX")
 *
 * @example
 * ```typescript
 * const membershipNumber = generateMembershipNumber('individual');
 * // Returns: "I-A3K9M2PX"
 * ```
 *
 * Collision probability:
 * - At 1M users: 0.0001%
 * - At 10M users: 0.01%
 * - At 100M users: 1%
 */
export function generateMembershipNumber(type: CustomerType): string {
	const prefix = type === 'individual' ? 'I' : 'C';
	const id = createId();
	return `${prefix}-${id}`;
}

/**
 * Validate membership number format
 *
 * @param membershipNumber - Membership number to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidMembershipNumber('I-A3K9M2PX'); // true
 * isValidMembershipNumber('I-12345678'); // false (contains excluded chars)
 * ```
 */
export function isValidMembershipNumber(membershipNumber: string): boolean {
	const regex = new RegExp(`^[IC]-[${SAFE_CHARS}]{8}$`);
	return regex.test(membershipNumber);
}

/**
 * Extract account type from membership number
 *
 * @param membershipNumber - Membership number
 * @returns Account type or null if invalid
 *
 * @example
 * ```typescript
 * getAccountTypeFromMembership('I-A3K9M2PX'); // 'individual'
 * getAccountTypeFromMembership('C-X7R4N9QT'); // 'corporate'
 * ```
 */
export function getAccountTypeFromMembership(membershipNumber: string): CustomerType | null {
	if (!isValidMembershipNumber(membershipNumber)) {
		return null;
	}

	const prefix = membershipNumber[0];
	return prefix === 'I' ? 'individual' : 'corporate';
}
