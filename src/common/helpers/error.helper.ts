import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isAxiosError(error)) {
    const responseData = error.response?.data;
    const message =
      (responseData &&
        typeof responseData === 'object' &&
        'message' in responseData &&
        typeof responseData.message === 'string' &&
        responseData.message) ||
      (responseData &&
        typeof responseData === 'object' &&
        'error' in responseData &&
        typeof responseData.error === 'string' &&
        responseData.error) ||
      error.message ||
      'Erro na requisição HTTP';
    return message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'Erro desconhecido';
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }

  if (isAxiosError(error)) {
    return error.stack;
  }

  return undefined;
}

function isAxiosError(error: unknown): error is AxiosError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}

export function getErrorResponseData(error: unknown): unknown {
  if (isAxiosError(error)) {
    return error.response?.data;
  }

  return undefined;
}
