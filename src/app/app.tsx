"use client";

import dynamic from "next/dynamic";

const Demo = dynamic(() => import("~/components/Demo"), {
  ssr: false,
});

const Intro = dynamic(() => import("~/components/Intro2"), {
  ssr: false,
});


export default function App(
) {
  return <Intro />;
}
