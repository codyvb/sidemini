import { Metadata } from 'next';

// Frame metadata defined for the back page only
const frame = {
  version: "next",
  imageUrl: "https://mini.sidequest.build/card7.png",
  aspectRatio: "3:2",
  button: {
    title: "Back It",
    action: {
      type: "launch_frame",
      name: "Sidequest",
      url: "https://mini.sidequest.build/back",
      splashImageUrl: "https://mini.sidequest.build/card7.png",
      splashBackgroundColor: "#f7f7f7",
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
