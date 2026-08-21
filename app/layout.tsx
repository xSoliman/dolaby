import type { Metadata, Viewport } from "next";
import "./themes.css";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { WardrobeProvider } from "@/components/wardrobe-provider";
import { ACTIVE_THEME, THEME_METADATA } from "@/config/theme";

const activeTheme = THEME_METADATA[ACTIVE_THEME];

export const metadata: Metadata = {
  title: { default: "Dolaby — Your wardrobe, made intentional", template: "%s · Dolaby" },
  description: "A calm, visual home for your clothes, outfits, stores, and wear history.",
  icons: { icon: activeTheme.icon },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: activeTheme.browserColor,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme={ACTIVE_THEME}>
      <body>
        <WardrobeProvider>
          <ToastProvider>{children}</ToastProvider>
        </WardrobeProvider>
      </body>
    </html>
  );
}
