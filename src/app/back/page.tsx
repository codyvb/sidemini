"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import Warning from "../../components/Warning";
import SpaceAnimation from "../../components/SpaceAnimation";
import Mint from "~/components/Mint";

const Project = () => {
  const [activeTab, setActiveTab] = useState("Campaign");
  const [contractValue, setContractValue] = useState(0);
  const [backersCount, setBackersCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});
  const [showBackButton, setShowBackButton] = useState(true);

  // Function to toggle FAQ expansion
  const toggleFaq = (faqId: string) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // Refs for scrolling and visibility tracking
  const mintSectionRef = useRef(null);
  const mintSectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Function to scroll to mint section
  const scrollToMintSection = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mintSectionRef.current) {
      (mintSectionRef.current as HTMLElement).scrollIntoView({
        behavior: "smooth",
      });
      // Hide button immediately when clicked
      setShowBackButton(false);
    }
  };

  // Set up intersection observer to track when mint section is visible
  useEffect(() => {
    if (mintSectionRef.current) {
      mintSectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          // If mint section is visible, hide the button
          // If mint section is not visible, show the button
          setShowBackButton(!entries[0].isIntersecting);
        },
        { threshold: 0.1 } // Trigger when at least 10% of the target is visible
      );

      mintSectionObserverRef.current.observe(mintSectionRef.current);
    }

    return () => {
      if (mintSectionObserverRef.current) {
        mintSectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Video ref for autoplay handling
  const videoRef = useRef<HTMLVideoElement>(null);

  // Ensure video autoplay works on all devices, especially mobile
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      // Try to play the video as soon as it's loaded
      const playVideo = async () => {
        try {
          await videoElement.play();
        } catch (error) {
          console.error('Autoplay failed:', error);
          // Add a click event listener as fallback for devices that require user interaction
          document.addEventListener('click', () => {
            videoElement.play();
          }, { once: true });
        }
      };

      // Play when metadata is loaded
      videoElement.addEventListener('loadedmetadata', playVideo);
      
      // Also try to play immediately if already loaded
      if (videoElement.readyState >= 2) {
        playVideo();
      }

      return () => {
        videoElement.removeEventListener('loadedmetadata', playVideo);
      };
    }
  }, []);

  // Goal amount from project data
  const GOAL_AMOUNT = 10106;

  // Sample project data (in a real app, this would come from an API or props)
  const project = {
    title: "Quotient",
    description: "Deep Research for people building onchain",
    creator: "Jordan Olmstead",
    location: "Brooklyn, NY",
    category: "Software",
    stats: {
      goal: "$2,000",
      backers: "2",
      deadline: "Tue, April 8 2025 1:00 PM MST",
      daysToGo: "5",
    },
    creatorInfo: {
      firstCreated: true,
      backed: 0,
      bio: "",
    },
  };

  // Function to fetch contract value and total mints
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        const NFT_CONTRACT_ADDRESS =
          "0xc049e891b0542414ead02223b1b70e0bc99d1511";
        const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");

        // Get contract balance
        const balance = await provider.getBalance(NFT_CONTRACT_ADDRESS);
        const balanceInEth = parseFloat(ethers.formatEther(balance));

        // Fetch ETH price
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        const data = await response.json();

        if (data?.ethereum?.usd) {
          // Calculate USD value
          const valueInUsd = balanceInEth * data.ethereum.usd;
          setContractValue(valueInUsd);
        }

        // Create a contract instance to fetch total mints
        // This is a minimal ABI with just the totalSupply function
        const minimalAbi = [
          {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [
              {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
              }
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ];
        
        // Create contract instance
        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, minimalAbi, provider);
        
        try {
          // Call totalSupply function to get the number of mints
          const totalSupply = await contract.totalSupply();
          setBackersCount(Number(totalSupply));
        } catch (error) {
          console.error("Error fetching total supply:", error);
          // If totalSupply fails, try to estimate from the transaction count
          const txCount = await provider.getTransactionCount(NFT_CONTRACT_ADDRESS);
          // Rough estimate - each mint is likely a transaction
          setBackersCount(txCount);
        }
      } catch (error) {
        console.error("Error fetching contract data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContractData();
    // Refresh every minute
    const intervalId = setInterval(fetchContractData, 60000);
    return () => clearInterval(intervalId);
  }, []);
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const tabs = [
    { name: "Campaign", count: null },
    // { name: "Rewards", count: null },
    // { name: "FAQ", count: 7 },
    // { name: "Updates", count: 3 },
    // { name: "Comments", count: 244 },
    // { name: "Community", count: null },
  ];

  const pledgeOptions = [
    { name: "Setup" },
    { name: "Sprint 1" },
    { name: "Risks" },
  ];

  const renderProgressBar = () => {
    // Calculate percentage using contract value
    const percentage = Math.min((contractValue / GOAL_AMOUNT) * 100, 100);
    return (
      <div className="w-full bg-neutral-200 h-1 mt-4">
        <div
          className="bg-neutral-500 h-1"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="flex flex-col overflow-x-hidden w-full relative">
      {/* Fixed Back this project button with gradient - conditionally shown */}
      {showBackButton && (
        <>
          {/* Bottom gradient */}
          <div className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-40"></div>
          
          {/* Button container */}
          <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center items-center pointer-events-none">
            {/* Back to index button - subtle arrow only */}
            <div className="absolute left-4 md:left-8 pointer-events-auto">
              <a 
                href="/"
                className="flex items-center justify-center text-neutral-600 hover:text-black transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </a>
            </div>
            
            {/* Back this project button */}
            <button
              onClick={scrollToMintSection}
              className="bg-purple-700 text-white py-3 px-8 rounded-md font-medium hover:bg-purple-800 transition-colors shadow-lg pointer-events-auto"
            >
              Back this project
            </button>
          </div>
        </>
      )}
      {/* Header section - full width */}
      <section className="w-full ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop-only Project Title (hidden on mobile) */}
          <div className="hidden md:block pt-12 pb-6">
            <h1 className="text-[60px] text-center font-bold">{project.title}</h1>
            <p className="text-center mt-2 text-3xl">{project.description}</p>
          </div>
        </div>
      </section>

      {/* Video section - TikTok style full height */}
      <section className="w-full">
        <div className="w-full mx-auto md:max-w-7xl md:px-4 md:py-0 lg:px-8">
          {/* Main content area */}
          <div className="flex flex-col md:flex-row md:gap-8 justify-center">
            {/* Left column - Project details */}
            <div className="w-full md:w-8/12 md:max-w-4xl mx-auto">
              <div className="w-full mt-[60px]">
                <div className="relative mx-0">
                  <div className="relative w-full h-[70vh] bg-black overflow-hidden">
                    {/* DEMO label */}
                    <div className="absolute top-4 left-4 z-10 bg-opacity-80 px-3 py-1 rounded-md">
                      <span className="font-bold bg-white p-2 rounded-md text-black">DEMO</span>
                    </div>
                    <div className="absolute inset-0">
                      {/* Background image removed as video autoplays */}
                      
                      {/* Video element (pure autoplay with no interface) */}
                      <video 
                        id="main-video"
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        src="/loom.mp4"
                        playsInline
                        preload="auto"
                        autoPlay
                        muted
                        loop
                        disablePictureInPicture
                        disableRemotePlayback
                      />
                      
                      {/* Play button removed as video autoplays */}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Demo Button - Desktop only */}
              {/* <div className="hidden md:flex justify-center mt-4">
                <a 
                  href="https://farcaster.usequotient.xyz/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  View Demo
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={1.5} 
                    stroke="currentColor" 
                    className="w-5 h-5 ml-2"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" 
                    />
                  </svg>
                </a>
              </div> */}

              {/* Mobile-only Project Title (appears below video) */}
              <div className="md:hidden px-4 pt-6 pb-4">
                <h1 className="text-4xl font-bold">{project.title}</h1>
                <p className="mt-1">{project.description}</p>
              </div>

              {/* Creator info - only displayed on mobile */}
                {/* <div className="flex items-center gap-4">
                  <div className="w-[30px] h-[30px] rounded-full overflow-hidden">
                    <Image
                      src="/deepfield.png"
                      alt="Creator"
                      width={100}
                      height={100}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <p className="font-bold">{project.creator}</p>
                  </div>
                </div> */}
                {/* <div className="flex justify-center mt-4">
                  <a 
                    href="https://farcaster.usequotient.xyz/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center text-center w-full px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <span className="relative flex h-3 w-3 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    View Demo
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1.5} 
                      stroke="currentColor" 
                      className="w-5 h-5 ml-2"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" 
                      />
                    </svg>
                  </a>
                </div> */}
            </div>
          </div>
        </div>
      </section>

      {/* Fundraising section - full width */}
      <section className="w-full py-8">
        <div className="max-w-3xl md:max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="w-full">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold">
                    {isLoading ? "Loading..." : formatCurrency(contractValue)}
                  </h2>
                  <p className="text-neutral-600">
                    pledged of {project.stats.goal} goal
                  </p>
                </div>
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold">{isLoading ? "Loading..." : backersCount}</h2>
                  <p className="text-neutral-600">mints</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{project.stats.daysToGo}</h2>
                  <p className="text-neutral-600">days to go</p>
                </div>
              </div>
              {renderProgressBar()}
              {/* <button
                onClick={scrollToMintSection}
                className="w-full bg-purple-700 text-white py-3 rounded-md font-medium mt-6 hover:bg-purple-800 transition-colors"
              >
                Back this project
              </button> */}

              {/* All or nothing disclaimer */}
              <div className="mt-4 text-center">
                <p className="font-medium">All or nothing.</p>
                <p className="text-sm">
                  This project will only be funded if it reaches its goal by{" "}
                  {project.stats.deadline}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content/Setup section - full width */}
      <section className="w-full py-12 border-t border-neutral-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Project story content */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Story</h2>
            <p className="mb-4">
            We&apos;re building Deep Research for people building onchain. A bridge connecting Farcaster data to other sources relevant to understanding onchain builders and the products they&apos;re working on.
            </p>
            
            <p className="font-bold mb-2">Example queries:</p>
            <ul className="list-disc pl-8 mb-4">
              <li>Who are devs on Farcaster that could be a good fit for Network School?</li>
              <li>Who are the most active holders of $higher and contributors to /higher?</li>
              <li>Who are people @Jihad should reach out to who might support Bedrock?</li>
            </ul>
            
            <p className="mb-4">Version 0.1 is live here: <a href="https://farcaster.usequotient.xyz/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://farcaster.usequotient.xyz/</a></p>
            <p className="mb-4">We&apos;re crowdfunding to get to Version 1. The more backers we get, the better this will get.</p>
          </div>

          {/* FAQ Section with new content */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">FAQ</h2>
            
            {/* FAQ Item - Why Now */}
            <div className="mb-4 border-b border-neutral-200">
              <button 
                className="w-full text-left py-3 flex justify-between items-center"
                onClick={() => toggleFaq('why-now')}
              >
                <span className="font-bold">Why Now</span>
                <span>{expandedFaqs['why-now'] ? '−' : '+'}</span>
              </button>
              {expandedFaqs['why-now'] && (
                <div className="py-3">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>There is an incredible amount of data on Farcaster/onchain but it remains difficult to navigate and connect.</li>
                    <li>The world is getting used to a ChatGPT/Grok text prompt interface that just works, we&apos;re connecting that interface to a network that is public but not well mapped.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* FAQ Item - Use cases we’re excited about */}
            <div className="mb-4 border-b border-neutral-200">
              <button 
                className="w-full text-left py-3 flex justify-between items-center"
                onClick={() => toggleFaq('use-cases')}
              >
                <span className="font-bold">Use cases we&apos;re excited about</span>
                <span>{expandedFaqs['use-cases'] ? '−' : '+'}</span>
              </button>
              {expandedFaqs['use-cases'] && (
                <div className="py-3">
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Lead generation for new products</li>
                    <li>Sorting real users from bots</li>
                    <li>Finding diamonds in the rough</li>
                  </ul>
                </div>
              )}
            </div>

            {/* FAQ Item - Vision for Version 1 */}
            <div className="mb-4 border-b border-neutral-200">
              <button 
                className="w-full text-left py-3 flex justify-between items-center"
                onClick={() => toggleFaq('vision')}
              >
                <span className="font-bold">Vision for Version 1</span>
                <span>{expandedFaqs['vision'] ? '−' : '+'}</span>
              </button>
              {expandedFaqs['vision'] && (
                <div className="py-3">
                  <p className="mb-2">Version 1 is about enhancing every aspect of Version 0.1.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>more full functioned version of current frame (I/e more open ended questions, better integration of external data into responses)</li>
                    <li>power user interface for builders: export data (like followers), explore trends, monitor community (i/e for a protocol or ecosystem) or user analytics (mini app builders)</li>
                    <li>api data exports to make it easy to integrate our data into your analytics systems.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* FAQ Item - Will there ever be an airdrop? */}
            <div className="mb-4 border-b border-neutral-200">
              <button 
                className="w-full text-left py-3 flex justify-between items-center"
                onClick={() => toggleFaq('airdrop')}
              >
                <span className="font-bold">Will there ever be an airdrop?</span>
                <span>{expandedFaqs['airdrop'] ? '−' : '+'}</span>
              </button>
              {expandedFaqs['airdrop'] && (
                <div className="py-3">
                  <p>Do not back this project if you are seeking an immediate airdrop. We&apos;re not opposed to an airdrop in the future but only if we think it would be a net good for the project. The only token this project has now is the one below, which is proof of onchain support, and won&apos;t be mintable after the campaign ends.</p>
                </div>
              )}
            </div>

            {/* FAQ Item - Team */}
            <div className="mb-4 border-b border-neutral-200">
              <button 
                className="w-full text-left py-3 flex justify-between items-center"
                onClick={() => toggleFaq('team')}
              >
                <span className="font-bold">Team</span>
                <span>{expandedFaqs['team'] ? '−' : '+'}</span>
              </button>
              {expandedFaqs['team'] && (
                <div className="py-3">
                  <p className="mb-2">Jordan Olmstead</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Won first round of Arbitrum governance data hackathon. <a href="https://github.com/jchanolm/crypto-neo4j-pipelines" className="text-blue-600 hover:underline inline">View project</a></li>
                    <li>Built graph based user analytics system integrating on chain data with internal application data for thrive protocol.</li>
                    <li>Quotient data is already being used to improve a popular wallet recommendations company.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Back Sprint section - FULL WIDTH */}
      <section 
        ref={mintSectionRef}
        className="w-full py-16 border-t border-neutral-200 mt-12"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">Back Version 1</h2>
        </div>
        
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center md:flex-row md:justify-center md:items-start md:gap-12">
            <div className="flex flex-col justify-center mb-6 md:mb-0 md:w-96">
              <div className="text-left font-bold text-lg mb-2">
                Access Pass to Version 1
              </div>
              {/* <div className="relative w-full rounded-xl flex items-center justify-center">
                <img
                  src="/quote7.png"
                  alt="Brick"
                  className="w-full h-auto rounded-xl"
                />
              </div> */}

              <div className="w-full text-neutral-800 mt-2">
                <div className="text-left">
                  <p><strong>Rewards</strong></p>
                  <ul className="list-disc pl-5">
                    <li>Access Pass NFT</li>
                    <li>onchain record of support</li>
                    <li>project updates and early access to builds</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-auto md:max-w-md">
              <Mint />
              <Warning />
            </div>
          </div>
        </div>
      </section>
      <div className="h-[200px]"></div>

      {/* Thank You Backers Section - FULL WIDTH */}
      {/* <section className="w-full py-16 border-t border-neutral-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">TY Backers</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
            {[
              "Alex Zhang",
              "Linda Chen",
              "Marco DeFi",
              "Sarah Johnson",
              "David Kim",
              "Emma Wilson",
              "Michael Brown",
              "Jessica Lee",
            ].map((name, index) => (
              <div key={index} className="text-center">
                <p className="font-medium">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section className="w-full py-16 border-t border-neutral-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-6">Follow Quotient on Warpcast</h2>
            <a 
              href="https://warpcast.com/quotient" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block text-xl font-medium text-purple-600 hover:text-purple-800 transition-colors duration-200 hover:underline"
            >
              warpcast.com/quotient
            </a>
          </div>
        </div>
      </section>

      <div className="h-[100px]"></div>

    </div>
  );
};

export default Project;
