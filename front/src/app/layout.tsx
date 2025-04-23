import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// layout.tsx ou page.tsx (App Router)
import { type Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2C0EEB',
}


import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interno Rotas 🚌",
  description:
    "Veja rotas e horários das linhas de ônibus internas do Campus Pampulha da UFMG",

  metadataBase: new URL("https://internorotas.github.io/ufmg/"),
  alternates: {
    canonical: "https://internorotas.github.io/ufmg/",
  },

  keywords: [
    "ônibus UFMG",
    "rotas internas",
    "Campus Pampulha",
    "horários ônibus UFMG",
    "transporte universitário",
    "mapa UFMG",
    "ônibus interno",
    "horário ônibus UFMG",
    "restaurante universitário ufmg",
  ],

  authors: [{ name: "Igor Martins", url: "https://github.com/igormartins4" }],
  creator: "Igor Martins",
  publisher: "Igor Martins",

  openGraph: {
    title: "Interno Rotas 🚌 - UFMG",
    description:
      "Descubra as rotas e horários das linhas internas de ônibus no Campus Pampulha da UFMG.",
    url: "https://internorotas.github.io/ufmg/",
    siteName: "Interno Rotas",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "https://internorotas.github.io/ufmg/logo_Capa.png", // coloque essa imagem na pasta public/
        width: 1200,
        height: 630,
        alt: "Mapa de rotas internas da UFMG",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Interno Rotas 🚌 - UFMG",
    description:
      "Veja horários e rotas dos ônibus internos do Campus Pampulha.",
    site: "@titanmpolo",
    creator: "@internorotas",
    images: ["https://internorotas.github.io/ufmg/logo_Capa.png"], // mesma imagem para Twitter
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },

  appleWebApp: {
    title: "Interno Rotas",
    capable: true,
    statusBarStyle: "default",
  },

  // formatDetection: {
  //   telephone: false,
  //   email: false,
  //   address: false,
  // },

  applicationName: "Interno Rotas UFMG",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  category: "transportation",
  
  // Adicionando manifest e favicon diretamente dentro do metadata
  // other: [
  //   <link rel="manifest" href="/manifest.json" />,
  //   <link rel="icon" href="/icon-192.png" />,
  // ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
