import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  let u = url.trim().replace(/\/$/, '');
  if (!u) return undefined;
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    if (!u.includes('.')) {
      u = `${u}.onrender.com`;
    }
    u = `https://${u}`;
  }
  return u;
}

if (process.env.BETTER_AUTH_URL) {
  const normalized = normalizeUrl(process.env.BETTER_AUTH_URL);
  if (normalized) {
    process.env.BETTER_AUTH_URL = normalized;
  }
}

const frontendUrl = normalizeUrl(process.env.FRONTEND_URL);

export const auth = betterAuth({
  baseURL: normalizeUrl(process.env.BETTER_AUTH_URL),
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...(frontendUrl ? [frontendUrl] : []),
  ],
});

