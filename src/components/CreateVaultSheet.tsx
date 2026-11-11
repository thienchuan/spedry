import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from "wagmi";
import { erc20Abi, type Address } from "viem";
import { X, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { AGENT_VAULT_ABI } from "@/lib/abi";
import { getUsdc, buildTxExplorerUrl } from "@/onchain-facts";
import { parseAmount, Amount, usdcDecimalsFor } from "@/onchain-money";

const CHAIN_ID = 5042002; // Arc Testnet
const CONTRACT_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? "") as Address;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Step = "configure" | "approve" | "create" | "success";

export function CreateVaultSheet({ open, onClose, onCreated }: Props) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  // Form
  const [name, setName] = useState("");
  const [agentAddr, setAgentAddr] = useState("");
  const [budgetStr, setBudgetStr] = useState("");
  const [dailyStr, setDailyStr] = useState("");
  const [perTxStr, setPerTxStr] = useState("");
  const [expiryDays, setExpiryDays] = useState("0");
  const [step, setStep] = useState<Step>("configure");

  const usdcFact = getUsdc(CHAIN_ID);
  const wrongChain = chainId !== CHAIN_ID;

  // Read user balance
  const { data: balanceRaw } = useReadContract({
    address: usdcFact?.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address ?? "0x0000000000000000000000000000000000000000"],
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  });

  // Read current allowance
  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: usdcFact?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address ?? "0x0000000000000000000000000000000000000000", CONTRACT_ADDRESS],
    chainId: CHAIN_ID,
    query: { enabled: !!address && !!CONTRACT_ADDRESS },
  });

  // USDC approve
  const { writeContract: approve, data: approveHash, isPending: approving } = useWriteContract();
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Create vault
  const { writeContract: createVault, data: createHash, isPending: creating } = useWriteContract();
  const { isLoading: createConfirming, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createHash });

  React.useEffect(() => {
    if (approveSuccess) {
      void refetchAllowance();
      setStep("create");
    }
  }, [approveSuccess, refetchAllowance]);

  React.useEffect(() => {
    if (createSuccess) {
      setStep("success");
      onCreated();
    }
  }, [createSuccess, onCreated]);

  const parsedBudget = budgetStr ? parseAmount(CHAIN_ID, budgetStr) : null;
  const parsedDaily = dailyStr ? parseAmount(CHAIN_ID, dailyStr) : null;
  const parsedPerTx = perTxStr ? parseAmount(CHAIN_ID, perTxStr) : null;

  const budgetRaw = parsedBudget?.raw ?? 0n;
  const dailyRaw = parsedDaily?.raw ?? 0n;
  const perTxRaw = parsedPerTx?.raw ?? 0n;
  const currentAllowance = allowanceRaw ?? 0n;
  const needsApproval = currentAllowance < budgetRaw;

  // expiryTs computed at submit time, not during render — stored in ref to avoid purity lint
  const getExpiryTs = () =>
    Number(expiryDays) > 0
      ? BigInt(Math.floor(Date.now() / 1000) + Number(expiryDays) * 86400)
      : 0n;

  const isValidAddress = (a: string) => /^0x[0-9a-fA-F]{40}$/.test(a);
  const formValid = name.trim().length > 0
    && isValidAddress(agentAddr)
    && budgetRaw > 0n
    && !!CONTRACT_ADDRESS;

  const handleApprove = () => {
    if (!usdcFact) return;
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    approve({
      address: usdcFact.address as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, budgetRaw],
      chainId: CHAIN_ID,
    });
    setStep("approve");
  };

  const handleCreate = () => {
    if (!formValid) return;
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    createVault({
      address: CONTRACT_ADDRESS,
      abi: AGENT_VAULT_ABI,
      functionName: "createVault",
      args: [
        agentAddr as Address,
        name,
        budgetRaw,
        dailyRaw,
        perTxRaw,
        getExpiryTs(),
      ],
      chainId: CHAIN_ID,
    });
    setStep("create");
  };

  const handlePrimary = () => {
    if (wrongChain) { switchChain({ chainId: CHAIN_ID }); return; }
    if (needsApproval && step === "configure") {
      handleApprove();
    } else if (step === "configure" || step === "approve") {
      handleCreate();
    }
  };

  const handleClose = () => {
    setStep("configure");
    setName(""); setAgentAddr(""); setBudgetStr(""); setDailyStr(""); setPerTxStr(""); setExpiryDays("0");
    onClose();
  };

  // Escape key closes the sheet
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const balanceFmt = balanceRaw !== undefined
    ? Amount.fromRaw(balanceRaw, usdcDecimalsFor(CHAIN_ID)).toString()
    : null;

  const isPending = approving || approveConfirming || creating || createConfirming;

  const primaryLabel = () => {
    if (wrongChain) return "Switch to Arc Testnet";
    if (!CONTRACT_ADDRESS) return "Contract not deployed";
    if (approving) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>;
    if (approveConfirming) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Approving USDC...</span>;
    if (creating) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>;
    if (createConfirming) return <span className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Creating vault...</span>;
    if (needsApproval) return "Approve USDC";
    return "Create Vault";
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
            style={{ background: "rgba(10,24,44,0.97)", border: "1px solid var(--border)", backdropFilter: "blur(40px)" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Spectral strip */}
            <div className="h-0.5" style={{ background: "linear-gradient(90deg, #acc6e9 0%, #5b87c5 50%, #acc6e9 100%)" }} />

            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/10" />
            </div>

            <div className="px-5 pb-6 pt-2">
              {step === "success" ? (
                <div className="text-center py-6">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl"
                    style={{ background: "rgba(74,222,128,0.10)" }}>
                    <CheckCircle2 className="size-7" style={{ color: "var(--success)" }} />
                  </div>
                  <div className="display text-xl font-700 mb-2" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                    Vault Created
                  </div>
                  <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                    Your agent vault is live on Arc Testnet. Deposit USDC to start.
                  </p>
                  {createHash && (
                    <a
                      href={buildTxExplorerUrl(CHAIN_ID, createHash)}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      View on explorer
                    </a>
                  )}
                  <button
                    onClick={handleClose}
                    className="mt-5 w-full rounded-2xl py-3 text-sm font-semibold"
                    style={{ background: "var(--surface-strong)", color: "var(--ink-2)" }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="display text-lg font-700" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                        New Agent Vault
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--subtle)" }}>
                        Onchain spend policy for your agent
                      </p>
                    </div>
                    <button onClick={handleClose} style={{ color: "var(--subtle)" }}>
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2 mb-5">
                    {(["configure", "approve", "create"] as const).map((s, i) => (
                      <React.Fragment key={s}>
                        <div className="flex items-center gap-1.5">
                          <div
                            className="flex size-5 items-center justify-center rounded-full text-[10px] font-700"
                            style={{
                              background: step === s ? "var(--accent)" : "var(--surface-muted)",
                              color: step === s ? "#0a1525" : "var(--subtle)",
                            }}
                          >{i + 1}</div>
                          <span className="text-[11px] hidden sm:inline" style={{ color: step === s ? "var(--ink-2)" : "var(--subtle)" }}>
                            {s === "configure" ? "Policy" : s === "approve" ? "Approve" : "Deploy"}
                          </span>
                        </div>
                        {i < 2 && <div className="flex-1 h-px" style={{ background: "var(--border)" }} />}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Fields */}
                  <div className="space-y-3">
                    <Field label="Vault Name">
                      <input
                        value={name} onChange={(e) => setName(e.target.value)}
                        placeholder='e.g. "GPT-4o Research Agent"'
                        className="w-full bg-transparent text-sm outline-none placeholder:opacity-40"
                        style={{ color: "var(--ink)" }}
                      />
                    </Field>

                    <Field label="Agent Wallet Address">
                      <input
                        value={agentAddr} onChange={(e) => setAgentAddr(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-transparent text-sm mono outline-none placeholder:opacity-40"
                        style={{ color: isValidAddress(agentAddr) ? "var(--ink)" : agentAddr ? "var(--danger)" : "var(--ink)" }}
                      />
                    </Field>

                    <Field
                      label="Total Budget (USDC)"
                      hint={balanceFmt ? `Balance: ${balanceFmt} USDC` : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          value={budgetStr} onChange={(e) => setBudgetStr(e.target.value.replace(/[^0-9.]/g, ""))}
                          inputMode="decimal" placeholder="0.00"
                          className="flex-1 bg-transparent display text-lg font-700 tabular-nums outline-none placeholder:opacity-30"
                          style={{ color: "var(--ink)" }}
                        />
                        <span className="text-xs font-medium" style={{ color: "var(--subtle)" }}>USDC</span>
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Daily Limit">
                        <input
                          value={dailyStr} onChange={(e) => setDailyStr(e.target.value.replace(/[^0-9.]/g, ""))}
                          inputMode="decimal" placeholder="0 = unlimited"
                          className="w-full bg-transparent text-sm tabular-nums outline-none placeholder:opacity-40"
                          style={{ color: "var(--ink)" }}
                        />
                      </Field>
                      <Field label="Per-Tx Limit">
                        <input
                          value={perTxStr} onChange={(e) => setPerTxStr(e.target.value.replace(/[^0-9.]/g, ""))}
                          inputMode="decimal" placeholder="0 = unlimited"
                          className="w-full bg-transparent text-sm tabular-nums outline-none placeholder:opacity-40"
                          style={{ color: "var(--ink)" }}
                        />
                      </Field>
                    </div>

                    <Field label="Duration (days, 0 = no expiry)">
                      <input
                        value={expiryDays} onChange={(e) => setExpiryDays(e.target.value.replace(/[^0-9]/g, ""))}
                        inputMode="numeric" placeholder="0"
                        className="w-full bg-transparent text-sm tabular-nums outline-none placeholder:opacity-40"
                        style={{ color: "var(--ink)" }}
                      />
                    </Field>
                  </div>

                  {/* Notice */}
                  {!CONTRACT_ADDRESS && (
                    <div
                      className="mt-4 flex items-start gap-2 rounded-xl p-3 text-xs"
                      style={{ background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.15)", color: "var(--warning)" }}
                    >
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      Contract not deployed yet. Deploy AgentVault to Arc Testnet first.
                    </div>
                  )}

                  {needsApproval && formValid && (
                    <div
                      className="mt-4 flex items-start gap-2 rounded-xl p-3 text-xs"
                      style={{ background: "rgba(172,198,233,0.05)", border: "1px solid rgba(172,198,233,0.12)", color: "var(--muted)" }}
                    >
                      <Info className="size-4 shrink-0 mt-0.5" />
                      You'll first approve the vault contract to spend {budgetStr} USDC from your wallet (2 transactions total).
                    </div>
                  )}

                  <button
                    onClick={handlePrimary}
                    disabled={!formValid || isPending}
                    className="mt-5 w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "var(--accent)", color: "#0a1525" }}
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-3" style={{ background: "var(--surface-strong)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
          {label}
        </label>
        {hint && <span className="text-[11px]" style={{ color: "var(--subtle)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
