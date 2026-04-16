import type { Metadata } from "next";
import { Orbitron, Rajdhani, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Building2, LayoutGrid, Package, LogOut } from "lucide-react";
import "./globals.css";

const orbitron = Orbitron({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["500", "700"],
});
const rajdhani = Rajdhani({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MDU Passport · Hawaiian Telcom",
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
      className={`${orbitron.variable} ${rajdhani.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {user ? (
          <header className="app-nav">
            <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3 gap-4 flex-wrap">
              <div className="flex items-center gap-6 flex-wrap">
                <Link href="/" className="nav-brand font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  MDU Passport
                </Link>
                <div className="flex items-center gap-1">
                  <Link href="/" className="nav-link">
                    <LayoutGrid className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/properties" className="nav-link">
                    <Building2 className="h-4 w-4" /> Properties
                  </Link>
                  <Link href="/equipment" className="nav-link">
                    <Package className="h-4 w-4" /> Equipment
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{user.email}</span>
                <form action="/auth/signout" method="post">
                  <Button variant="ghost" size="sm" type="submit" title="Sign out">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </nav>
          </header>
        ) : null}
        <main className="flex-1 max-w-7xl w-full mx-auto">{children}</main>
        <footer className="text-center text-xs text-muted-foreground py-4 border-t border-border/60 mt-8">
          &copy; {new Date().getFullYear()} Hawaiian Telcom · MDU Passport
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
