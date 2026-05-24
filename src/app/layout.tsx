import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToolClientWrapper } from "./tool-client-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Contrast Checker",
  description:
    "Test color contrast ratios against WCAG guidelines. Check accessibility compliance for AA and AAA levels.",
  keywords: [
    "contrast",
    "WCAG",
    "accessibility",
    "color",
    "checker",
    "AA",
    "AAA",
  ],
  authors: [{ name: "ItsJust Tools" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ef4444" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToolClientWrapper>{children}</ToolClientWrapper>
      </body>
    </html>
  );
}
