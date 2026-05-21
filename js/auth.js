import { sb } from './supabase.js';

export const ADMIN_UID = '91d6a183-4811-4789-8f72-20eb3dd678d8';

export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

export async function isAdmin() {
  const s = await getSession();
  return !!s && s.user.id === ADMIN_UID;
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (data.user.id !== ADMIN_UID) {
    await sb.auth.signOut();
    throw new Error('Account is valid but not the admin user.');
  }
  return data.user;
}

export async function signOut() {
  await sb.auth.signOut();
}

export function onAuthChange(cb) {
  return sb.auth.onAuthStateChange((_evt, session) => cb(session));
}
