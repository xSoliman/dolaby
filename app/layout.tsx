import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { WardrobeProvider } from "@/components/wardrobe-provider";

export const metadata: Metadata = {
  title: { default: "Dolaby — Your wardrobe, made intentional", template: "%s · Dolaby" },
  description: "A calm, visual home for your clothes, outfits, stores, and wear history.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f3ed",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <WardrobeProvider>
          <ToastProvider>{children}</ToastProvider>
        </WardrobeProvider>
      </body>
    </html>
  );
}
