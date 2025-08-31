import { PublicKey } from "@solana/web3.js";

export const short = (s: string, n = 6) => `${s.slice(0, n)}…${s.slice(-n)}`;
export const toHex = (bytes: Uint8Array) => Buffer.from(bytes).toString("hex");

export const isValidPubkey = (v: string) => {
  try {
    new PublicKey(v);
    return true;
  } catch {
    return false;
  }
};
