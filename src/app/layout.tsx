import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk, Syne } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const themeInitScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("dripfi-theme");
    const theme = storedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DripFi | Automated DCA on Initia",
  description:
    "Hands-free DCA and auto-compound protocol concept for the Initia hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${syne.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
