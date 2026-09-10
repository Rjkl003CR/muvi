import { NextResponse } from 'next/server';
import { supabase, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { name, email, avatar_url } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: updatedUser, error: updateErr } = await supabase
      .from('users')
      .update({ name, email, avatar_url })
      .eq('id', payload.sub)
      .select('id, name, email, avatar_url, email_verified')
      .single();

    if (updateErr) {
      console.error('Profile update error', updateErr);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('Update profile error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
