import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

export interface ShortcutRecord {
  id: string;
  title: string;
  url: string;
  username_hint?: string;
  category: string;
  color?: string;
  pinned?: boolean;
  clicks?: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SHORTCUTS: ShortcutRecord[] = [
  {
    id: "default-google",
    title: "Google Accounts",
    url: "https://accounts.google.com",
    username_hint: "Primary Google Account",
    category: "Cloud & Dev",
    color: "gold",
    pinned: true,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-github",
    title: "GitHub",
    url: "https://github.com/login",
    username_hint: "Developer Account",
    category: "Cloud & Dev",
    color: "lavender",
    pinned: true,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-supabase",
    title: "Supabase Dashboard",
    url: "https://supabase.com/dashboard/sign-in",
    username_hint: "Database Console",
    category: "Cloud & Dev",
    color: "mint",
    pinned: false,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-netflix",
    title: "Netflix",
    url: "https://www.netflix.com/login",
    username_hint: "Streaming Account",
    category: "Streaming",
    color: "coral",
    pinned: true,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "default-chatgpt",
    title: "OpenAI ChatGPT",
    url: "https://chatgpt.com/auth/login",
    username_hint: "AI Workspace",
    category: "Work & Productivity",
    color: "mint",
    pinned: false,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let fallbackShortcuts: Record<string, ShortcutRecord[]> = {};

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

    let shortcuts: ShortcutRecord[] = [];
    let dbSuccess = false;

    if (supabase) {
      const { data, error } = await supabase
        .from("shortcuts")
        .select("*")
        .eq("user_id", userId)
        .order("pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        shortcuts = data.map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          username_hint: s.username_hint || "",
          category: s.category || "General",
          color: s.color || "default",
          pinned: !!s.pinned,
          clicks: s.clicks || 0,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));
        dbSuccess = true;
      }
    }

    if (shortcuts.length === 0) {
      if (!fallbackShortcuts[userId]) {
        fallbackShortcuts[userId] = [...DEFAULT_SHORTCUTS];
      }
      shortcuts = fallbackShortcuts[userId];
    }

    const res = NextResponse.json({ shortcuts, dbSynced: dbSuccess });
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
    console.error("GET /api/shortcuts error:", err);
    return NextResponse.json({ shortcuts: DEFAULT_SHORTCUTS, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, setCookieId } = await getUserId();
    const body = await request.json();
    const { id, title, url, username_hint, category, color, pinned, clicks, batch } = body;

    // Handle batch import
    if (batch && Array.isArray(batch)) {
      fallbackShortcuts[userId] = batch;
      const supabase = getSupabaseAdmin();
      let dbSuccess = false;
      if (supabase) {
        await supabase.from("shortcuts").delete().eq("user_id", userId);
        const records = batch.map((s) => ({
          id: s.id,
          user_id: userId,
          title: s.title,
          url: s.url,
          username_hint: s.username_hint || "",
          category: s.category || "General",
          color: s.color || "default",
          pinned: !!s.pinned,
          clicks: s.clicks || 0,
          created_at: s.createdAt || new Date().toISOString(),
          updated_at: s.updatedAt || new Date().toISOString(),
        }));
        const { error } = await supabase.from("shortcuts").insert(records);
        if (!error) dbSuccess = true;
      }
      return NextResponse.json({ success: true, count: batch.length, dbSynced: dbSuccess });
    }

    const shortcutRecord = {
      id: id || Date.now().toString(36) + Math.random().toString(36).slice(2),
      user_id: userId,
      title: title || "New Shortcut",
      url: url || "https://",
      username_hint: username_hint || "",
      category: category || "General",
      color: color || "default",
      pinned: !!pinned,
      clicks: clicks || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase.from("shortcuts").upsert(shortcutRecord);
      if (!error) dbSuccess = true;
    }

    if (!fallbackShortcuts[userId]) {
      fallbackShortcuts[userId] = [...DEFAULT_SHORTCUTS];
    }
    const clientRecord: ShortcutRecord = {
      id: shortcutRecord.id,
      title: shortcutRecord.title,
      url: shortcutRecord.url,
      username_hint: shortcutRecord.username_hint,
      category: shortcutRecord.category,
      color: shortcutRecord.color,
      pinned: shortcutRecord.pinned,
      clicks: shortcutRecord.clicks,
      createdAt: shortcutRecord.created_at,
      updatedAt: shortcutRecord.updated_at,
    };

    const idx = fallbackShortcuts[userId].findIndex((s) => s.id === shortcutRecord.id);
    if (idx >= 0) {
      fallbackShortcuts[userId][idx] = clientRecord;
    } else {
      fallbackShortcuts[userId].unshift(clientRecord);
    }

    const res = NextResponse.json({ success: true, shortcut: clientRecord, dbSynced: dbSuccess });
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
    console.error("POST /api/shortcuts error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await getUserId();
    const body = await request.json();
    const { id, title, url, username_hint, category, color, pinned, clicks } = body;

    if (!id) {
      return NextResponse.json({ error: "Shortcut ID required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const updateData: any = { updated_at: now };
    if (title !== undefined) updateData.title = title;
    if (url !== undefined) updateData.url = url;
    if (username_hint !== undefined) updateData.username_hint = username_hint;
    if (category !== undefined) updateData.category = category;
    if (color !== undefined) updateData.color = color;
    if (pinned !== undefined) updateData.pinned = !!pinned;
    if (clicks !== undefined) updateData.clicks = clicks;

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase
        .from("shortcuts")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) dbSuccess = true;
    }

    if (fallbackShortcuts[userId]) {
      const idx = fallbackShortcuts[userId].findIndex((s) => s.id === id);
      if (idx >= 0) {
        fallbackShortcuts[userId][idx] = {
          ...fallbackShortcuts[userId][idx],
          ...updateData,
          updatedAt: now,
        };
      }
    }

    return NextResponse.json({ success: true, dbSynced: dbSuccess });
  } catch (err: any) {
    console.error("PUT /api/shortcuts error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Shortcut ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase
        .from("shortcuts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) dbSuccess = true;
    }

    if (fallbackShortcuts[userId]) {
      fallbackShortcuts[userId] = fallbackShortcuts[userId].filter((s) => s.id !== id);
    }

    return NextResponse.json({ success: true, dbSynced: dbSuccess });
  } catch (err: any) {
    console.error("DELETE /api/shortcuts error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
