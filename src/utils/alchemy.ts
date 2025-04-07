import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";

// Initialize Alchemy SDK
export const initializeAlchemy = () => {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
  
  if (!apiKey) {
    console.warn("Alchemy API key not found. Please add NEXT_PUBLIC_ALCHEMY_API_KEY to your .env file");
    return null;
  }
  
  const settings = {
    apiKey,
    network: Network.BASE_MAINNET,
  };
  
  return new Alchemy(settings);
};

// Get NFT owners for a contract
export const getNFTOwners = async (contractAddress: string) => {
  const alchemy = initializeAlchemy();
  
  if (!alchemy) {
    return { owners: [], error: "Alchemy not initialized" };
  }
  
  try {
    const response = await alchemy.nft.getOwnersForContract(contractAddress);
    return { owners: response.owners, error: null };
  } catch (error) {
    console.error("Error fetching NFT owners:", error);
    return { owners: [], error };
  }
};

// Get NFT minters for a contract - using a different approach than transfers
export const getNFTTransfers = async (contractAddress: string) => {
  const alchemy = initializeAlchemy();
  
  if (!alchemy) {
    return { transfers: [], error: "Alchemy not initialized" };
  }
  
  try {
    // Get all NFT owners for the contract
    const { owners, error: ownersError } = await getNFTOwners(contractAddress);
    
    if (ownersError || owners.length === 0) {
      throw new Error("Could not get NFT owners");
    }
    
    // Transform the owners data into a format similar to transfers
    const transformedData = owners.map(owner => ({
      to: owner,
      from: null,
      asset: contractAddress,
    }));
    
    return { transfers: transformedData, error: null };
  } catch (error) {
    console.error("Error fetching NFT owners:", error);
    
    // Fallback: Try to get NFTs for the contract
    try {
      const nftsResponse = await alchemy.nft.getNftsForContract(contractAddress);
      
      // Transform the NFT data to match expected format
      const transformedNftData = nftsResponse.nfts.map(nft => ({
        to: null, // We don't have owner info in this response
        from: null,
        asset: contractAddress,
        tokenId: nft.tokenId
      }));
      
      return { transfers: transformedNftData, error: null };
    } catch (fallbackError) {
      console.error("All Alchemy methods failed:", fallbackError);
      return { transfers: [], error };
    }
  }
};

// Get contract metadata including totalSupply
export const getContractMetadata = async (contractAddress: string) => {
  const alchemy = initializeAlchemy();
  
  if (!alchemy) {
    return { metadata: null, error: "Alchemy not initialized" };
  }
  
  try {
    const metadata = await alchemy.nft.getContractMetadata(contractAddress);
    return { metadata, error: null };
  } catch (error) {
    console.error("Error fetching contract metadata:", error);
    return { metadata: null, error };
  }
};

// Get token balance for an address
export const getTokenBalance = async (contractAddress: string) => {
  const alchemy = initializeAlchemy();
  
  if (!alchemy) {
    return { balance: "0", error: "Alchemy not initialized" };
  }
  
  try {
    const balance = await alchemy.core.getBalance(contractAddress);
    return { balance: balance.toString(), error: null };
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return { balance: "0", error };
  }
};

// Cache for wallet mint counts to avoid repeated API calls
let walletMintCountsCache: {
  [contractAddress: string]: {
    wallets: { address: string; count: number }[];
    timestamp: number;
  };
} = {};

// Cache expiration time in milliseconds (1 hour)
const CACHE_EXPIRATION = 60 * 60 * 1000;

