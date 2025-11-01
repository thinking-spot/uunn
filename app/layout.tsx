import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "uunn - Secure Worker Coordination Platform",
  description: "Privacy-first platform for workers to coordinate on workplace issues and build collective power",
  keywords: ["union", "workers", "organizing", "privacy", "encrypted", "workplace", "collective action"],
  authors: [{ name: "uunn" }],
  robots: "index, follow",
  openGraph: {
    title: "uunn - Secure Worker Coordination Platform",
    description: "Privacy-first platform for workers to coordinate on workplace issues",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
