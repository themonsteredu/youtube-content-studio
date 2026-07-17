import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "별거 다하는 원장님 | 콘텐츠 스튜디오",
  description: "유튜브 썸네일과 인트로 영상을 만드는 관리자 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className={`${geist.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