// Get accurate NFT ownership data from the blockchain with caching
export const getWalletMintCounts = async (contractAddress: string) => {
  const alchemy = initializeAlchemy();
  
  if (!alchemy) {
    return { wallets: [], error: "Alchemy not initialized" };
  }
  
  // Check if we have cached data that's still valid
  const cachedData = walletMintCountsCache[contractAddress];
  const now = Date.now();
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRATION) {
    console.log("Using cached wallet mint counts data");
    return { wallets: cachedData.wallets, error: null };
  }
  
  // If no valid cache, fetch fresh data
  try {
    console.log("Fetching fresh wallet mint counts data");
    
    // Get all owners for this contract
    const ownersForContract = await alchemy.nft.getOwnersForContract(contractAddress);
    const owners = ownersForContract.owners;
    
    // Create a map to track NFT ownership counts per wallet
    const ownershipCounts: Record<string, number> = {};
    
    // For each owner, get their NFT count for this contract
    const ownerPromises = owners.map(async (owner) => {
      try {
        // Get NFTs owned by this address for this specific contract
        const nftsForOwner = await alchemy.nft.getNftsForOwner(owner, {
          contractAddresses: [contractAddress]
        });
        
        // Store the count of NFTs owned
        return { owner: owner.toLowerCase(), count: nftsForOwner.ownedNfts.length };
      } catch (ownerError) {
        console.error(`Error getting NFTs for owner ${owner}:`, ownerError);
        // If we can't get the count, assume they own at least 1
        return { owner: owner.toLowerCase(), count: 1 };
      }
    });
    
    // Wait for all owner NFT counts to be fetched
    const ownerResults = await Promise.all(ownerPromises);
    
    // Process results
    ownerResults.forEach(({ owner, count }) => {
      ownershipCounts[owner] = count;
    });
    
    // Convert to array format for display
    const wallets = Object.entries(ownershipCounts)
      .filter(([_, count]) => count > 0) // Only include owners with at least 1 NFT
      .map(([address, count]) => ({
        address,
        count
      }));
    
    // Sort by count (highest first)
    wallets.sort((a, b) => b.count - a.count);
    
    // Cache the results
    walletMintCountsCache[contractAddress] = {
      wallets,
      timestamp: now
    };
    
    console.log(`Found ${wallets.length} wallet holders with NFTs`);
    return { wallets, error: null };
  } catch (error) {
    console.error("Error fetching NFT ownership data:", error);
    
    // If all else fails, try a simpler approach
    try {
      const ownersResponse = await alchemy.nft.getOwnersForContract(contractAddress);
      const owners = ownersResponse.owners;
      
      // Just create a basic list with 1 NFT per owner
      const wallets = owners.map(owner => ({
        address: owner.toLowerCase(),
        count: 1 // Default to 1 NFT per owner if we can't get accurate counts
      }));
      
      // Cache even this fallback result
      walletMintCountsCache[contractAddress] = {
        wallets,
        timestamp: now
      };
      
      return { wallets, error: null };
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
      return { wallets: [], error: error };
    }
  }
};

// Get real-time ETH price in USD using CoinGecko's public API
export const getEthPrice = async () => {
  try {
    // Use CoinGecko's public API to get the current ETH price
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const ethPrice = data?.ethereum?.usd || 0;
    
    return { price: ethPrice, error: null };
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return { price: 0, error };
  }
};

// Get total NFT count for a contract
export const getNFTCount = async (contractAddress: string) => {
  const alchemy = initializeAlchemy();
  
  if (!alchemy) {
    return { count: 0, error: "Alchemy not initialized" };
  }
  
  try {
    // First try to get it from contract metadata
    const { metadata, error: metadataError } = await getContractMetadata(contractAddress);
    
    if (!metadataError && metadata && metadata.totalSupply) {
      return { count: Number(metadata.totalSupply), error: null };
    }
    
    // If that fails, try to count owners
    const { owners, error: ownersError } = await getNFTOwners(contractAddress);
    
    if (!ownersError && owners.length > 0) {
      return { count: owners.length, error: null };
    }
    
    // Last resort: try to count NFTs
    const nftsResponse = await alchemy.nft.getNftsForContract(contractAddress);
    return { count: nftsResponse.nfts.length, error: null };
  } catch (error) {
    console.error("Error fetching NFT count:", error);
    
    // Final fallback: use ethers to call totalSupply directly
    try {
      const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
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
      
      const contract = new ethers.Contract(contractAddress, minimalAbi, provider);
      const totalSupply = await contract.totalSupply();
      return { count: Number(totalSupply), error: null };
    } catch (contractError) {
      console.error("Error calling contract directly:", contractError);
      return { count: 0, error };
    }
  }
};
