"use client";

import { useState, useEffect } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi";

import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base } from "viem/chains";
import { BaseError, UserRejectedRequestError } from "viem";
import sdk from "@farcaster/frame-sdk";

// Define a type for the Farcaster context based on what we're using
type FarcasterContext = {
  client?: {
    safeAreaInsets?: {
      top?: number;
      bottom?: number;
      left?: number;
      right?: number;
    };
  };
  frameId?: string;
  castId?: {
    fid: number;
    hash: string;
  };
};

export default function Demo({ title }: { title?: string } = { title: "Mint Demo" }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FarcasterContext | null>(null);
  const [isInFarcaster, setIsInFarcaster] = useState<boolean | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mintQuantity, setMintQuantity] = useState(1);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Force switch to Base mainnet when the component mounts
  useEffect(() => {
    // Always try to switch to Base mainnet when the component loads
    if (chainId !== base.id) {
      switchChain({ chainId: base.id });
    }
  }, [chainId, switchChain]);

  // Initialize Farcaster SDK
  useEffect(() => {
    const load = async () => {
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // Determine if we're in a Farcaster frame
        // Check if we have a valid context
        setIsInFarcaster(!!frameContext);
        
        // Set up SDK event listeners
        sdk.on("primaryButtonClicked", () => {
          console.log("primaryButtonClicked");
        });

        console.log("Calling ready");
        sdk.actions.ready({});
      } catch (error) {
        console.error("Error initializing Farcaster SDK:", error);
        setIsInFarcaster(false);
      }
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

  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  const {
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const sendTx = async () => {
    // Ensure we're on Base mainnet before sending the transaction
    if (chainId !== base.id) {
      switchChain({ chainId: base.id });
      return;
    }
    
    // Calculate the value based on quantity (0.0001 ETH per mint)
    const valuePerMint = BigInt(10000000000000000); // 0.0001 ETH in wei
    const totalValue = valuePerMint * BigInt(mintQuantity);
    
    try {
      // For Farcaster Frames, we need to use the sdk.wallet.ethProvider
      // This ensures the transaction is properly formatted for Warpcast
      if (isInFarcaster && sdk.wallet?.ethProvider) {
        // Prepare the transaction parameters
        const txParams = {
          to: "0xc049e891b0542414ead02223b1b70e0bc99d1511" as `0x${string}`,
          from: address,
          value: `0x${totalValue.toString(16)}` as `0x${string}`,
          data: `0x40c10f19000000000000000000000000${address?.slice(2)}000000000000000000000000000000000000000000000000000000000000000${mintQuantity}` as `0x${string}`,
          chainId: `0x${base.id.toString(16)}` as `0x${string}`,
        };
        
        // Use the Farcaster ethProvider to send the transaction
        const hash = await sdk.wallet.ethProvider.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        });
        
        setTxHash(hash as string);
      } else {
        // Outside Farcaster, use the regular wagmi sendTransaction
        sendTransaction(
          {
            to: "0xc049e891b0542414ead02223b1b70e0bc99d1511",
            data: `0x40c10f19000000000000000000000000${address?.slice(2)}000000000000000000000000000000000000000000000000000000000000000${mintQuantity}` as `0x${string}`,
            value: totalValue,
            chainId: base.id,
          },
          {
            onSuccess: (hash) => {
              setTxHash(hash);
            },
          }
        );
      }
    } catch (error) {
      console.error("Transaction error:", error);
    }
  };

  const renderError = (error: Error | null) => {
    if (!error) return null;
    if (error instanceof BaseError) {
      return (
        <div className="mt-2 text-xs text-red-500">
          {error.shortMessage || error.message}
        </div>
      );
    }
    return (
      <div className="mt-2 text-xs text-red-500">{error.message}</div>
    );
  };

  // Handle wallet connection based on environment
  const handleWalletConnection = () => {
    if (isConnected) {
      // If already connected, just disconnect
      disconnect();
    } else {
      if (isInFarcaster) {
        // In Farcaster, use the Farcaster connector directly (first connector)
        connect({ connector: config.connectors[0] });
      } else {
        // Outside Farcaster, show wallet selection modal
        setShowWalletModal(true);
      }
    }
  };

  // Connect with a specific wallet when selected from the modal
  const connectWithWallet = (connectorIndex: number) => {
    connect({ connector: config.connectors[connectorIndex] });
    setShowWalletModal(false);
  };

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full ">
      <div className="w-[300px] mx-auto py-2 px-2">
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>
        
        <div className="mb-4 p-2 bg-gray-100 rounded-lg">
          <h2 className="font-bold text-black text-sm mb-1">Status</h2>
          <div className="text-xs text-black">
            {isInFarcaster === null ? (
              <span className="text-yellow-500">Detecting environment...</span>
            ) : isInFarcaster ? (
              <span className="text-green-500">Running inside Farcaster Frame ✓</span>
            ) : (
              <span className="text-blue-500">Running outside Farcaster Frame</span>
            )}
            {isInFarcaster && context && (
              <div className="mt-1">
                <div>Context Details:</div>
                <pre className="mt-1 text-[10px] overflow-x-auto">
                  {JSON.stringify(context, null, 2).substring(0, 200)}...
                </pre>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          {address && (
            <div className="my-2 text-xs">
              Address: <pre className="inline">{truncateAddress(address)}</pre>
            </div>
          )}

          {chainId && (
            <div className="my-2 text-xs">
              Chain ID: <pre className="inline">{chainId === 8453 ? "8453 (Base)" : chainId}</pre>
            </div>
          )}

          <Button
            onClick={handleWalletConnection}
          >
            {isConnected ? "Disconnect" : "Connect"}
          </Button>

          {/* Wallet Selection Modal - Only shown outside Farcaster */}
          {showWalletModal && !isConnected && !isInFarcaster && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 w-[280px] max-w-full">
                <h3 className="text-lg font-bold mb-3 text-black">Select a Wallet</h3>
                <div className="space-y-2">
                  <button
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center text-black"
                    onClick={() => connectWithWallet(1)} // MetaMask/Injected
                  >
                    <span className="mr-2">🦊</span>
                    MetaMask / Injected
                  </button>
                  <button
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center text-black"
                    onClick={() => connectWithWallet(2)} // Coinbase Wallet
                  >
                    <span className="mr-2">💰</span>
                    Coinbase Wallet
                  </button>
                </div>
                <button
                  className="mt-3 w-full py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600"
                  onClick={() => setShowWalletModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Mint Quantity</label>
              <div className="flex items-center">
                <button 
                  className="px-3 py-1 bg-gray-200 text-black rounded-l-lg hover:bg-gray-300 disabled:opacity-50"
                  onClick={() => setMintQuantity(prev => Math.max(1, prev - 1))}
                  disabled={mintQuantity <= 1}
                >
                  -
                </button>
                <div className="px-4 py-1 bg-gray-100 text-black text-center min-w-[40px]">
                  {mintQuantity}
                </div>
                <button 
                  className="px-3 py-1 bg-gray-200 text-black rounded-r-lg hover:bg-gray-300"
                  onClick={() => setMintQuantity(prev => Math.min(10, prev + 1))}
                >
                  +
                </button>
              </div>
              <div className="text-xs mt-1">
                Cost: {(0.0001 * mintQuantity).toFixed(4)} ETH
              </div>
            </div>
            
            <Button
              onClick={sendTx}
              disabled={!isConnected || isSendTxPending}
              isLoading={isSendTxPending}
            >
              Mint {mintQuantity > 1 ? `${mintQuantity} NFTs` : 'NFT'}
            </Button>
            {isSendTxError && renderError(sendTxError)}
            {isSwitchChainError && renderError(switchChainError)}
            {txHash && (
              <div className="mt-2 text-xs">
                <div>Hash: {truncateAddress(txHash)}</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
