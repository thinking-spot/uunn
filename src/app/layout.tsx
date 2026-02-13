import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UnionProvider } from "@/context/UnionContext";
import { ThemeProvider } from "@/components/ThemeProvider";

import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "uunn",
  description: "Secure worker organization platform",
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
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </UnionProvider>
          </AuthProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
