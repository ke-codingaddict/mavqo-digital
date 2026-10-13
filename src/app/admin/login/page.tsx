import type { Metadata } from "next";
import { LogoMark } from "@/components/layout/logo";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { SignedOutNotice } from "./signed-out-notice";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-2 px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="size-12" />
          <h1 className="mt-5 text-2xl font-black text-heading">Mavqo Digital Admin</h1>
          <p className="mt-1 text-sm text-ink-soft">Sign in to manage enquiries.</p>
        </div>
        <div className="mt-8 rounded-[var(--radius-lg)] bg-surface p-6 shadow-md sm:p-8">
          <Suspense fallback={null}>
            <SignedOutNotice />
          </Suspense>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
