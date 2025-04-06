import { Metadata } from "next";
import App from "./app";
import Header from "~/components/Header";

const appUrl = process.env.NEXT_PUBLIC_URL;

const frame = {
  version: "next",
  imageUrl: "https://mini.sidequest.build/card7.png",
  aspectRatio: "3:2",
  button: {
    title: "Launch Sidequest",
    action: {
      type: "launch_frame",
      name: "Sidequest",
      url: "https://mini.sidequest.build",
      splashImageUrl: "https://mini.sidequest.build/card7.png",
      splashBackgroundColor: "#f7f7f7",
    },
  },
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Sidequest",
    openGraph: {
      title: "Sidequest",
      description: "A Sidequest app.",
    },
    // Frame metadata removed - now only on back page
  };
}

export default function Home() {
  return (
    <>
      <Header />
      <App />
    </>
  );
}
