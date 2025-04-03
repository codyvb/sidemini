"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  // Determine if we're on index or projects page
  const isDarkMode = pathname === "/";

  // Explicitly define the position style
  const positionStyle = isDarkMode ? "position: fixed;" : "position: relative;";

  // Add a global style to override Privy's dropdown
  useEffect(() => {
    // Create a style tag
    const styleTag = document.createElement("style");

    // Set high z-index for all Privy elements
    styleTag.innerHTML = `
      .privy-dropdown {
        z-index: 999999 !important;
        position: relative !important;
      }
      
      [data-privy-modal] {
        z-index: 999999 !important;
      }
      
      [data-privy-dialog] {
        z-index: 999999 !important;
      }
      
      div[role="dialog"] {
        z-index: 999999 !important;
      }
      
      .header-container {
        ${positionStyle}
      }
    `;

    // Add style to head
    document.head.appendChild(styleTag);

    // Clean up
    return () => {
      document.head.removeChild(styleTag);
    };
  }, [isDarkMode, positionStyle]);

  return (
    <div
      className={`header-container z-[88888] w-full ${
        isDarkMode ? "border-neutral-700" : "border-neutral-400"
      }`}
      style={{
        position: isDarkMode ? "fixed" : "relative",
        background: isDarkMode
          ? "linear-gradient(to bottom, #000000 0%, rgba(0, 0, 0, 0) 100%)"
          : "none",
      }}
    >
      {/* Main header */}
      <header className="w-full py-3 max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              href="/"
              className={`text-lg font-mono font-bold ${
                isDarkMode ? "text-white" : "text-black"
              }`}
            >
              sidequest
            </Link>
          </div>

          {/* Desktop search bar */}
          <div className="hidden md:block flex-grow mx-4 max-w-3xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg
                  className={`w-5 h-5 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="search"
                className={`block w-full py-2 px-4 pl-10 border rounded-full shadow-sm focus:outline-none ${
                  isDarkMode
                    ? "text-neutral-900 border-neutral-700 bg-transparent focus:ring-2 focus:ring-orange-100 focus:border-purple-300"
                    : "text-neutral-900 border-neutral-400 focus:ring-2 bg-transparent focus:ring-orange-100 focus:border-purple-300"
                }`}
                placeholder="search for projects and devs"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <Link
              href="/devs"
              className={`px-4 py-2 border rounded-md font-medium ${
                isDarkMode
                  ? "border-gray-700 text-white hover:bg-gray-800"
                  : "border-gray-300 text-gray-800 hover:bg-gray-50 "
              }`}
            >
              for devs
            </Link>

          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
