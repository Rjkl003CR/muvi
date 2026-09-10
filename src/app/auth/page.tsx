import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign In — muvi",
  description:
    "Sign in or create a muvi account to download movies and manage your personal cloud library.",
};

export default function AuthPage() {
  return <AuthForm defaultMode="signin" />;
}
