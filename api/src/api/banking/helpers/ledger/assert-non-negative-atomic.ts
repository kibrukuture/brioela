import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export function assertNonNegativeAtomic(value: bigint, message: string) {
	if (value < 0n) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message });
	}
}
