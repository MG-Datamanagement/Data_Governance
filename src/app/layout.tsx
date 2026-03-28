import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { GlobalToastProvider } from "@/components/ui/GlobalToastProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Infinity Governance",
    template: "%s | Infinity Governance",
  },
  description:
    "Infinity Governance — AI-powered enterprise data governance, compliance, and lineage platform.",
  keywords: [
    "data governance",
    "data lineage",
    "compliance",
    "PII detection",
    "data catalog",
    "AI governance",
  ],
  metadataBase: new URL("https://infinity-governance.io"),
  openGraph: {
    title: "Infinity Governance",
    description: "AI-powered enterprise data governance and compliance platform.",
    type: "website",
    siteName: "Infinity Governance",
  },
  robots: { index: false, follow: false }, // set to true once in production
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="http://172.188.2.173:8005" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <Providers>
            {children}
            <GlobalToastProvider />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
