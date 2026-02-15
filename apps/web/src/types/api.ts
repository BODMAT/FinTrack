export type ApiResponse<T> =
  | { data: T; error?: never }
  | {
      data?: never;
      error: {
        message?: string;
        error?: string;
        code?: number;
      };
    };

export interface ApiError {
  message: string;
  error: string;
  code: number;
}
