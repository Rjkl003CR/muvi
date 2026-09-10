// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';
import { supabase, hashPassword, signAccessToken, signRefreshToken, storeRefreshToken } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existing, error: existErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (existErr && existErr.code !== 'PGRST116') {
      // Unexpected error
      console.error('Supabase error', existErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const userId = uuidv4();
    const { error: insertErr } = await supabase.from('users').insert({
      id: userId,
      email,
      password_hash: passwordHash,
      name: name ?? null,
      email_verified: false,
    });
    if (insertErr) {
      console.error('Insert error', insertErr);
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 });
    }

    const payload = { sub: userId, email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    const refreshExpires = new Date();
    refreshExpires.setDate(refreshExpires.getDate() + 7); // 7 days
    await storeRefreshToken(userId, refreshToken, refreshExpires.toISOString());

    const response = NextResponse.json({ success: true });
    // HttpOnly cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60, // 15 min
    });
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    return response;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
