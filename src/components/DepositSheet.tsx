import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from "wagmi";
import { erc20Abi, type Address } from "viem";
import { X, Loader2, CheckCircle2, Info } from "lucide-react";
import { AGENT_VAULT_ABI } from "@/lib/abi";
import { getUsdc, buildTxExplorerUrl } from "@/onchain-facts";
import { parseAmount, Amount, usdcDecimalsFor } from "@/onchain-money";

const CHAIN_ID = 5042002;
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "") as Address;

interface Props {
  vaultId: number;
  open: boolean;
  onClose: () => void;
  onDeposited: () => void;
}

export function DepositSheet({ vaultId, open, onClose, onDeposited }: Props) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const [amountStr, setAmountStr] = useState("");
  const [done, setDone] = useState(false);

  const usdcFact = getUsdc(CHAIN_ID);
  const wrongChain = chainId !== CHAIN_ID;

  const { data: balanceRaw } = useReadContract({
    address: usdcFact?.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  });

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: usdcFact?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", CONTRACT_ADDRESS],
    chainId: CHAIN_ID,
    query: { enabled: !!address && !!CONTRACT_ADDRESS },
  });

  const parsed = amountStr ? parseAmount(CHAIN_ID, amountStr) : null;
  const amountRaw = parsed?.raw ?? 0n;
  const currentAllowance = allowanceRaw ?? 0n;
  const needsApproval = currentAllowance < amountRaw;

  const { writeContract: approve, data: approveHash, isPending: approving } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { writeContract: deposit, data: depositHash, isPending: depositing } = useWriteContract();
  const { isLoading: depositConfirming, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  React.useEffect(() => {
    if (approveSuccess) { void refetchAllowance(); }
  }, [approveSuccess, refetchAllowance]);

  // `onDeposited` is a new inline function on every parent render; notify once per deposit tx.
  const notifiedDeposit = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!depositSuccess || !depositHash || notifiedDeposit.current === depositHash) return;
    notifiedDeposit.current = depositHash;
    setDone(true);
    onDeposited();
  }, [depositSuccess, depositHash, onDeposited]);

  const handleApprove = () => {
    if (!usdcFact) return;
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    approve({
      address: usdcFact.address as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amountRaw],
      chainId: CHAIN_ID,
    });
  };

  const handleDeposit = () => {
    if (!CONTRACT_ADDRESS || amountRaw === 0n) return;
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    deposit({
      address: CONTRACT_ADDRESS,
      abi: AGENT_VAULT_ABI,
      functionName: "deposit",
      args: [BigInt(vaultId), amountRaw],
      chainId: CHAIN_ID,
    });
  };

  const isPending = approving || approveConfirming || depositing || depositConfirming;
  const balanceFmt = balanceRaw !== undefined
    ? Amount.fromRaw(balanceRaw, usdcDecimalsFor(CHAIN_ID)).toString()
    : null;

  const handleClose = () => {
    setAmountStr("");
    setDone(false);
    onClose();
  };

  // Escape key closes the sheet
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const primaryLabel = () => {
    if (wrongChain) return "Switch to Arc Testnet";
    if (approving) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>;
    if (approveConfirming) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Approving...</span>;
    if (depositing) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>;
    if (depositConfirming) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Depositing...</span>;
    if (needsApproval && amountRaw > 0n) return "Approve USDC";
    return "Deposit";
  };

  const handlePrimary = () => {
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    if (needsApproval && amountRaw > 0n) {
      handleApprove();
    } else {
      handleDeposit();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.section
            className="relative w-full max-w-sm overflow-hidden rounded-t-3xl sm:rounded-3xl"
            style={{ background: "var(--sheet-bg)", border: "1px solid var(--border)", backdropFilter: "blur(40px)" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-0.5" style={{ background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 50%, var(--accent) 100%)" }} />
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
            </div>

            <div className="px-5 pb-6 pt-2">
              {done ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl" style={{ background: "var(--tint-success)" }}>
                    <CheckCircle2 className="size-7" style={{ color: "var(--success)" }} />
                  </div>
                  <div className="display text-xl font-700 mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                    Deposited
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                    {amountStr} USDC added to Vault #{vaultId}
                  </p>
                  {depositHash && (
                    <a href={buildTxExplorerUrl(CHAIN_ID, depositHash)} target="_blank" rel="noreferrer"
                      className="text-xs font-medium" style={{ color: "var(--accent)" }}>
                      View on explorer
                    </a>
                  )}
                  <button onClick={handleClose} className="mt-5 w-full rounded-2xl py-3 text-sm font-semibold"
                    style={{ background: "var(--surface-strong)", color: "var(--ink-2)" }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="display text-lg font-700" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Fund Vault #{vaultId}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>Add USDC to the agent's budget</p>
                    </div>
                    <button onClick={handleClose} style={{ color: "var(--subtle)" }}><X className="size-5" /></button>
                  </div>

                  <div className="rounded-2xl p-4 mb-4" style={{ background: "var(--surface-strong)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] uppercase tracking-wider font-medium" style={{ color: "var(--subtle)" }}>Amount</label>
                      {balanceFmt && (
                        <button
                          onClick={() => balanceFmt && setAmountStr(balanceFmt)}
                          className="text-[11px] font-medium"
                          style={{ color: "var(--accent)" }}
                        >
                          Balance: {balanceFmt} · Max
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ""))}
                        inputMode="decimal" placeholder="0.00"
                        className="flex-1 bg-transparent display text-3xl font-700 tabular-nums outline-none placeholder:opacity-30"
                        style={{ color: "var(--ink)" }}
                      />
                      <span className="text-sm font-medium" style={{ color: "var(--subtle)" }}>USDC</span>
                    </div>
                  </div>

                  {needsApproval && amountRaw > 0n && (
                    <div className="flex items-start gap-2 rounded-xl p-3 mb-4 text-xs"
                      style={{ background: "var(--tint-accent)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                      <Info className="size-4 shrink-0 mt-0.5" />
                      You'll approve USDC first, then deposit (2 transactions).
                    </div>
                  )}

                  <button
                    onClick={handlePrimary}
                    disabled={amountRaw === 0n || isPending}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--accent)", color: "var(--on-accent)" }}
                  >
                    {primaryLabel()}
                  </button>
                </>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
