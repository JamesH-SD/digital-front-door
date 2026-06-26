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
  metadataBase: new URL("https://getcontactor.com"),

  title: {
    default: "Contactor",
    template: "%s | Contactor",
  },

  description:
    "AI receptionist, websites, scheduling, and lead management for service professionals.",

  applicationName: "Contactor",

  keywords: [
    "AI receptionist",
    "Contractor CRM",
    "Scheduling",
    "Lead Capture",
    "Service Business",
    "Digital Front Door",
    "Contactor",
  ],

  authors: [
    {
      name: "Contactor",
    },
  ],

  creator: "Contactor",

  publisher: "Contactor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en" 
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
