import type { Metadata } from "next";
import { Inter, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Display font — Be Vietnam Pro: modern, highly readable, built for Vietnamese.
const display = Be_Vietnam_Pro({
  variable: "--font-bvp",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Learnust — Nền tảng học tập thông minh",
  description: "Học tập thông minh hơn với AI cá nhân hóa. 500+ khóa học, AI Tutor 24/7.",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#181d26]">
        <NextTopLoader
          color="#2563eb"
          height={2}
          showSpinner={false}
          easing="ease"
          speed={300}
          shadow="0 0 8px rgba(37,99,235,0.5)"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
