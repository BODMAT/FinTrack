declare module "csrf-csrf" {
  import type { Request, Response } from "express";

  export type DoubleCsrfOptions = {
    getSecret: () => string;
    getSessionIdentifier: (req: Request) => string;
    cookieName: string;
    cookieOptions: {
      httpOnly: boolean;
      sameSite: "lax" | "strict" | "none";
      secure: boolean;
      path: string;
    };
    getCsrfTokenFromRequest: (req: Request) => string | undefined;
    skipCsrfProtection: (req: Request) => boolean;
  };

  export type DoubleCsrfProtection = (
    req: Request,
    res: Response,
    next: (err?: unknown) => void,
  ) => void;

  export type DoubleCsrfResult = {
    generateCsrfToken: (req: Request, res: Response) => string;
    doubleCsrfProtection: DoubleCsrfProtection;
  };

  export function doubleCsrf(options: DoubleCsrfOptions): DoubleCsrfResult;
}
