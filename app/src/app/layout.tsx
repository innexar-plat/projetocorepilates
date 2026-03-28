import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Core Pilates",
  description: "Transform your body and mind with Pilates",
};

// Root layout wraps [locale]/layout.tsx which provides <html> and <body>.
// This file must NOT include <html> or <body> to avoid nesting conflicts.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

