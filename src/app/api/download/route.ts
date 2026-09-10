import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// We'll use the Web Streams API to fetch the video and stream it to Google Drive.
// Since this is a serverless function, be mindful of Vercel timeout limits (10s on hobby plan)
// For large files, you might need a background worker or edge function.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, title, accessToken } = body;

    if (!url || !accessToken) {
      return NextResponse.json(
        { error: "URL and Google Access Token are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch the video stream from the URL
    // We do a HEAD request first to check size and content type, though it might fail if CORS/server doesn't allow it.
    let fileSize = 0;
    let mimeType = "video/mp4";
    let finalTitle = title || "Downloaded Movie";

    try {
      const headRes = await fetch(url, { method: "HEAD" });
      if (headRes.ok) {
        fileSize = parseInt(headRes.headers.get("content-length") || "0", 10);
        mimeType = headRes.headers.get("content-type") || mimeType;
      }
    } catch (e) {
      console.warn("HEAD request failed, proceeding with GET", e);
    }

    const videoRes = await fetch(url);
    if (!videoRes.ok) {
      throw new Error(`Failed to fetch video from URL: ${videoRes.statusText}`);
    }

    if (!fileSize) {
      fileSize = parseInt(videoRes.headers.get("content-length") || "0", 10);
    }
    mimeType = videoRes.headers.get("content-type") || mimeType;

    // 2. Upload to Google Drive using chunked/resumable upload or direct multipart if small.
    // For simplicity, we'll try a multipart upload first, but streaming is better for memory.
    // Note: Node's fetch handles streams, but Google Drive multipart requires building the body carefully.
    
    // We'll buffer the video for now. In a real production app with large movies, 
    // you would use the resumable upload API and pipe the stream to avoid memory issues.
    
    // Warning: Buffering large files will hit memory limits on serverless.
    // Assuming short/small videos for the scope of this demo, or we pipe it.
    
    const buffer = await videoRes.arrayBuffer();
    fileSize = buffer.byteLength;

    const metadata = {
      name: finalTitle,
      mimeType: mimeType,
    };

    const form = new FormData();
    form.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("file", new Blob([buffer], { type: mimeType }));

    const uploadRes = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: form,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Google Drive Upload Failed: ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;
    let viewUrl = uploadData.webViewLink;

    // 3. Set file permissions so anyone can view it
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      }
    );

    if (!permRes.ok) {
      console.warn("Failed to set permissions, the file might remain private.");
    }
    
    // We can construct the view URL manually if needed
    if (!viewUrl) {
       viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    }

    // 4. Save metadata to Supabase
    const { data: dbData, error: dbError } = await supabase
      .from("movies")
      .insert({
        user_id: user.id,
        title: finalTitle,
        original_url: url,
        drive_file_id: fileId,
        drive_view_url: viewUrl,
        file_size: fileSize,
        mime_type: mimeType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      throw new Error("Failed to save movie metadata to database");
    }

    return NextResponse.json({
      message: "Download complete",
      ...dbData,
    });
  } catch (error: any) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
