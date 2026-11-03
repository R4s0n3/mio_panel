import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

import { db } from "@/server/db";
import { isVerifiedOwnerSignIn } from "./owner";
import type { MioRole } from "@prisma/client";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      role: MioRole;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    // Discord sends RFC 9207 `iss=https://discord.com` on the OAuth callback.
    // Auth.js otherwise checks it against the placeholder https://authjs.dev
    // and rejects the sign-in. Token and userinfo URLs stay absolute, so this
    // does not turn on OpenID discovery. next-auth@5.0.0-beta.32 still lacks
    // the issuer (nextauthjs/next-auth#13504).
    DiscordProvider({
      issuer: "https://discord.com",
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile }) {
      return isVerifiedOwnerSignIn(user.email, account?.provider, profile);
    },
    session: async ({ session, user }) => {
      const account = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: account?.role ?? "LOSER",
        },
      };
    },
  },
} satisfies NextAuthConfig;
