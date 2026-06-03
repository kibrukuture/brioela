// src/lib/vector-sync.ts

/**
 * Vector sync utilities for Cloudflare Vectorize
 * Handles syncing embeddings between Supabase and Vectorize
 */

import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export interface VectorSyncOptions {
	id: string;
	embedding: number[];
	table: string;
	metadata?: Record<string, string | number | boolean>;
}

export interface VectorSearchOptions {
	topK?: number;
	filter?: Record<string, string | number | boolean>;
	returnMetadata?: boolean;
}

export interface VectorSearchResult {
	id: string;
	score: number;
	metadata?: Record<string, unknown>;
}

/**
 * Sync a vector to Vectorize after insert/update
 * @param vectorize - Cloudflare Vectorize binding
 * @param options - Vector data including id, embedding, and table name
 */
export async function syncVector(vectorize: Vectorize, options: VectorSyncOptions): Promise<void> {
	const { id, embedding, table, metadata = {} } = options;

	if (!id) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Vector sync requires an id' });
	}

	if (!embedding || embedding.length === 0) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Vector sync requires a non-empty embedding array' });
	}

	if (!table) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Vector sync requires a table name' });
	}

	try {
		await vectorize.upsert([
			{
				id,
				values: embedding,
				metadata: {
					table,
					...metadata,
				},
			},
		]);
	} catch (error) {
		console.error(`Failed to sync vector for ${table}:${id}`, error);
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message });
	}
}

/**
 * Delete a vector from Vectorize after delete
 * @param vectorize - Cloudflare Vectorize binding
 * @param id - The ID of the vector to delete
 */
export async function deleteVector(vectorize: Vectorize, id: string): Promise<void> {
	if (!id) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Vector deletion requires an id' });
	}

	try {
		await vectorize.deleteByIds([id]);
	} catch (error) {
		console.error(`Failed to delete vector ${id}`, error);
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message });
	}
}

/**
 * Batch delete vectors from Vectorize
 * @param vectorize - Cloudflare Vectorize binding
 * @param ids - Array of IDs to delete
 */
export async function deleteVectors(vectorize: Vectorize, ids: string[]): Promise<void> {
	if (!ids || ids.length === 0) {
		return;
	}

	try {
		await vectorize.deleteByIds(ids);
	} catch (error) {
		console.error(`Failed to delete vectors`, error);
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message });
	}
}

/**
 * Search for similar vectors
 * @param vectorize - Cloudflare Vectorize binding
 * @param queryEmbedding - The embedding to search for
 * @param options - Search options including topK and filters
 * @returns Array of matching results with IDs and scores
 */
export async function searchVectors(
	vectorize: Vectorize,
	queryEmbedding: number[],
	options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
	const { topK = 10 } = options;

	if (!queryEmbedding || queryEmbedding.length === 0) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Search requires a non-empty query embedding' });
	}

	try {
		const results = await vectorize.query(queryEmbedding, {
			topK,
			// returnMetadata: ""
		});

		return results.matches.map((match) => ({
			id: match.id,
			score: match.score,
			metadata: match.metadata,
		}));
	} catch (error) {
		console.error('Failed to search vectors', error);
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message });
	}
}

/**
 * Get vectors by IDs (useful for migration back to Supabase)
 * @param vectorize - Cloudflare Vectorize binding
 * @param ids - Array of IDs to retrieve
 * @returns Array of vectors with their embeddings
 */
export async function getVectorsByIds(
	vectorize: VectorizeIndex,
	ids: string[]
): Promise<Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>> {
	if (!ids || ids.length === 0) {
		return [];
	}

	try {
		const results = await vectorize.getByIds(ids);
		return results.map((r) => ({
			...r,
			values: Array.from(r.values),
		}));
	} catch (error) {
		console.error('Failed to get vectors by IDs', error);
		if (error instanceof HTTPException) throw error;
		const message = error instanceof Error ? error.message : String(error);
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, { message });
	}
}
