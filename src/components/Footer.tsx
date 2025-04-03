"use client";
import { usePathname } from "next/navigation";

const Footer = () => {
  const pathname = usePathname();

  // Determine if we're on a page that should have dark styling
  const isDarkPage = pathname === "/" || pathname?.startsWith("/project/");

  return (
    <div
      className={`
      relative p-10 bottom-0 w-full z-[9999999] text-center
      ${isDarkPage ? "bg-neutral-900" : "bg-transparent"}
    `}
    >
      <div
        className={`
        text-sm font-mono
        ${isDarkPage ? "text-white" : "text-neutral-800"}
      `}
      >
        sidequest.build
      </div>
    </div>
  );
};

export default Footer;
