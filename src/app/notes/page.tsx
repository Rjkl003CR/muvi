import type { Metadata } from "next";
import { NotesApp } from "@/app/notes/notes-app";

export const metadata: Metadata = {
  title: "Notes — muvi",
  description: "Create, manage, and secure your personal notes.",
};

export default function NotesPage() {
  return <NotesApp />;
}
