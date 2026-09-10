import { NextResponse } from 'next/server';
import { supabase, hashPassword, verifyPassword, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new passwords are required' }, { status: 400 });
    }

    // Fetch user from DB
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', payload.sub)
      .single();

    if (userErr || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 });
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);
    
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', payload.sub);

    if (updateErr) {
      console.error('Password update error', updateErr);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Update password error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
