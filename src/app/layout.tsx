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
    statusBarStyle: "black",
    title: APP_CONFIG.name,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d13",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const languageBootstrap = `
(function () {
  try {
    var key = "gym-crew:language";
    var language = localStorage.getItem(key);
    if (language !== "ar" && language !== "en") language = "ar";
    var root = document.documentElement;
    root.lang = language === "ar" ? "ar-EG" : "en";
    root.dir = language === "ar" ? "rtl" : "ltr";
    root.dataset.gcLanguage = language;
    if (language === "en") root.dataset.gcI18nPending = "true";
    setTimeout(function () { root.removeAttribute("data-gc-i18n-pending"); }, 1800);
  } catch (_) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar-EG"
      dir="rtl"
      suppressHydrationWarning
      className="dark h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: languageBootstrap }} />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
