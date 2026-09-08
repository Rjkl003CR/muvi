"use client";

import { useState } from "react";
import { Upload, FileVideo, CheckCircle, AlertCircle } from "lucide-react";

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const token = localStorage.getItem("google_access_token");
    if (!token) {
      setStatus("error");
      setMessage("You must be signed in with Google to upload.");
      return;
    }

    setUploading(true);
    setStatus("idle");

    try {
      // 1. Upload file to Google Drive
      const metadata = { name: file.name, mimeType: file.type };
      const form = new FormData();
      form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      form.append("file", file);

      const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload to Google Drive");
      const uploadData = await uploadRes.json();
      const fileId = uploadData.id;

      // 2. Set file permissions so anyone can view it
      const permRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      });

      if (!permRes.ok) throw new Error("Failed to set file permissions");

      setStatus("success");
      setMessage("Upload complete!");
      // TODO: Save fileId to Supabase DB here

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(err.message || "An error occurred during upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-500" /> Upload Movie
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Select Video File
        </label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileVideo className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Click to browse</span> or drag and drop
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {file && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Selected: <span className="font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
        </div>
      )}

      {uploading && (
        <div className="mb-4">
          <p className="text-sm text-center text-gray-500">Uploading to Google Drive... Please wait.</p>
        </div>
      )}

      {status === "success" && (
        <div className="mb-4 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      {status === "error" && (
        <div className="mb-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" /> {message}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {uploading ? "Uploading..." : "Upload to Cloud"}
      </button>
    </div>
  );
}
