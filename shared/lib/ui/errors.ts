export type UiErrorCode = string;

export type UiErrorDetails = {
  message: string;
  field?: string;
  meta?: Record<string, unknown>;
  debug?: string;
};

export class UiError<TCode extends UiErrorCode = UiErrorCode> extends Error {
  code: TCode;
  field?: string;
  meta?: Record<string, unknown>;
  debug?: string;

  constructor(code: TCode, details: UiErrorDetails) {
    super(details.message);
    this.name = "UiError";
    this.code = code;
    this.field = details.field;
    this.meta = details.meta;
    this.debug = details.debug;
  }
}

export function isUiError(error: unknown): error is UiError {
  return error instanceof UiError;
}
