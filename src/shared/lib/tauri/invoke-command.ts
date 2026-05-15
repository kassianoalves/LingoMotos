import { invoke } from '@tauri-apps/api/core';
import { AppError } from '@shared/types/app-error';

export async function invokeCommand<TResponse, TPayload extends Record<string, unknown> = Record<string, never>>(
  command: string,
  payload?: TPayload,
): Promise<TResponse> {
  try {
    return await invoke<TResponse>(command, payload);
  } catch (error) {
    throw AppError.fromUnknown(error);
  }
}

