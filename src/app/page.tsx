import { UploadForm } from "@/components/upload-form";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Welcome to muvi</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Upload and stream movies directly from the cloud without using your local storage.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}
