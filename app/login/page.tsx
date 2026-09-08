"use client";

import LoginMain from "@/app/components/loginMain";
import AuthGuard from "@/app/hooks/AuthGuard";

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false} redirectIfAuthenticated redirectTo="/">
      <LoginMain />
    </AuthGuard>
  );
}
