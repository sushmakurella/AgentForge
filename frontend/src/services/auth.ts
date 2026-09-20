import { createAuthClient } from 'better-auth/react';

function getBackendUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:4000';
  let u = envUrl.trim().replace(/\/$/, '');
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    if (!u.includes('.')) {
      u = `${u}.onrender.com`;
    }
    u = `https://${u}`;
  }
  return u;
}

export const authClient = createAuthClient({
  baseURL: getBackendUrl(),
  fetchOptions: {
    credentials: 'include',
    onRequest(ctx) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('agentforge_token') : null;
      if (token) {
        ctx.headers.set('Authorization', `Bearer ${token}`);
      }
    },
    onResponse(ctx) {
      try {
        const setToken = ctx.response.headers.get('set-auth-token');
        if (setToken && typeof window !== 'undefined') {
          localStorage.setItem('agentforge_token', setToken);
        }
      } catch {}
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

