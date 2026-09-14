import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: movies, error: dbError } = await supabase
      .from("movies").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (dbError) {
      return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
    }
    return NextResponse.json({ movies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, genres, release_year, imdb_rating, poster_url } = body;
    if (!id) return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (genres !== undefined) updates.genres = genres;
    if (release_year !== undefined) updates.release_year = release_year;
    if (imdb_rating !== undefined) updates.imdb_rating = imdb_rating;
    if (poster_url !== undefined) updates.poster_url = poster_url;
    const { data: movie, error: dbError } = await supabase
      .from("movies").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (dbError) return NextResponse.json({ error: "Failed to update movie" }, { status: 500 });
    return NextResponse.json({ movie });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: movie, error: fetchError } = await supabase
      .from("movies").select("drive_file_id").eq("id", id).eq("user_id", user.id).single();
    if (fetchError || !movie) return NextResponse.json({ error: "Movie not found or unauthorized" }, { status: 404 });
    const { error: dbError } = await supabase.from("movies").delete().eq("id", id).eq("user_id", user.id);
    if (dbError) return NextResponse.json({ error: "Failed to delete movie from database" }, { status: 500 });
    return NextResponse.json({ success: true, message: "Movie deleted from library" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
