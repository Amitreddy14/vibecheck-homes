import type { Metadata } from "next";
import Link from "next/link";
import { PRIVACY_NOTICE } from "@vch/shared";
import { PrivacyNotice } from "@/components/privacy-notice";

export const metadata: Metadata = { title: "Privacy notice" };

/** Public: anyone can read the notice before signing in. */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm font-bold underline">
          Back
        </Link>
        <h1 className="font-display text-4xl font-bold leading-tight">Privacy notice</h1>
        <p className="rounded-md bg-callout p-4 text-lg text-on-color">{PRIVACY_NOTICE.summary}</p>
      </div>
      <PrivacyNotice />
    </main>
  );
}
