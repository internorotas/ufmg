import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
    "Veja rotas e horários das linhas de ônibus internos do Campus Pampulha da UFMG",

  keywords: [
    "ônibus UFMG",
    "rotas internos",
    "Campus Pampulha",
    "horários ônibus UFMG",
    "transporte universitário",
  ],

  authors: [{ name: "Igor Martins", url: "https://github.com/igormartins4" }],

  creator: "Igor Martins",
  publisher: "Igor Martins",

  metadataBase: new URL("https://internorotas.github.io/ufmg/"),

  openGraph: {
    title: "Interno Rotas 🚌 - UFMG",
    description:
      "Descubra as rotas e horários das linhas internas de ônibus no Campus Pampulha da UFMG.",
    url: "https://internorotas.github.io/ufmg/",
    siteName: "Interno Rotas",
    images: [
      {
        url: "https://internorotas.ufmg.br/og-image.png", // imagem de preview
        width: 1200,
        height: 630,
        alt: "Mapa de rotas internas da UFMG",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Interno Rotas 🚌 - UFMG",
    description:
      "Veja horários e rotas dos ônibus internos do Campus Pampulha.",
    site: "@ufmg",
    creator: "@internorotas",
    images: ["https://internorotas.ufmg.br/og-image.png"],
  },

  themeColor: "#2C0EEB", // cor base da identidade visual (pode mudar)

  viewport: "width=device-width, initial-scale=1.0",
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
