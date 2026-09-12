import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseServerClient } from "@/utils/supabase/server";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";

// In-memory fallback cache if Supabase table is not yet created
let fallbackVaultMeta: Record<string, { salt: string; checkHash: string }> = {};
let fallbackVaultItems: Record<string, any[]> = {};

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

    let meta: { salt: string; checkHash: string } | null = null;
    let items: any[] = [];
    let dbSuccess = false;

    if (supabase) {
      // 1. Fetch meta
      const { data: metaData, error: metaErr } = await supabase
        .from("vault_meta")
        .select("salt, check_hash")
        .eq("user_id", userId)
        .single();

      if (!metaErr && metaData) {
        meta = { salt: metaData.salt, checkHash: metaData.check_hash };
      }

      // 2. Fetch items
      const { data: itemsData, error: itemsErr } = await supabase
        .from("vault_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!itemsErr && itemsData) {
        items = itemsData.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          encryptedData: item.encrypted_data,
          fileName: item.file_name,
          fileType: item.file_type,
          fileSize: item.file_size,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
        dbSuccess = true;
      }
    }

    if (!meta && fallbackVaultMeta[userId]) {
      meta = fallbackVaultMeta[userId];
    }
    if (items.length === 0 && fallbackVaultItems[userId]) {
      items = fallbackVaultItems[userId];
    }

    const res = NextResponse.json({ meta, items, dbSynced: dbSuccess });
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
    console.error("GET /api/vault error:", err);
    return NextResponse.json({ meta: null, items: [], error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, setCookieId } = await getUserId();
    const body = await request.json();
    const { action } = body;
    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (action === "setup") {
      const { salt, checkHash } = body;
      if (!salt || !checkHash) {
        return NextResponse.json({ error: "Salt and check hash required" }, { status: 400 });
      }

      if (supabase) {
        const { error } = await supabase.from("vault_meta").upsert({
          user_id: userId,
          salt,
          check_hash: checkHash,
          updated_at: new Date().toISOString(),
        });
        if (!error) dbSuccess = true;
      }

      fallbackVaultMeta[userId] = { salt, checkHash };
      return NextResponse.json({ success: true, dbSynced: dbSuccess });
    }

    if (action === "save_item") {
      const { item } = body;
      if (!item || !item.id || !item.encryptedData) {
        return NextResponse.json({ error: "Invalid item payload" }, { status: 400 });
      }

      const record = {
        id: item.id,
        user_id: userId,
        type: item.type || "note",
        title: item.title || "Secure Item",
        encrypted_data: item.encryptedData,
        file_name: item.fileName || null,
        file_type: item.fileType || null,
        file_size: item.fileSize || null,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt || new Date().toISOString(),
      };

      if (supabase) {
        const { error } = await supabase.from("vault_items").upsert(record);
        if (!error) dbSuccess = true;
      }

      if (!fallbackVaultItems[userId]) fallbackVaultItems[userId] = [];
      const idx = fallbackVaultItems[userId].findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        fallbackVaultItems[userId][idx] = item;
      } else {
        fallbackVaultItems[userId].unshift(item);
      }

      const res = NextResponse.json({ success: true, item, dbSynced: dbSuccess });
      if (setCookieId) {
        res.cookies.set("muvi_uid", setCookieId, {
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          sameSite: "lax",
        });
      }
      return res;
    }

    if (action === "sync_items") {
      const { items } = body;
      if (Array.isArray(items)) {
        fallbackVaultItems[userId] = items;
        if (supabase) {
          // Clean delete removed items & upsert current items
          await supabase.from("vault_items").delete().eq("user_id", userId);
          if (items.length > 0) {
            const records = items.map((i: any) => ({
              id: i.id,
              user_id: userId,
              type: i.type || "note",
              title: i.title || "Secure Item",
              encrypted_data: i.encryptedData,
              file_name: i.fileName || null,
              file_type: i.fileType || null,
              file_size: i.fileSize || null,
              created_at: i.createdAt || new Date().toISOString(),
              updated_at: i.updatedAt || new Date().toISOString(),
            }));
            const { error } = await supabase.from("vault_items").insert(records);
            if (!error) dbSuccess = true;
          }
        }
      }
      return NextResponse.json({ success: true, dbSynced: dbSuccess });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/vault error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await getUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    let dbSuccess = false;

    if (supabase) {
      const { error } = await supabase
        .from("vault_items")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      if (!error) dbSuccess = true;
    }

    if (fallbackVaultItems[userId]) {
      fallbackVaultItems[userId] = fallbackVaultItems[userId].filter((i) => i.id !== id);
    }

    return NextResponse.json({ success: true, dbSynced: dbSuccess });
  } catch (err: any) {
    console.error("DELETE /api/vault error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
