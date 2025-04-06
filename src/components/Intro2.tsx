"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import Marquee from "react-fast-marquee";
import { Input } from "./ui/input";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import Link from "next/link";
import SpaceAnimation from "~/components/SpaceAnimation";
import sdk, {
  AddFrame,
  FrameNotificationDetails,
  SignIn as SignInCore,
  type Context,
} from "@farcaster/frame-sdk";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, degen, mainnet, optimism, unichain } from "wagmi/chains";
import { BaseError, UserRejectedRequestError } from "viem";
import { useSession } from "next-auth/react";
import { createStore } from "mipd";
import { Label } from "~/components/ui/label";

export default function Demo(
  { title }: { title?: string } = { title: "Frames v2 Demo" }
) {
  // Add a useEffect to prevent scrolling only on this page
  useEffect(() => {
    // Save original styles
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPosition = originalStyle.position;
    const originalHeight = originalStyle.height;
    const originalTouchAction = originalStyle.touchAction;
    
    // Apply no-scroll styles
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.height = '100%';
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    
    // Cleanup function to restore original styles when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
      document.body.style.touchAction = originalTouchAction;
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, []);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [added, setAdded] = useState(false);
  const [notificationDetails, setNotificationDetails] =
    useState<FrameNotificationDetails | null>(null);

  const [lastEvent, setLastEvent] = useState("");

  const [addFrameResult, setAddFrameResult] = useState("");
  const [sendNotificationResult, setSendNotificationResult] = useState("");

  useEffect(() => {
    setNotificationDetails(context?.client.notificationDetails ?? null);
  }, [context]);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const nextChain = useMemo(() => {
    if (chainId === base.id) {
      return optimism;
    } else if (chainId === optimism.id) {
      return degen;
    } else if (chainId === degen.id) {
      return mainnet;
    } else if (chainId === mainnet.id) {
      return unichain;
    } else {
      return base;
    }
  }, [chainId]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: nextChain.id });
  }, [switchChain, nextChain.id]);

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      setAdded(context.client.added);

      sdk.on("frameAdded", ({ notificationDetails }) => {
        setLastEvent(
          `frameAdded${!!notificationDetails ? ", notifications enabled" : ""}`
        );

        setAdded(true);
        if (notificationDetails) {
          setNotificationDetails(notificationDetails);
        }
      });

      sdk.on("frameAddRejected", ({ reason }) => {
        setLastEvent(`frameAddRejected, reason ${reason}`);
      });

      sdk.on("frameRemoved", () => {
        setLastEvent("frameRemoved");
        setAdded(false);
        setNotificationDetails(null);
      });

      sdk.on("notificationsEnabled", ({ notificationDetails }) => {
        setLastEvent("notificationsEnabled");
        setNotificationDetails(notificationDetails);
      });
      sdk.on("notificationsDisabled", () => {
        setLastEvent("notificationsDisabled");
        setNotificationDetails(null);
      });

      sdk.on("primaryButtonClicked", () => {
        console.log("primaryButtonClicked");
      });

      console.log("Calling ready");
      sdk.actions.ready({});

      // Set up a MIPD Store, and request Providers.
      const store = createStore();

      // Subscribe to the MIPD Store.
      store.subscribe((providerDetails) => {
        console.log("PROVIDER DETAILS", providerDetails);
        // => [EIP6963ProviderDetail, EIP6963ProviderDetail, ...]
      });
    };
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const openUrl = useCallback(() => {
    sdk.actions.openUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  }, []);

  const openWarpcastUrl = useCallback(() => {
    sdk.actions.openUrl("https://warpcast.com/~/compose");
  }, []);

  const close = useCallback(() => {
    sdk.actions.close();
  }, []);

  const addFrame = useCallback(async () => {
    try {
      setNotificationDetails(null);

      const result = await sdk.actions.addFrame();

      if (result.notificationDetails) {
        setNotificationDetails(result.notificationDetails);
      }
      setAddFrameResult(
        result.notificationDetails
          ? `Added, got notificaton token ${result.notificationDetails.token} and url ${result.notificationDetails.url}`
          : "Added, got no notification details"
      );
    } catch (error) {
      if (error instanceof AddFrame.RejectedByUser) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      if (error instanceof AddFrame.InvalidDomainManifest) {
        setAddFrameResult(`Not added: ${error.message}`);
      }

      setAddFrameResult(`Error: ${error}`);
    }
  }, []);

  const sendNotification = useCallback(async () => {
    setSendNotificationResult("");
    if (!notificationDetails || !context) {
      return;
    }

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fid: context.user.fid,
          notificationDetails,
        }),
      });

      if (response.status === 200) {
        setSendNotificationResult("Success");
        return;
      } else if (response.status === 429) {
        setSendNotificationResult("Rate limited");
        return;
      }

      const data = await response.text();
      setSendNotificationResult(`Error: ${data}`);
    } catch (error) {
      setSendNotificationResult(`Error: ${error}`);
    }
  }, [context, notificationDetails]);

  const sendTx = useCallback(() => {
    sendTransaction(
      {
        // call yoink() on Yoink contract
        to: "0x4bBFD120d9f352A0BEd7a014bd67913a2007a878",
        data: "0x9846cd9efc000023c0",
      },
      {
        onSuccess: (hash) => {
          setTxHash(hash);
        },
      }
    );
  }, [sendTransaction]);

  const signTyped = useCallback(() => {
    signTypedData({
      domain: {
        name: "Frames v2 Demo",
        version: "1",
        chainId,
      },
      types: {
        Message: [{ name: "content", type: "string" }],
      },
      message: {
        content: "Hello from Frames v2!",
      },
      primaryType: "Message",
    });
  }, [chainId, signTypedData]);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="fixed inset-0 touch-none overscroll-none"
      style={{
        paddingTop: context?.client.safeAreaInsets?.top ?? 0,
        paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
        paddingLeft: context?.client.safeAreaInsets?.left ?? 0,
        paddingRight: context?.client.safeAreaInsets?.right ?? 0,
      }}
    >
      <div className="fixed inset-0 font-[family-name:var(--font-geist-sans)] bg-neutral-900 text-white overflow-hidden flex flex-col">
        {/* Space Animation Background - positioned absolutely to cover the top portion */}
        <div className="absolute inset-0 w-full h-full">
          <SpaceAnimation
            imagePaths={["/moon.png", "/scroll.png", "/scroll2.png", "/mars.png", "/farcaster.png"]}
          />
        </div>
        
        {/* Main Content - using flex to create a balanced layout */}
        <main className="relative z-10 flex flex-col justify-between h-full w-full max-w-[700px] mx-auto px-4 py-6 overflow-hidden">
          {/* Top Section */}
          <div className="flex flex-col items-center pt-2">
            {/* <div className="font-mono">sidequest</div> */}
            <div className="text-[34px] mt-[55%] sm:text-[40px] text-center rounded-lg bg-black  p-2 sm:px-5 text-white mb-4">
              A new way to fund projects on farcaster 
            </div>
            
            {/* What is Backboard Section */}
            <div className="w-full sm:w-[90%] mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {/* <div className="bg-neutral-800 p-2 flex rounded-xl">
                  <h3 className="text-xs font-medium tracking-wider text-neutral-300">
                    ---
                  </h3>
                </div> */}
              </div>
              
              {/* What is Backboard Content */}
              {/* <div className="w-full p-2 bg-black bg-opacity-60 backdrop-blur-sm rounded-lg">
                <h2 className="text-2xl sm:text-4xl text-center text-white">
                  All or nothing crowdfunding for devs
                </h2>
              </div> */}
            </div>
          </div>
          
          {/* Middle Section - Live Projects */}
          <div className="w-full sm:w-[90%] mx-auto flex-grow flex flex-col justify-center items-center max-h-[50vh] overflow-hidden">
            {/* <div className="flex items-center justify-center gap-2 mb-3">
              <div className="bg-neutral-800 p-2 flex rounded-xl">
                <div className="relative mt-1 mr-2 h-2 w-2">
                  <div className="absolute inset-0 rounded-full bg-red-600"></div>
                  <div className="absolute inset-0 rounded-full bg-red-600 animate-ping"></div>
                </div>
                <h3 className="text-xs font-medium tracking-wider text-neutral-300">
                  LIVE PROJECTS
                </h3>
              </div>
            </div> */}
            
            {/* Project Preview Card - 50% smaller */}
            {/* <Link
              href="back"
              className="block w-[50%] mx-auto hover:opacity-90 transition-opacity"
            >
              <div className="w-full bg-neutral-800 bg-opacity-80 backdrop-blur-sm rounded-lg overflow-hidden scale-90">
                <div className="relative">
                  <img
                    src="/card3.png"
                    alt="Project Preview"
                    className="w-full h-auto object-cover max-h-[15vh]"
                  />
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black to-transparent">
                    <span className="text-xs font-bold text-white">
                      Quotient
                    </span>
                  </div>
                </div>
                
                <div className="p-2 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-semibold">$42 raised</div>
                    <div className="text-xs text-purple-400">1%</div>
                  </div>
                  
                  <div className="w-full bg-neutral-700 h-1 rounded-full mb-1">
                    <div
                      className="bg-purple-400 h-full rounded-full"
                      style={{ width: "2%" }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-neutral-600 flex items-center justify-center text-xs text-white">
                        J
                      </div>
                      <span className="text-xs text-neutral-400">Jordan</span>
                    </div>
                    <div className="text-xs text-neutral-400">6 days left</div>
                  </div>
                </div>
              </div>
            </Link> */}
          </div>
          
          {/* Bottom Section - Call to Action Buttons */}
          <div className="w-full sm:w-[90%] mx-auto mt-auto">
            <div className="grid grid-cols-1 gap-3 mb-4">
              <a
                href="/quotient"
                className="text-white border text-center border-purple-700 bg-purple-800 bg-opacity-90 backdrop-blur-sm px-4 py-3 rounded-lg text-lg font-medium hover:bg-purple-700 transition-colors w-full"
              >
                <div className="animate-pulse">Checkout Project #1</div>
              </a>
              
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/learn"
                  className="text-neutral-300 text-center bg-neutral-800 bg-opacity-80 backdrop-blur-sm px-4 py-3 rounded-lg text-base font-medium hover:bg-neutral-700 transition-colors w-full"
                >
                  Learn More
                </a>
                <a
                  href="/pitch"
                  className="text-neutral-300 text-center bg-neutral-800 bg-opacity-80 backdrop-blur-sm px-4 py-3 rounded-lg text-base font-medium hover:bg-neutral-700 transition-colors w-full"
                >
                  Pitch a Project
                </a>
              </div>
              
              {/* Backers Marquee Section */}
              <div className="mt-4 flex items-center bg-neutral-800 bg-opacity-60 backdrop-blur-sm rounded-lg py-2 px-3">
                <div className="text-neutral-300 text-sm font-medium mr-3">backer leaderboard</div>
                <Marquee
                  speed={30}
                  gradient={false}
                  pauseOnHover
                  className="text-neutral-400 text-sm"
                >

                  <span className="mx-1">jonbo.eth</span>
                  <span className="mx-1">codyb.eth</span>
                  <span className="mx-1">jesse.base.eth</span>
                  <span className="mx-1">@rev</span>
                  <span className="mx-1">@cryptonight</span>
                  <span className="mx-1">jonbo.eth</span>
                  <span className="mx-1">codyb.eth</span>
                  <span className="mx-1">jesse.base.eth</span>
                  <span className="mx-1">@rev</span>
                  <span className="mx-1">@cryptonight</span>

                </Marquee>
              </div>
            </div>
          </div>
        </main>
    </div>
    </div>
  );
}

