import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import { isReservedSchnlTag } from '@brioela/shared/utils/schnl-tag';
import { HTTPException } from 'hono/http-exception';

const schnlTagProfanityMatcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

function isProfaneCandidate(candidate: string): boolean {
	if (!candidate) return false;
	return schnlTagProfanityMatcher.hasMatch(candidate);
}

function buildSchnlTagCandidates(tag: string): readonly string[] {
	const withoutSeparators = tag.replace(/[._]/g, '');
	const collapsedRepeats = tag.replace(/(.)\1{2,}/g, '$1$1');
	const collapsedRepeatsWithoutSeparators = withoutSeparators.replace(/(.)\1{2,}/g, '$1$1');

	return [tag, withoutSeparators, collapsedRepeats, collapsedRepeatsWithoutSeparators];
}

export function assertSchnlTagAllowed(tag: string): void {
	if (isReservedSchnlTag(tag)) {
		throw new HTTPException(400, { message: 'This SchnlTag is reserved' });
	}

	for (const candidate of buildSchnlTagCandidates(tag)) {
		if (isProfaneCandidate(candidate)) {
			throw new HTTPException(400, { message: 'This SchnlTag contains profanity. Please choose a respectful tag.' });
		}
	}
}
