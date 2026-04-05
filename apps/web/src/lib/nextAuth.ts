import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const nextAuthOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile) {
        token.email = profile.email ?? token.email;
        token.name = profile.name ?? token.name;
        token.googleIdToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
      }
      session.googleIdToken =
        typeof token.googleIdToken === "string"
          ? token.googleIdToken
          : undefined;
      return session;
    },
  },
  debug: process.env.NODE_ENV !== "production",
};
