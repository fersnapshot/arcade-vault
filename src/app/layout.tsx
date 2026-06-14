import type { Metadata } from "next";
import { Press_Start_2P, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import Nav from "@/components/Nav";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arcade Vault",
  description: "Online gaming platform — compete for the highest score",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${pressStart2P.variable} ${jetBrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <div className="av-bg" />
        <div className="av-noise" />
        <UserProvider>
          <Nav />
          <main className="flex-1" style={{ position: "relative", zIndex: 2 }}>{children}</main>
          <footer className="border-t border-white/10 py-6 text-center font-mono text-xs text-white/30 tracking-widest" style={{ position: "relative", zIndex: 2 }}>
            © 2026 ARCADE VAULT — INSERT COIN TO CONTINUE
          </footer>
        </UserProvider>
      </body>
    </html>
  );
}
