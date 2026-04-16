import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Building2, LayoutGrid, Package, LogOut } from "lucide-react";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MDU Passport",
  description: "Property + common area configurator for Hawaiian Telcom MDU deployments",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {user ? (
          <header className="border-b bg-background">
            <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-6">
                <Link href="/" className="font-semibold text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  MDU Passport
                </Link>
                <div className="flex items-center gap-1 text-sm">
                  <Link
                    href="/"
                    className="px-3 py-1.5 rounded hover:bg-muted flex items-center gap-1.5"
                  >
                    <LayoutGrid className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    href="/properties"
                    className="px-3 py-1.5 rounded hover:bg-muted flex items-center gap-1.5"
                  >
                    <Building2 className="h-4 w-4" /> Properties
                  </Link>
                  <Link
                    href="/equipment"
                    className="px-3 py-1.5 rounded hover:bg-muted flex items-center gap-1.5"
                  >
                    <Package className="h-4 w-4" /> Equipment
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <Button variant="ghost" size="sm" type="submit">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </nav>
          </header>
        ) : null}
        <main className="flex-1 max-w-7xl w-full mx-auto">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
