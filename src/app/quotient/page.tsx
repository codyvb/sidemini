"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ethers } from "ethers";
import Warning from "../../components/Warning";
import SpaceAnimation from "../../components/SpaceAnimation";
import Mint from "~/components/Mint";
import { getTokenBalance, getContractMetadata, getNFTTransfers, getNFTCount, getWalletMintCounts } from "~/utils/alchemy";
import { sdk } from "@farcaster/frame-sdk";

// Animated Ellipsis component
const AnimatedEllipsis = () => {
  const [dots, setDots] = useState("");
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "") return ".";
        if (prev === ".") return "..";
        if (prev === "..") return "...";
        return "";
      });
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return <span className="text-neutral-400">.{dots}</span>;
};

// Function to handle viewing a Farcaster profile using the Farcaster SDK
const viewFarcasterProfile = (fid: number, accountUrl: string) => {
  console.log('Viewing Farcaster profile with FID:', fid);
  
  try {
    // Call the viewProfile action with the FID
    sdk.actions.viewProfile({ fid });
  } catch (error) {
    console.error('Error viewing Farcaster profile:', error);
    // Fallback to opening the URL directly if the SDK fails
    window.open(accountUrl, '_blank');
  }
};

const Project = () => {
  const [activeTab, setActiveTab] = useState("Campaign");
  // Initial state with reasonable defaults to avoid loading flicker
  const [contractValue, setContractValue] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<number>(0);
  // Fixed ETH price
  const ethPrice = 1550;
  const [backersCount, setBackersCount] = useState<number | null>(null);
  const [walletMintCounts, setWalletMintCounts] = useState<Array<{address: string, count: number, farcaster?: {username: string, pfpUrl: string, accountUrl: string, fid: number}}>>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(true);
  const [hasMinted, setHasMinted] = useState(false);
  
  // Farcaster user data mapping
  const farcasterUserData: Record<string, { username: string, pfpUrl: string, accountUrl: string, fid: number }> = {
    "0xb68a6a83cfca2e7fde2aa5749b85e753f55d58cd": { username: "sky", pfpUrl: "https://i.imgur.com/g7qWYhr.png", accountUrl: "https://warpcast.com/sky", fid: 5516 },
    "0x461337d4f089adf16455acb785415f6437da0c24": { username: "cryptonight", pfpUrl: "https://i.imgur.com/CuGTXcz.jpg", accountUrl: "https://warpcast.com/cryptonight", fid: 187908 },
    "0x292ff025168d2b51f0ef49f164d281c36761ba2b": { username: "jonbo", pfpUrl: "https://i.imgur.com/zXst9SS.jpg", accountUrl: "https://warpcast.com/jonbo", fid: 1781 },
    "0x2211d1d0020daea8039e46cf1367962070d77da9": { username: "jessepollak", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/1013b0f6-1bf4-4f4e-15fb-34be06fede00/original", accountUrl: "https://warpcast.com/jessepollak", fid: 99 },
    "0x30ac71b1a1b0384c4c8b17e87d863cc4a2f3db28": { username: "kompreni", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/987efd90-4c51-44b5-203f-0c169a7c7f00/original", accountUrl: "https://warpcast.com/kompreni", fid: 15732 },
    "0x40ff52e1848660327f16ed96a307259ec1d757eb": { username: "codyb.eth", pfpUrl: "https://i.imgur.com/AgwTmur.jpg", accountUrl: "https://warpcast.com/codyb.eth", fid: 746 },
    "0x4a8d22cf7337be2f4d9c93d01b2893334d2438be": { username: "50cal-eth", pfpUrl: "https://i.imgur.com/fEAIqRk.jpg", accountUrl: "https://warpcast.com/50cal-eth", fid: 20965 },
    "0x5e349eca2dc61abcd9dd99ce94d04136151a09ee": { username: "linda", pfpUrl: "https://i.seadn.io/gae/r6CW_kgQygQhI7-4JdWt_Nbf_bjFNnEM7dSns1nZGrijJvUMaLnpAFuBLwjsHXTkyX8zfgpRJCYibtm7ojeA2_ASQwSJgh7yKEFVMOI?w=500&auto=format", accountUrl: "https://warpcast.com/linda", fid: 12 },
    "0x69dc230b06a15796e3f42baf706e0e55d4d5eaa1": { username: "rev", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/7bea0f51-169f-4b94-dde9-e77f85965300/original", accountUrl: "https://warpcast.com/rev", fid: 17672 },
    "0x6f526d0b48332036094af3c4beabe49db175ff2a": { username: "nelsonrodmar", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/7ab9d214-a351-4460-9c81-3c3e1006be00/original", accountUrl: "https://warpcast.com/nelsonrodmar", fid: 6083 },
    "0x8610f2d0e04b9926396a99f464c46fabcde942fc": { username: "alexpaden", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d1754d75-49dd-4901-de4b-4283bb354b00/rectcrop3", accountUrl: "https://warpcast.com/alexpaden", fid: 533 },
    "0x8cdb37ac91e2faf80c002fcf81a1165277388474": { username: "lowshot", pfpUrl: "https://i.imgur.com/9S4iCKo.png", accountUrl: "https://warpcast.com/lowshot", fid: 270517 },
    "0xa32ad653ddb29aafaf67ca906f7bcee145444746": { username: "srijan.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/34aab6e6-015f-4363-98c4-a4abafecb800/rectcrop3", accountUrl: "https://warpcast.com/srijan.eth", fid: 377 },
    "0xac1c4bed1c7c71fd3afde11e2bd4f18d969c843d": { username: "metaend.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/d94ed04c-8a86-4a23-3262-298016411500/original", accountUrl: "https://warpcast.com/metaend.eth", fid: 17940 },
    "0xceab0087c5fbc22fb19293bd0be5fa9b23789da9": { username: "garrett", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/0c7261ad-bc68-4a09-f24a-28a076cc7500/rectcrop3", accountUrl: "https://warpcast.com/garrett", fid: 2802 },
    "0xda0ff93b971afac130fbb639ca8bf1e69d7915e9": { username: "gweiwhale.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/9d010922-8f9a-4421-af19-9e783c3dd600/rectcrop3", accountUrl: "https://warpcast.com/gweiwhale.eth", fid: 207669 },
    "0xe594469fde6ae29943a64f81d95c20f5f8eb2e04": { username: "paulofonseca", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/752dae94-1d61-4304-8ee4-dc7345babf00/rectcrop3", accountUrl: "https://warpcast.com/paulofonseca", fid: 7684 },
    "0xd5aefe935dfc9360945115dde8da98b596dfbb9f": { username: "lior", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/f2641cdd-906e-4cdd-ca3e-845ae2dfc900/original", accountUrl: "https://warpcast.com/lior", fid: 7589 },
    // New users added
    "0x0aa34eb615ab330b64060ff9fa994e72a7a95b59": { username: "ted", pfpUrl: "https://openseauserdata.com/files/fd28c65d9b5192168fb259009a3afd36.png", accountUrl: "https://warpcast.com/ted", fid: 239 },
    "0x5b93ff82faaf241c15997ea3975419dddd8362c5": { username: "coopahtroopa.eth", pfpUrl: "https://i.imgur.com/0NB7bxd.gif", accountUrl: "https://warpcast.com/coopahtroopa.eth", fid: 206 },
    "0x2eeaa132a480dc7713423f2e3dae6cfc8f584880": { username: "scottrepreneur.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/bb379a90-1399-4d37-309e-7996d86a8d00/original", accountUrl: "https://warpcast.com/scottrepreneur.eth", fid: 828 },
    "0x3149a0a0d183ac74cfbf3b728a9d7e308b69e91f": { username: "cryptonight", pfpUrl: "https://i.imgur.com/CuGTXcz.jpg", accountUrl: "https://warpcast.com/cryptonight", fid: 187908 },
    "0xcbf37605a4a169cb16bf18f01329ef218df32f93": { username: "lior", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/f2641cdd-906e-4cdd-ca3e-845ae2dfc900/original", accountUrl: "https://warpcast.com/lior", fid: 7589 },
    "0x1d2757e7b628981ec185e31bf419c61294e0660a": { username: "ywc", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/8aa35445-3675-4c0f-1403-7a16fc1db800/original", accountUrl: "https://warpcast.com/ywc", fid: 3300 },
    "0x65e3419e633833df1d602e7905cb9c7e541f0849": { username: "mikadoe.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/99da14ec-41d0-4d59-5e4b-9434cc900b00/original", accountUrl: "https://warpcast.com/mikadoe.eth", fid: 477126 },
    "0x779816da803e3f69f6f06f9679efc442def1bbb0": { username: "huugo.eth", pfpUrl: "https://i.imgur.com/vAXN3k1.jpg", accountUrl: "https://warpcast.com/huugo.eth", fid: 12977 },
    "0x81a05845917716772e91b87538b7a6676424a24f": { username: "codeofcrypto", pfpUrl: "https://arweave.net/Sy54hEt6gmPG5jOSqcRahs1Gjfv8q8sFhkgzzp_GkcQ/", accountUrl: "https://warpcast.com/codeofcrypto", fid: 9227 },
    "0xc75446a6adaef73269dbdece73536977b2b639e0": { username: "ruminations", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/3331d888-3988-4d37-19c8-7bb0199a4e00/original", accountUrl: "https://warpcast.com/ruminations", fid: 190000 },
    "0xe4659245b1160e399fb4f841fd949cb38d37e9a5": { username: "omghax.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/fdc849c2-9269-4724-92e8-f374eccc6600/original", accountUrl: "https://warpcast.com/omghax.eth", fid: 193445 },
    "0xa37809b129e7407b5d2595a8d545368924552f42": { username: "sdv.eth", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/b476a0d8-c139-48df-ae12-5328624ebc00/original", accountUrl: "https://warpcast.com/sdv.eth", fid: 2745 },
    "0xcaa1e7119ad3b3c765b2d93b0a061b1f2f789b5b": { username: "ornella", pfpUrl: "https://i.imgur.com/74kR7Oc.jpg", accountUrl: "https://warpcast.com/ornella", fid: 10103 },
    "0xbc9b50d89af9cbeff1652f8e4b2052e12efe9915": { username: "victoctero", pfpUrl: "https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/a9695ac4-4d95-4a68-ebd0-a26fe039e000/rectcrop3", accountUrl: "https://warpcast.com/victoctero", fid: 8109 },
  };

  const [isLoading, setIsLoading] = useState(false); // Start with false to show initial values
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
  const GOAL_AMOUNT = 1; // Goal in ETH

  // Sample project data (in a real app, this would come from an API or props)
  const project = {
    title: "Quotient",
    description: "Power tools for builders on farcaster",
    creator: "Jordan Olmstead",
    location: "Brooklyn, NY",
    category: "Software",
    stats: {
      goal: "$2,000",
      backers: "2",
      deadline: "Tue, April 8 2025 3:00 PM MST",
      daysToGo: "1",
    },
    creatorInfo: {
      firstCreated: true,
      backed: 0,
      bio: "",
    },
  };

  // Function to fetch wallet mint counts
  useEffect(() => {
    const fetchWalletMintCounts = async () => {
      try {
        setIsLoadingWallets(true);
        
        const NFT_CONTRACT_ADDRESS = "0xc049e891b0542414ead02223b1b70e0bc99d1511";
        const { wallets, error } = await getWalletMintCounts(NFT_CONTRACT_ADDRESS);
        
        if (!error && wallets.length > 0) {
          // Add Farcaster data to wallets
          const walletsWithFarcaster = wallets.map(wallet => {
            const normalizedAddress = wallet.address.toLowerCase();
            const farcasterInfo = farcasterUserData[normalizedAddress];
            
            return {
              ...wallet,
              farcaster: farcasterInfo
            };
          });
          
          // Sort wallets: first by those with Farcaster profiles, then by count
          const sortedWallets = walletsWithFarcaster.sort((a, b) => {
            // First sort by whether they have a Farcaster profile
            if (a.farcaster && !b.farcaster) return -1;
            if (!a.farcaster && b.farcaster) return 1;
            // Then sort by count (highest first)
            return b.count - a.count;
          });
          
          setWalletMintCounts(sortedWallets);
          // Update backers count to reflect the number of unique wallet holders
          setBackersCount(wallets.length);
        
        // Only set loading to false when both contract value and backers count are loaded
        if (contractValue !== null) {
          setIsLoading(false);
        }
        } else {
          console.error("Error fetching wallet mint counts:", error);
        }
      } catch (error) {
        console.error("Error in fetchWalletMintCounts:", error);
      } finally {
        setIsLoadingWallets(false);
      }
    };
    
    fetchWalletMintCounts();
  }, []);

  // Using a fixed ETH price of $2000

  // Function to fetch contract value and total mints
  useEffect(() => {
    const fetchContractData = async () => {
      try {
        const NFT_CONTRACT_ADDRESS = "0xc049e891b0542414ead02223b1b70e0bc99d1511";
        
        // Use Alchemy SDK to get contract balance
        const { balance, error: balanceError } = await getTokenBalance(NFT_CONTRACT_ADDRESS);
        
        if (balanceError) {
          console.error("Error fetching balance from Alchemy:", balanceError);
          // Fallback to direct provider
          const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
          const fallbackBalance = await provider.getBalance(NFT_CONTRACT_ADDRESS);
          const balanceInEth = parseFloat(ethers.formatEther(fallbackBalance));
          
          // Add 0.33 ETH to the balance
          const adjustedBalanceInEth = balanceInEth + 0.33;
          
          // Calculate USD value using current ETH price
          const valueInUsd = adjustedBalanceInEth * ethPrice;
          setContractValue(valueInUsd);
          
          // Store the ETH amount for the progress bar
          setEthBalance(adjustedBalanceInEth);
        } else {
          // Convert balance from wei to ETH
          const balanceInEth = parseFloat(ethers.formatEther(balance));
          
          // Add 0.33 ETH to the balance
          const adjustedBalanceInEth = balanceInEth + 0.33;
          
          // Calculate USD value using current ETH price
          const valueInUsd = adjustedBalanceInEth * ethPrice;
          setContractValue(valueInUsd);
          
          // Store the ETH amount for the progress bar
          setEthBalance(adjustedBalanceInEth);
        }

        // We no longer need to set backers count here since it's handled in fetchWalletMintCounts
        // This prevents the count from changing after a few seconds
      } catch (error) {
        console.error("Error fetching contract data:", error);
      } finally {
        // Only set loading to false when both contract value and backers count are loaded
      if (backersCount !== null) {
        setIsLoading(false);
      }
      }
    };

    fetchContractData();
    // Refresh every minute
    const intervalId = setInterval(fetchContractData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Format currency for display
  const formatCurrency = (value: number | null) => {
    if (value === null) return "Loading...";
    return `$${Math.floor(value).toLocaleString()}`;
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
    // Calculate percentage using ETH amount directly
    const percentage = Math.min((ethBalance / GOAL_AMOUNT) * 100, 100);
    return (
      <div className="w-full bg-neutral-200 h-1 mt-4">
        <div
          className="bg-purple-700 h-1"
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
          <div className="fixed bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-white to-transparent z-40"></div>
          
          {/* Button container */}
          <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center px-4 sm:px-6 w-full max-w-md mx-auto pointer-events-none">
            {/* Back this project button */}
            <button
              onClick={scrollToMintSection}
              className="bg-purple-700 text-white py-3 px-8 rounded-lg font-medium hover:bg-purple-800 transition-colors shadow-lg pointer-events-auto w-full"
            >
              Back this project
            </button>
            
            {/* Additional buttons */}
            <div className="flex w-full gap-3 mt-3 pointer-events-auto">
              <button
                onClick={() => document.getElementById('story')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-purple-700 border border-purple-700 py-2 px-4 rounded-md font-medium hover:bg-purple-50 transition-colors flex-1"
              >
                Learn More
              </button>
              
              <button
                onClick={() => document.getElementById('backers-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-purple-700 border border-purple-700 py-2 px-4 rounded-md font-medium hover:bg-purple-50 transition-colors flex-1"
              >
                Backers
              </button>
            </div>
            
            {/* Backers Marquee */}
            <div className="w-full mt-3 overflow-hidden pointer-events-auto bg-white bg-opacity-90 rounded-md border border-gray-200 py-2">
              <div className="whitespace-nowrap inline-block animate-marquee">
                {Object.entries(farcasterUserData).map(([address, user], index) => (
                  <div key={index} className="inline-flex items-center mx-2" onClick={() => viewFarcasterProfile(user.fid, user.accountUrl)}>
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-1 border border-gray-200">
                      <img 
                        src={user.pfpUrl} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-900">{user.username}</span>
                  </div>
                ))}
                {/* Duplicate the list for continuous scrolling */}
                {Object.entries(farcasterUserData).map(([address, user], index) => (
                  <div key={`dup-${index}`} className="inline-flex items-center mx-2" onClick={() => viewFarcasterProfile(user.fid, user.accountUrl)}>
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-1 border border-gray-200">
                      <img 
                        src={user.pfpUrl} 
                        alt={user.username} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-900">{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
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
              <div className="w-full">
                <div className="relative mx-0">
                  <div className="relative w-full h-[30vh] bg-black overflow-hidden">
                    {/* DEMO label */}
                    <div className="absolute top-6 left-4 z-10 bg-opacity-80  py-1 rounded-md">
                      <span className="font-bold bg-white p-2 rounded-xl text-black">DEMO</span>
                    </div>
                    <div className="absolute inset-0">
                      {/* Background image removed as video autoplays */}
                      
                      {/* Video element (pure autoplay with no interface) */}
                      <video 
                        id="main-video"
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        src="/thing2.mov"
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


              {/* Mobile-only Project Title (appears below video) */}
              <div className="md:hidden px-4 pt-6 pb-4">
                <h1 className="text-4xl font-bold">{project.title}</h1>
                <p className="mt-1">{project.description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fundraising section - full width */}
      <section className="w-full ">
        <div className="max-w-3xl md:max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="w-full">
              {renderProgressBar()}
              <div className="grid grid-cols-5 gap-4 w-full items-start text-left mt-4">
                <div className="col-span-2">
                  <h2 className="text-2xl font-bold">{isLoading ? <AnimatedEllipsis /> : formatCurrency(contractValue)}</h2>
                  <p className="text-neutral-600 text-sm whitespace-nowrap">pledged of 1 ETH</p>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{isLoading ? <AnimatedEllipsis /> : backersCount !== null ? backersCount : <AnimatedEllipsis />}</h2>
                  <p className="text-neutral-600 text-sm">backers</p>
                </div>
                <div className="col-span-2">
                  <h2 className="text-2xl font-bold">{project.stats.daysToGo}</h2>
                  <p className="text-neutral-600 text-sm">days to go</p>
                </div>
              </div>
              {/* <button
                onClick={scrollToMintSection}
                className="w-full bg-purple-700 text-white py-3 rounded-md font-medium mt-6 hover:bg-purple-800 transition-colors"
              >
                Back this project
              </button> */}

              {/* All or nothing disclaimer */}
              <div className="mt-4 text-left mb-5 mt-2 md:text-center">
                <p className="text-sm">All or nothing. This project will only be funded if it reaches its goal by {project.stats.deadline}.</p>
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
            <h2 id="story" className="text-2xl font-bold mb-4">Story</h2>
            <p className="mb-4">
            We&apos;re building power tools for builders on farcaster. A bridge connecting Farcaster data to other sources relevant to understanding onchain builders and the products they&apos;re working on.
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
                  <p className="mb-2">Power tools for Farcaster</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Understand the audience of your Farcaster Channel, Mini-app, or Token Community</li>
                    <li>Gain insights on the interests, experiences, and capabilities of your community</li>
                    <li>Access insights to implement tactics to increase growth and engagement</li>
                    <li>Showcase your community's status, capability, and credentials</li>
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
              {/* <div className="text-left font-bold text-lg mb-2">
                Access Pass to Version 1
              </div> */}
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
              <Mint onMintSuccess={() => setHasMinted(true)} />

                {/* Share on Farcaster section - only shown after successful mint */}
                {hasMinted && (
                    <div className="mt-8 bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <button
                        onClick={() => {
                          const castText = "I just backed Quotient on Sidequest. Back the app here: https://mini.sidequest.build/quotient";
                          const encodedText = encodeURIComponent(castText);
                          
                          try {
                            // Check if we're in a Farcaster environment
                            if (typeof sdk !== 'undefined' && sdk.actions) {
                              // The SDK in this version doesn't have composeCast, so we use openUrl to the compose endpoint
                              sdk.actions.openUrl(`https://warpcast.com/~/compose?text=${encodedText}`);
                              console.log('Cast composition triggered via Farcaster SDK');
                            } else {
                              throw new Error('Farcaster SDK not available');
                            }
                          } catch (error) {
                            console.error('Error opening cast composer:', error);
                            // Fallback for non-Farcaster environments
                            window.open(`https://warpcast.com/~/compose?text=${encodedText}`, '_blank');
                          }
                        }}
                        className="w-full bg-purple-700 text-white py-3 px-4 rounded-md font-medium hover:bg-purple-800 transition-colors flex items-center justify-center gap-2"
                      >
                        Share on Farcaster
                      </button>
                    </div>
                  )}
              
              {/* Flex container to control order on mobile */}
              <div className="flex flex-col mt-8">
                {/* Minters section - displays wallets that have minted NFTs */}
                <div id="backers-section" className="order-first md:order-none mb-8">
                  <h3 className="text-xl font-bold mb-4">Backers
                     {/* <span className="text-sm font-normal text-gray-600">({walletMintCounts.length} unique wallets)</span> */}
                     </h3>
                  
                  {isLoadingWallets ? (
                    <div className="flex justify-center items-center py-6">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-700 mr-2"></div>
                      <span className="text-sm font-normal text-neutral-400">Loading...</span>
                    </div>
                  ) : walletMintCounts.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {walletMintCounts.map((wallet, index) => (
                          <li 
                            key={index} 
                            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              if (wallet.farcaster) {
                                viewFarcasterProfile(wallet.farcaster.fid, wallet.farcaster.accountUrl);
                              } else {
                                window.open(`https://basescan.org/address/${wallet.address}`, '_blank');
                              }
                            }}
                          >
                            <div className="flex items-center">
                              {wallet.farcaster ? (
                                <div className="flex items-center group">
                                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3 border border-gray-200">
                                    <img 
                                      src={wallet.farcaster?.pfpUrl} 
                                      alt={wallet.farcaster?.username} 
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                                      {wallet.farcaster?.username}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm font-medium text-gray-900 hover:text-purple-700 transition-colors">
                                  {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                                </div>
                              )}
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {wallet.count} {wallet.count === 1 ? 'mint' : 'mints'}
                              </span>
                            </div>
                            <div className="text-gray-400 hover:text-purple-700">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={1.5} 
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                                />
                              </svg>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No backer data available</p>
                    </div>
                  )}
                  
                  {/* Section for all unique wallet holders */}
                  {/* <div className="mt-6">
                    <h3 className="text-xl font-bold mb-4">All Unique Wallet Holders</h3>
                    {isLoadingWallets ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-purple-700 mr-2"></div>
                        <span className="text-sm font-normal text-neutral-400">Loading...</span>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="mb-2 text-sm text-gray-600">
                          Raw list of all unique wallet addresses:
                        </div>
                        {walletMintCounts.length > 0 ? (
                          <pre className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                            {walletMintCounts
                              .map(wallet => wallet.address)
                              .join('\n')}
                          </pre>
                        ) : (
                          <p className="text-gray-500 text-center py-3">No wallet data available</p>
                        )}
                      </div>
                    )}
                  </div> */}
                </div>
                
                {/* Warning section */}
                <div className="order-last md:order-none">
                  <Warning />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="h-[200px]"></div>

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
