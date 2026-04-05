import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    googleIdToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    googleIdToken?: string;
  }
}
