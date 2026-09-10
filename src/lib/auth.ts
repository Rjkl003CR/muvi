// src/lib/auth.ts
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

// Supabase client (environment variables must be set)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ---------- Password utilities ----------
export const hashPassword = async (plain: string): Promise<string> => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(plain, salt);
};

export const verifyPassword = async (plain: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(plain, hash);
};

// ---------- JWT utilities ----------
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const ACCESS_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface TokenPayload {
  sub: string; // user id
  email: string;
}

export const signAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES as any };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const signRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES as any };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { sub: decoded.sub as string, email: decoded.email as string };
  } catch {
    return null;
  }
};

// ---------- Refresh token storage (Supabase table) ----------
export const storeRefreshToken = async (userId: string, token: string, expiresAt: string) => {
  const { error } = await supabase.from('refresh_tokens').insert({ user_id: userId, token, expires_at: expiresAt });
  if (error) throw error;
};

export const revokeRefreshToken = async (token: string) => {
  await supabase.from('refresh_tokens').delete().eq('token', token);
};

export const isRefreshTokenValid = async (token: string): Promise<boolean> => {
  const { data, error } = await supabase.from('refresh_tokens').select('id').eq('token', token).single();
  if (error) return false;
  return !!data;
};
