import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UnionProvider } from "@/context/UnionContext";
import { ThemeProvider } from "@/components/ThemeProvider";

import { cn } from "@/lib/utils";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Start a Union | A Free, Secure App | uunn",
    template: "%s | uunn",
  },
  description: "A simple, secure way to create a union with anyone. E2E encrypted, open source, free for everyone. organize, vote, act, together.",
  openGraph: {
    type: "website",
    siteName: "uunn",
    title: "Start a Union | A Free, Secure App | uunn",
    description: "A simple, secure way to create a union with anyone. E2E encrypted, open source, free for everyone. organize, vote, act, together.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "uunn" }],
  },
  twitter: {
    card: "summary",
    title: "Start a Union | A Free, Secure App | uunn",
    description: "A simple, secure way to create a union with anyone. E2E encrypted, open source, free for everyone. organize, vote, act, together.",
    images: ["/logo.png"],
  },
};

import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "flex h-screen overflow-hidden bg-background")}>
        <SessionProviderWrapper>
          <AuthProvider>
            <UnionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster richColors position="top-right" />
              </ThemeProvider>
            </UnionProvider>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
