import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form';

type ZodIssueLike = {
  path: PropertyKey[];
  code?: string;
  message: string;
};

type SafeParseSuccess<TOutput> = {
  success: true;
  data: TOutput;
};

type SafeParseFailure = {
  success: false;
  error: {
    issues?: ZodIssueLike[];
  };
};

type ZodSchemaLike<TOutput> = {
  safeParse: (data: unknown) => SafeParseSuccess<TOutput> | SafeParseFailure;
};

function setNestedError(target: Record<string, unknown>, path: string[], value: FieldError): void {
  let current: Record<string, unknown> = target;

  for (let i = 0; i < path.length; i += 1) {
    const key = path[i];
    if (!key) return;

    if (i === path.length - 1) {
      current[key] = value;
      return;
    }

    const next = current[key];
    if (typeof next === 'object' && next !== null) {
      current = next as Record<string, unknown>;
    } else {
      const created: Record<string, unknown> = {};
      current[key] = created;
      current = created;
    }
  }
}

export function zodResolver<TFieldValues extends FieldValues>(
  schema: ZodSchemaLike<TFieldValues>
): Resolver<TFieldValues> {
  return async (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errorsRoot: Record<string, unknown> = {};

    for (const issue of result.error.issues ?? []) {
      const path = (issue.path ?? [])
        .filter((p): p is string | number => typeof p === 'string' || typeof p === 'number')
        .map(String)
        .filter(Boolean);
      if (path.length === 0) continue;

      setNestedError(errorsRoot, path, {
        type: issue.code ?? 'validation',
        message: issue.message,
      });
    }

    return { values: {}, errors: errorsRoot as FieldErrors<TFieldValues> };
  };
}
