import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export class GoogleDriveError extends Error {
  constructor(
    message: string,
    public code?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'GoogleDriveError';
  }
}

export function handleGoogleApiError(error: any): never {
  if (error.code === 401 || error.code === 403) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Authentication error: ${error.message || 'Invalid or expired credentials'}`
    );
  }

  if (error.code === 404) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Resource not found: ${error.message || 'The requested file or resource does not exist'}`
    );
  }

  if (error.code === 429) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      'Rate limit exceeded. Please try again later.'
    );
  }

  if (error.code === 400) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Invalid request: ${error.message || 'The request parameters are invalid'}`
    );
  }

  throw new McpError(
    ErrorCode.InternalError,
    `Google Drive API error: ${error.message || 'Unknown error occurred'}`
  );
}

export function createMcpError(message: string, code: ErrorCode = ErrorCode.InternalError): McpError {
  return new McpError(code, message);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx except 429)
      if (error.code && error.code >= 400 && error.code < 500 && error.code !== 429) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
