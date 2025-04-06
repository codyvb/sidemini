import axios from 'axios';

/**
 * Get Farcaster username for a wallet address using Neynar API
 * Directly follows the example from https://docs.neynar.com/docs/fetching-farcaster-user-based-on-ethereum-address
 */
export const getFarcasterUsernamesBulk = async (walletAddresses: string[], apiKey?: string) => {
  const result = new Map();
  const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || apiKey;
  
  if (!neynarApiKey || walletAddresses.length === 0) {
    return result;
  }
  
  try {
    // Format addresses with 0x prefix
    const addresses = walletAddresses.map(addr => 
      addr.startsWith('0x') ? addr.toLowerCase() : `0x${addr}`.toLowerCase()
    ).join(',');
    
    // Call Neynar API exactly as shown in the docs
    const response = await axios.get(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addresses}&api_key=${neynarApiKey}`
    );
    
    console.log('Neynar API response:', response.data);
    
    // Process users from response
    if (response.data?.users) {
      for (const user of response.data.users) {
        // Store user info for custody address
        if (user.custody_address) {
          result.set(user.custody_address.toLowerCase(), {
            username: user.username,
            displayName: user.display_name,
            fid: user.fid
          });
        }
        
        // Store user info for each verified address
        if (user.verified_addresses?.eth_addresses) {
          for (const addr of user.verified_addresses.eth_addresses) {
            result.set(addr.toLowerCase(), {
              username: user.username,
              displayName: user.display_name,
              fid: user.fid
            });
          }
        }
      }
    }
    
    // Set default values for addresses not found
    for (const addr of walletAddresses) {
      const normalizedAddr = addr.startsWith('0x') ? 
        addr.toLowerCase() : `0x${addr}`.toLowerCase();
      
      if (!result.has(normalizedAddr)) {
        result.set(normalizedAddr, { username: null, displayName: null });
      }
    }
  } catch (error) {
    console.error('Error fetching Farcaster usernames:', error);
  }
  
  return result;
};
