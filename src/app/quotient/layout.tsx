import { Metadata } from 'next';

// Frame metadata defined for the back page only
const frame = {
  version: "next",
  imageUrl: "https://mini.sidequest.build/goldcard.png",
  aspectRatio: "3:2",
  button: {
    title: "Back It",
    action: {
      type: "launch_frame",
      name: "Sidequest",
      url: "https://mini.sidequest.build/quotient",
      splashImageUrl: "https://mini.sidequest.build/goldcard.png",
      splashBackgroundColor: "#000000",
    },
  },
};

export const metadata: Metadata = {
  title: "Sidequest",
  openGraph: {
    title: "Sidequest",
    description: "A Sidequest app.",
  },
  other: {
    "fc:frame": JSON.stringify(frame),
  },
};

export default function BackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
