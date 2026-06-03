import { isUiError } from '@brioela/shared/lib';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export function applyFormError<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>
): boolean {
  if (isUiError(error) && error.field) {
    setError(error.field as Path<TFieldValues>, { message: error.message });
    return true;
  }

  return false;
}
