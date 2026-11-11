import { useAccount } from "wagmi";

/**
 * Thin re-export of wagmi's useAccount.
 * Components that need address use addressRef internally for stable load callbacks.
 */
export function useStableAddress() {
  return useAccount();
}
