import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import {
  CHAIN_ID,
  fetchOwnerSpends,
  fetchOwnerVaults,
  type ChainVault,
} from "@/lib/chain";

const REFRESH_MS = 30_000;

/** The connected owner's vaults, read from the contract. Keyed by address, so it fetches once per address. */
export function useOwnerVaults(owner: Address | undefined) {
  const client = usePublicClient({ chainId: CHAIN_ID });
  return useQuery({
    queryKey: ["vaults", CHAIN_ID, owner],
    enabled: !!owner && !!client,
    queryFn: () => fetchOwnerVaults(client!, owner!),
    staleTime: 10_000,
    refetchInterval: REFRESH_MS,
  });
}

/** Spend events across the given vaults, newest first. Waits until vaults are known. */
export function useOwnerSpends(vaults: ChainVault[] | undefined) {
  // Keyed by each vault's on-chain spentTotal: a new fetch happens only when a spend
  // actually landed on-chain (vaults are polled via cheap RPC reads), never on a timer.
  const key = vaults ? vaults.map((v) => `${v.id}:${v.spent_total}`).join(",") : "";
  return useQuery({
    queryKey: ["spends", CHAIN_ID, key],
    enabled: !!vaults,
    queryFn: () => fetchOwnerSpends(vaults!),
    // The explorer log API has a small request quota, so never poll or refocus-refetch it.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
