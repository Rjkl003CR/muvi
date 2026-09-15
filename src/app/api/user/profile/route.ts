import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, avatar_url } = await request.json();

    const { data: updatedData, error: updateErr } = await supabase.auth.updateUser({
      data: {
        name: name,
        avatar_url: avatar_url
      }
    });

    if (updateErr) {
      console.error('Profile update error', updateErr);
      return NextResponse.json({ error: `Failed to update profile: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedData.user });

  } catch (error) {
    console.error('Update profile error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
