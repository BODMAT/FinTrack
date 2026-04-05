import NextAuth from "next-auth";
import { nextAuthOptions } from "@/lib/nextAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = NextAuth(nextAuthOptions);

export { handler as GET, handler as POST };