function SignMessage() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignMessage = useCallback(async () => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
    }

    signMessage({ message: "Hello from Frames v2!" });
  }, [connectAsync, isConnected, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 text-xs">
          <div>Signature: {signature}</div>
        </div>
      )}
    </>
  );
}

function SendEth() {
  const { isConnected, chainId } = useAccount();
  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: data,
    });

  const toAddr = useMemo(() => {
    // Protocol guild address
    return chainId === base.id
      ? "0x32e3C7fD24e175701A35c224f2238d18439C7dBC"
      : "0xB3d8d7887693a9852734b4D25e9C0Bb35Ba8a830";
  }, [chainId]);

  const handleSend = useCallback(() => {
    sendTransaction({
      to: toAddr,
      value: 1n,
    });
  }, [toAddr, sendTransaction]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isSendTxPending}
        isLoading={isSendTxPending}
      >
        Send Transaction (eth)
      </Button>
      {isSendTxError && renderError(sendTxError)}
      {data && (
        <div className="mt-2 text-xs">
          <div>Hash: {truncateAddress(data)}</div>
          <div>
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInCore.SignInResult>();
  const [signInFailure, setSignInFailure] = useState<string>();
  const { data: session, status } = useSession();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      setSignInFailure(undefined);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);

      await signIn("credentials", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } catch (e) {
      if (e instanceof SignInCore.RejectedByUser) {
        setSignInFailure("Rejected by user");
        return;
      }

      setSignInFailure("Unknown error");
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);

  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-netural-900 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">Session</div>
          <div className="whitespace-pre">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInFailure && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-netural-900 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">{signInFailure}</div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 p-2 text-xs overflow-x-scroll bg-netural-900 rounded-lg font-mono">
          <div className="font-semibold text-gray-500 mb-1">SIWF Result</div>
          <div className="whitespace-pre">
            {JSON.stringify(signInResult, null, 2)}
          </div>
        </div>
      )}
    </>
  );
}

function ViewProfile() {
  const [fid, setFid] = useState("3");

  return (
    <>
      <div>
        <Label
          className="text-xs font-semibold text-gray-500 mb-1"
          htmlFor="view-profile-fid"
        >
          Fid
        </Label>
        <Input
          id="view-profile-fid"
          type="number"
          value={fid}
          className="mb-2"
          onChange={(e) => {
            setFid(e.target.value);
          }}
          step="1"
          min="1"
        />
      </div>
      <Button
        onClick={() => {
          sdk.actions.viewProfile({ fid: parseInt(fid) });
        }}
      >
        View Profile
      </Button>
    </>
  );
}

const renderError = (error: Error | null) => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};
