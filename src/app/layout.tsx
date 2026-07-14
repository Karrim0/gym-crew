import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import { APP_CONFIG } from "@/config/app";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s · ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  applicationName: APP_CONFIG.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_CONFIG.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#070907",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
