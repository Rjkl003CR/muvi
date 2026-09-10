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
      .from("movies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Supabase select error:", dbError);
      return NextResponse.json({ error: "Failed to fetch movies" }, { status: 500 });
    }

    return NextResponse.json({ movies });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Movie ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First fetch the movie to ensure it belongs to the user and we can get the drive ID if we wanted to delete from drive
    const { data: movie, error: fetchError } = await supabase
      .from("movies")
      .select("drive_file_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !movie) {
        return NextResponse.json({ error: "Movie not found or unauthorized" }, { status: 404 });
    }

    // Delete from Supabase
    const { error: dbError } = await supabase
      .from("movies")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (dbError) {
      console.error("Supabase delete error:", dbError);
      return NextResponse.json({ error: "Failed to delete movie from database" }, { status: 500 });
    }
    
    // Note: We are currently NOT deleting the file from Google Drive to avoid accidental data loss 
    // and because we don't necessarily have the user's access token available in this request.
    // To delete from drive, we would need to pass the access token or manage service account credentials.

    return NextResponse.json({ success: true, message: "Movie deleted from library" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
