type SerializedBackendError = {
  code?: string;
  message?: string;
  details?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly details?: unknown;

  private constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }

  static fromUnknown(error: unknown): AppError {
    if (typeof error === 'string') {
      return new AppError(error, 'UNKNOWN');
    }

    if (isSerializedBackendError(error)) {
      return new AppError(
        error.message ?? 'Erro inesperado',
        error.code ?? 'BACKEND_ERROR',
        error.details,
      );
    }

    if (error instanceof Error) {
      return new AppError(error.message, 'CLIENT_ERROR');
    }

    return new AppError('Erro inesperado', 'UNKNOWN');
  }
}

function isSerializedBackendError(error: unknown): error is SerializedBackendError {
  return typeof error === 'object' && error !== null && ('message' in error || 'code' in error);
}

