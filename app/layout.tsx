import "./globals.css";
import RouteWarmup from "@/components/RouteWarmup";
import Navbar from "@/app/components/Navbar";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/JsonLd";
import { SITE_URL, defaultMetadata } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: defaultMetadata.title,
  description: defaultMetadata.description,
  keywords: defaultMetadata.keywords,
  authors: [{ name: "Illustrate.live", url: SITE_URL }],
  creator: "Illustrate.live",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: defaultMetadata.siteName,
    title: defaultMetadata.title,
    description: defaultMetadata.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultMetadata.title,
    description: defaultMetadata.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && {
    verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION },
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-950 text-white">
        <OrganizationJsonLd url={SITE_URL} />
        <WebSiteJsonLd url={SITE_URL} />
        <RouteWarmup />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
