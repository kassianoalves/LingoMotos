import { invokeCommand } from '@shared/lib/tauri/invoke-command';

export type CommandClient = {
  execute<TResponse, TPayload extends Record<string, unknown> = Record<string, never>>(
    command: string,
    payload?: TPayload,
  ): Promise<TResponse>;
};

export const localCommandClient: CommandClient = {
  execute: invokeCommand,
};

