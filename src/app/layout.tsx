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
  other: {
    'fc:frame': '{"version":"next","imageUrl":"https://www.sidequest.build/card.png","button":{"title":"Launch Sidequest","action":{"type":"launch_frame","name":"Sidequest","splashImageUrl":"https://www.sidequest.build/card.png","splashBackgroundColor":"#f7f7f7","url":"https://www.mini.sidequest.build"}}}'
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
