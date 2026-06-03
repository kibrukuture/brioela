import { traverse } from 'object-traversal';
import { z } from '@schnl/shared/zod';

/**
 * Post-process AI response to clean null/empty values
 *
 * Converts 0 → null and "" → null for nullable fields in the schema.
 * This handles OpenAI's behavior of returning 0/empty strings instead of null
 * when using structured outputs with strict mode.
 *
 * @param response - The raw AI response
 * @param schema - The Zod schema used for validation
 * @returns Cleaned and validated response
 *
 * @example
 * const cleaned = postProcessAIResponse(aiResponse, BiomarkerSchema);
 */
export function postProcessAIResponse<T extends z.ZodType>(response: unknown, schema: T): z.infer<T> {
	try {
		// Deep clone to avoid mutating original
		// Cast to Record<string, any> to satisfy traverse() type requirements
		const cloned = structuredClone(response) as Record<string, unknown>;

		// Build nullable fields map from schema
		const nullableFields = extractNullableFields(schema);

		// Traverse and clean 0 → null, "" → null
		traverse(cloned, ({ parent, key, value, meta }) => {
			// Skip root node (where parent and key are null)
			if (parent && key !== null && key !== undefined && meta.nodePath) {
				const path = meta.nodePath;

				// Check if this field path is nullable
				if (shouldConvertToNull(path, value, nullableFields)) {
					parent[key] = null;
				}
			}
		});

		// Re-validate with schema to ensure correctness
		const validated = schema.parse(cloned);

		return validated;
	} catch (error) {
		// Fail-safe: if post-processing fails, return original validated response
		console.warn('[PostProcessor] Post-processing failed, returning original:', error);
		return schema.parse(response);
	}
}

/**
 * Extract nullable field paths from Zod schema
 *
 * @param schema - Zod schema to analyze
 * @returns Set of field paths that are nullable
 */
function extractNullableFields(schema: z.ZodType): Set<string> {
	const nullableFields = new Set<string>();

	try {
		// Check if schema is an object
		if (schema instanceof z.ZodObject) {
			const shape = schema.shape;

			for (const [key, fieldSchema] of Object.entries(shape)) {
				analyzeField(key, fieldSchema as z.ZodType, nullableFields);
			}
		}
	} catch (error) {
		console.warn('[PostProcessor] Schema analysis failed:', error);
	}

	return nullableFields;
}

/**
 * Recursively analyze a field to find nullable paths
 *
 * @param path - Current field path
 * @param fieldSchema - Zod schema for this field
 * @param nullableFields - Set to collect nullable field paths
 */
function analyzeField(path: string, fieldSchema: z.ZodType, nullableFields: Set<string>): void {
	try {
		// Check if field is nullable
		if (fieldSchema instanceof z.ZodNullable) {
			nullableFields.add(path);

			// Get inner schema for further analysis
			const innerSchema = (fieldSchema as unknown as { _def?: { innerType?: z.ZodType } })._def?.innerType;
			if (innerSchema) {
				analyzeField(path, innerSchema, nullableFields);
			}
		}

		// Handle arrays
		else if (fieldSchema instanceof z.ZodArray) {
			const elementSchema = (fieldSchema as unknown as { _def?: { element?: z.ZodType } })._def?.element; // Zod v4 uses 'element' not 'type'
			if (elementSchema) {
				// Analyze array elements (they could have nested nullable fields)
				analyzeField(`${path}[]`, elementSchema, nullableFields);
			}
		}

		// Handle nested objects
		else if (fieldSchema instanceof z.ZodObject) {
			const shape = (fieldSchema as unknown as z.ZodObject<z.ZodRawShape>).shape;
			for (const [key, nestedSchema] of Object.entries(shape)) {
				analyzeField(`${path}.${key}`, nestedSchema as z.ZodType, nullableFields);
			}
		}
	} catch (error) {
		// Silently skip problematic fields
		console.debug('[PostProcessor] Failed to analyze field:', path, error);
	}
}

/**
 * Check if a value should be converted to null
 *
 * @param path - Field path
 * @param value - Current value
 * @param nullableFields - Set of nullable field paths
 * @returns True if value should be converted to null
 */
function shouldConvertToNull(path: string, value: unknown, nullableFields: Set<string>): boolean {
	// Only convert if field is nullable
	if (!isPathNullable(path, nullableFields)) {
		return false;
	}

	// Convert 0 to null for numeric fields
	if (value === 0) {
		return true;
	}

	// Convert empty string to null for string fields
	if (value === '') {
		return true;
	}

	return false;
}

/**
 * Check if a path is nullable (handles array notation)
 *
 * @param path - Field path (e.g., "biomarkers.0.reference_range_min")
 * @param nullableFields - Set of nullable field paths
 * @returns True if path is nullable
 */
function isPathNullable(path: string, nullableFields: Set<string>): boolean {
	// Direct match
	if (nullableFields.has(path)) {
		return true;
	}

	// Handle array paths: "biomarkers.0.notes" → "biomarkers[].notes"
	const normalizedPath = path.replace(/\.\d+\./g, '[].').replace(/\.\d+$/, '[]');
	if (nullableFields.has(normalizedPath)) {
		return true;
	}

	// Handle nested paths: check if any parent path is nullable
	const segments = path.split('.');
	for (let i = segments.length - 1; i >= 0; i--) {
		const parentPath = segments.slice(0, i + 1).join('.');
		const normalizedParent = parentPath.replace(/\d+/g, '[]');
		if (nullableFields.has(normalizedParent)) {
			return true;
		}
	}

	return false;
}
