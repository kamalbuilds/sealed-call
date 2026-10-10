// A devnet-only throwaway wallet kept in this browser's localStorage, so a judge can try the
// full flow without installing a wallet. It signs real devnet transactions; the key never leaves the page.
import { BaseSignerWalletAdapter, WalletName, WalletReadyState, WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { Keypair, PublicKey, Transaction, VersionedTransaction, TransactionVersion } from "@solana/web3.js";

export const BURNER_KEY = "sealed-call:devnet-burner";
export const BurnerWalletName = "Devnet burner (this browser)" as WalletName<"Devnet burner (this browser)">;
const ICON = "data:image/svg+xml;base64," + (typeof btoa === "function" ? btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#1c1a17"/><circle cx="16" cy="16" r="9" fill="none" stroke="#efe6d2" stroke-width="2"/></svg>') : "");

export function loadBurner(): Keypair {
  const raw = localStorage.getItem(BURNER_KEY);
  if (raw) return Keypair.fromSecretKey(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)));
  const kp = Keypair.generate();
  localStorage.setItem(BURNER_KEY, btoa(String.fromCharCode(...kp.secretKey)));
  return kp;
}

export class BurnerWalletAdapter extends BaseSignerWalletAdapter {
  name = BurnerWalletName;
  url = "https://sealed-call.pages.dev/try/";
  icon = ICON;
  supportedTransactionVersions: ReadonlySet<TransactionVersion> = new Set(["legacy", 0] as TransactionVersion[]);
  private kp: Keypair | null = null;
  get connecting() { return false; }
  get publicKey(): PublicKey | null { return this.kp?.publicKey ?? null; }
  get readyState() { return typeof window === "undefined" ? WalletReadyState.Unsupported : WalletReadyState.Loadable; }
  async connect() { this.kp = loadBurner(); this.emit("connect", this.kp.publicKey); }
  async disconnect() { this.kp = null; this.emit("disconnect"); }
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    if (!this.kp) throw new WalletNotConnectedError();
    if (tx instanceof VersionedTransaction) tx.sign([this.kp]); else (tx as Transaction).partialSign(this.kp);
    return tx;
  }
}
