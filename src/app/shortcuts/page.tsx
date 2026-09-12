import type { Metadata } from "next";
import { ShortcutsApp } from "@/app/shortcuts/shortcuts-app";

export const metadata: Metadata = {
  title: "Shortcuts — muvi",
  description: "Manage, organize, and 1-click launch your account and application login links.",
};

export default function ShortcutsPage() {
  return <ShortcutsApp />;
}
