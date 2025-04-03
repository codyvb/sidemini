import type { Metadata } from "next";

import { getSession } from "~/auth"
import "~/app/globals.css";
import { Providers } from "~/app/providers";
import Header from "~/components/Header";
import Footer from "~/components/Footer";

export const metadata: Metadata = {
  title: "sidequest.build",
  icons: [
    { rel: "icon", url: "./favicon.ico" },
    { rel: "apple-touch-icon", url: "./apple-touch-icon.png" },
    { rel: "icon", url: "./favicon-32x32.png", sizes: "32x32" },
    { rel: "icon", url: "./favicon-16x16.png", sizes: "16x16" },
  ],
  openGraph: {
    title: "sidequest.build",
    description: "back the build",
    images: [
      {
        url: "./card.png",
        width: 1200,
        height: 630,
        alt: "",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "sidequest.build",
    images: ["./card.png"],
  },
  // Add Farcaster frame metadata
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://mini.sidequest.build/fox.png",
      aspectRatio: "3:2",
      button: {
        title: "launch sidequest",
        action: {
          type: "launch_frame",
          name: "launch",
          url: "https://mini.sidequest.build",
          splashImageUrl: "https://mini.sidequest.build/card.png",
          splashBackgroundColor: "#000000"
        }
      }
    })
  }
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession()
  
  return (
    <html lang="en">
      <body className="overscroll-none">
        <Providers session={session}>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
