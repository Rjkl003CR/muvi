import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

// In-memory fallback cache if Supabase table is not yet created in the user's project
let fallbackNotes: Record<string, any[]> = {};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !serviceKey) return null;
  return createSupabaseJsClient(url, serviceKey);
}

async function getUserId(): Promise<{ userId: string; setCookieId?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      return { userId: user.id };
    }
  } catch {}

  const cookieStore = await cookies();
  const existingUid = cookieStore.get("muvi_uid")?.value;
  if (existingUid) {
    return { userId: existingUid };
  }

  const newUid = "u_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  return { userId: newUid, setCookieId: newUid };
}

export async function GET() {
  try {
    const { userId, setCookieId } = await getUserId();
    const supabase = getSupabaseAdmin();

    let notes: any[] = [];
    let dbSuccess = false;

    if (supabase) {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", userId)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (!error && data) {
        notes = data.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: n.tags || [],
          color: n.color || "default",
          pinned: !!n.pinned,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
        }));
        dbSuccess = true;
      }
    }

    if (!dbSuccess) {
      notes = fallbackNotes[userId] || [];
    }

    const res = NextResponse.json({ notes, dbSynced: dbSuccess });
    if (setCookieId) {
      res.cookies.set("muvi_uid", setCookieId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
      });
    }
    return res;
  } catch (err: any) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json({ notes: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, setCookieId } = await getUserId();
    const body = await request.json();
    const { id, title, content, tags, color, pinned, createdAt, updatedAt } = body;

    const noteRecord = {
      id: id || Date.now().toString(36) + Math.random().toString(36).slice(2),
      user_id: userId,
      title: title || "Untitled Note",
      content: content || "",
      tags: tags || [],
      color: color || "default",
      pinned: !!pinned,
      created_at: createdAt || new Date().toISOString(),
      updated_at: updatedAt || new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase.from("notes").upsert(noteRecord);
      if (!error) {
        dbSuccess = true;
      } else {
        console.warn("Supabase upsert note notice:", error.message);
      }
    }

    // Always update fallback cache
    if (!fallbackNotes[userId]) fallbackNotes[userId] = [];
    const idx = fallbackNotes[userId].findIndex((n) => n.id === noteRecord.id);
    const clientNote = {
      id: noteRecord.id,
      title: noteRecord.title,
      content: noteRecord.content,
      tags: noteRecord.tags,
      color: noteRecord.color,
      pinned: noteRecord.pinned,
      createdAt: noteRecord.created_at,
      updatedAt: noteRecord.updated_at,
    };
    if (idx >= 0) {
      fallbackNotes[userId][idx] = clientNote;
    } else {
      fallbackNotes[userId].unshift(clientNote);
    }

    const res = NextResponse.json({ success: true, note: clientNote, dbSynced: dbSuccess });
    if (setCookieId) {
      res.cookies.set("muvi_uid", setCookieId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: "lax",
      });
    }
    return res;
  } catch (err: any) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await getUserId();
    const body = await request.json();
    const { id, title, content, tags, color, pinned } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updateData: any = { updated_at: now };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (tags !== undefined) updateData.tags = tags;
    if (color !== undefined) updateData.color = color;
    if (pinned !== undefined) updateData.pinned = !!pinned;

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase
        .from("notes")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) dbSuccess = true;
    }

    if (fallbackNotes[userId]) {
      const idx = fallbackNotes[userId].findIndex((n) => n.id === id);
      if (idx >= 0) {
        fallbackNotes[userId][idx] = {
          ...fallbackNotes[userId][idx],
          ...updateData,
          updatedAt: now,
        };
      }
    }

    return NextResponse.json({ success: true, dbSynced: dbSuccess, updatedAt: now });
  } catch (err: any) {
    console.error("PUT /api/notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) dbSuccess = true;
    }

    if (fallbackNotes[userId]) {
      fallbackNotes[userId] = fallbackNotes[userId].filter((n) => n.id !== id);
    }

    return NextResponse.json({ success: true, dbSynced: dbSuccess });
  } catch (err: any) {
    console.error("DELETE /api/notes error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
