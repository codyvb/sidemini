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

export default function Demo({ title, onMintSuccess }: { title?: string, onMintSuccess?: () => void } = { title: "Mint Demo" }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FarcasterContext | null>(null);
  const [isInFarcaster, setIsInFarcaster] = useState<boolean | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [mintQuantity, setMintQuantity] = useState(1);
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  // Fixed ETH price in USD
  const ethPrice = 1550;

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
    
    // Calculate the value based on quantity (0.01 ETH per mint)
    const valuePerMint = BigInt(10000000000000000); // 0.01 ETH in wei (10^16)
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
  
  // Close wallet modal
  const closeWalletModal = () => {
    setShowWalletModal(false);
  };

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  // Render the price information section in receipt style
  const renderPriceInfo = () => {
    // Fixed mint price: 0.01 ETH (real price from contract)
    const mintPriceETH = 0.01;
    const mintPriceUSD = mintPriceETH * ethPrice;
    
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold mt-[-20px]">Access Pass</div>
          <div className="text-right">
            <div className="text-xl font-bold">0.01 ETH</div>
            <div className="text-sm text-gray-500">(~$15 USD)</div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 mb-4">
          <span>Quantity:</span>
          <div className="flex items-center">
            <button
              onClick={() => setMintQuantity(prev => Math.max(1, prev - 1))}
              disabled={mintQuantity <= 1 || !isConnected}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l"
            >
              -
            </button>
            <div className="w-12 h-8 flex items-center justify-center border-t border-b border-gray-300">
              {mintQuantity}
            </div>
            <button
              onClick={() => setMintQuantity(prev => Math.min(10, prev + 1))}
              disabled={mintQuantity >= 10 || !isConnected}
              className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r"
            >
              +
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 my-4 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Total:</span>
            <div className="text-right">
              <div className="text-xl font-bold">
                {mintQuantity === 1 ? '0.01' : '0.0' + mintQuantity} ETH
              </div>
              <div className="text-sm text-gray-500">
                (~$15 USD)
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="w-full">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold text-center mb-4">{title}</h1>
        
        {/* Always show price info in receipt style */}
        {renderPriceInfo()}
        
        {/* Authentication and transaction buttons */}
        {!isConnected ? (
          <Button
            onClick={handleWalletConnection}
            className="w-full py-3 px-4"
          >
            Connect Wallet
          </Button>
        ) : (
          <Button
            onClick={sendTx}
            disabled={!isConnected || isSendTxPending}
            isLoading={isSendTxPending}
            className="w-full"
          >
            Back this project
          </Button>
        )}
        
        {/* Error messages */}
        {isSendTxError && renderError(sendTxError)}
        {isSwitchChainError && renderError(switchChainError)}
        
        {/* Transaction status */}
        {txHash && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-md">
            <p>Transaction sent!</p>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-xs"
            >
              View on BaseScan: {truncateAddress(txHash)}
            </a>
            <div className="text-xs mt-1">
              Status:{" "}
              {isConfirming
                ? "Confirming..."
                : isConfirmed
                ? (() => {
                    // Call the onMintSuccess callback if provided
                    if (onMintSuccess && typeof onMintSuccess === 'function') {
                      onMintSuccess();
                    }
                    return "Confirmed!";
                  })()
                : "Pending"}
            </div>
          </div>
        )}
        
        {/* Wallet Selection Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeWalletModal}>
            <div className="bg-white rounded-xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Connect Wallet</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => connectWithWallet(1)} 
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between"
                >
                  <span>Browser Wallet</span>
                  <span>MetaMask / Injected</span>
                </button>
                <button 
                  onClick={() => connectWithWallet(2)} 
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between"
                >
                  <span>Coinbase Wallet</span>
                  <span>Connect with Coinbase</span>
                </button>
                <button 
                  onClick={() => connectWithWallet(3)} 
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-between"
                >
                  <span>WalletConnect</span>
                  <span>Scan with phone</span>
                </button>
              </div>
              <button 
                onClick={closeWalletModal} 
                className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
