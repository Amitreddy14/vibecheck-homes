import type { Metadata } from "next";
import type { ReactNode } from "react";
import { APP_NAME } from "@vch/shared";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Find flatmates you can actually live with.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
